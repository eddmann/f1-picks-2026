/**
 * Web Push service using Web Crypto API (Cloudflare Workers compatible).
 * Implements VAPID (RFC 8292) + payload encryption (RFC 8291, aes128gcm).
 */

export interface WebPushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface WebPushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export interface WebPushResult {
  success: boolean;
  statusCode?: number;
  gone?: boolean;
}

export interface WebPushService {
  sendNotification(
    subscription: WebPushSubscription,
    payload: WebPushPayload,
  ): Promise<WebPushResult>;
}

// --- Utility functions ---

function urlBase64ToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
}

function bufferToUrlBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function toBuffer(data: Uint8Array | ArrayBuffer): ArrayBuffer {
  if (data instanceof ArrayBuffer) return data;
  return data.buffer.slice(
    data.byteOffset,
    data.byteOffset + data.byteLength,
  ) as ArrayBuffer;
}

function concat(...parts: (ArrayBuffer | Uint8Array)[]): ArrayBuffer {
  const buffers = parts.map(toBuffer);
  const totalLength = buffers.reduce((sum, buf) => sum + buf.byteLength, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const buf of buffers) {
    result.set(new Uint8Array(buf), offset);
    offset += buf.byteLength;
  }
  return result.buffer as ArrayBuffer;
}

// --- VAPID JWT ---

async function createVapidJwt(
  audience: string,
  subject: string,
  publicKeyBase64: string,
  privateKeyBase64: string,
): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60,
    sub: subject,
  };

  const headerB64 = bufferToUrlBase64(
    toBuffer(new TextEncoder().encode(JSON.stringify(header))),
  );
  const payloadB64 = bufferToUrlBase64(
    toBuffer(new TextEncoder().encode(JSON.stringify(payload))),
  );

  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import the raw ECDSA P-256 private key via JWK
  // web-push generates raw 32-byte keys, not PKCS8
  const publicKeyBytes = new Uint8Array(urlBase64ToBuffer(publicKeyBase64));
  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    {
      kty: "EC",
      crv: "P-256",
      d: privateKeyBase64,
      x: bufferToUrlBase64(toBuffer(publicKeyBytes.slice(1, 33))),
      y: bufferToUrlBase64(toBuffer(publicKeyBytes.slice(33, 65))),
    },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    toBuffer(new TextEncoder().encode(unsignedToken)),
  );

  // Convert DER signature to raw r||s format (64 bytes)
  const rawSignature = derToRaw(new Uint8Array(signature));

  const signatureB64 = bufferToUrlBase64(toBuffer(rawSignature));

  return `${unsignedToken}.${signatureB64}`;
}

/**
 * Convert DER-encoded ECDSA signature to raw r||s format.
 * Web Crypto may return either format depending on the platform.
 */
function derToRaw(der: Uint8Array): Uint8Array {
  // If it's already 64 bytes, assume it's raw
  if (der.length === 64) return der;

  // DER format: 0x30 <len> 0x02 <rLen> <r> 0x02 <sLen> <s>
  if (der[0] !== 0x30) return der;

  let offset = 2;
  // r
  if (der[offset] !== 0x02) return der;
  offset++;
  const rLen = der[offset];
  offset++;
  const r = der.slice(offset, offset + rLen);
  offset += rLen;
  // s
  if (der[offset] !== 0x02) return der;
  offset++;
  const sLen = der[offset];
  offset++;
  const s = der.slice(offset, offset + sLen);

  const raw = new Uint8Array(64);
  // Right-align r and s in 32-byte fields (strip leading zeros)
  raw.set(
    r.length > 32 ? r.slice(r.length - 32) : r,
    32 - Math.min(r.length, 32),
  );
  raw.set(
    s.length > 32 ? s.slice(s.length - 32) : s,
    64 - Math.min(s.length, 32),
  );

  return raw;
}

// --- Payload encryption (RFC 8291, aes128gcm) ---

async function encryptPayload(
  plaintext: ArrayBuffer,
  p256dhBase64: string,
  authBase64: string,
): Promise<{ ciphertext: ArrayBuffer; localPublicKey: ArrayBuffer }> {
  // Generate local ECDH key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  );

  const localPublicKey = await crypto.subtle.exportKey(
    "raw",
    localKeyPair.publicKey,
  );

  // Import subscriber's public key
  const subscriberPublicKeyBuffer = urlBase64ToBuffer(p256dhBase64);
  const subscriberPublicKey = await crypto.subtle.importKey(
    "raw",
    subscriberPublicKeyBuffer,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );

  // ECDH shared secret
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: "ECDH", public: subscriberPublicKey },
    localKeyPair.privateKey,
    256,
  );

  const authSecret = urlBase64ToBuffer(authBase64);

  // Generate 16-byte salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // IKM = HKDF(auth_secret, shared_secret, "WebPush: info" || 0x00 || subscriber_key || local_key, 32)
  const ikmInfo = concat(
    new TextEncoder().encode("WebPush: info\0"),
    subscriberPublicKeyBuffer,
    localPublicKey,
  );
  const ikm = await hkdf(authSecret, sharedSecret, ikmInfo, 32);

  // Content-Encryption Key
  const cekInfo = toBuffer(
    new TextEncoder().encode("Content-Encoding: aes128gcm\0"),
  );
  const contentEncryptionKey = await hkdf(toBuffer(salt), ikm, cekInfo, 16);

  // Nonce
  const nonceInfo = toBuffer(
    new TextEncoder().encode("Content-Encoding: nonce\0"),
  );
  const nonce = await hkdf(toBuffer(salt), ikm, nonceInfo, 12);

  // Pad plaintext: add delimiter byte 0x02
  const padded = concat(plaintext, new Uint8Array([2]));

  // Encrypt with AES-128-GCM
  const aesKey = await crypto.subtle.importKey(
    "raw",
    contentEncryptionKey,
    "AES-GCM",
    false,
    ["encrypt"],
  );

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce, tagLength: 128 },
    aesKey,
    padded,
  );

  // aes128gcm header: salt (16) || rs (4) || idlen (1) || keyid (65) || ciphertext
  const rs = new ArrayBuffer(4);
  new DataView(rs).setUint32(0, 4096);

  const idlen = new Uint8Array([65]); // Uncompressed P-256 key is 65 bytes

  const ciphertext = concat(salt, rs, idlen, localPublicKey, encrypted);

  return { ciphertext, localPublicKey };
}

async function hkdf(
  salt: ArrayBuffer,
  ikm: ArrayBuffer,
  info: ArrayBuffer,
  length: number,
): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey("raw", ikm, "HKDF", false, [
    "deriveBits",
  ]);
  return crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info },
    key,
    length * 8,
  );
}

// --- Public API ---

export function createWebPushService(
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string,
): WebPushService {
  return {
    async sendNotification(
      subscription: WebPushSubscription,
      payload: WebPushPayload,
    ): Promise<WebPushResult> {
      try {
        const url = new URL(subscription.endpoint);
        const audience = `${url.protocol}//${url.host}`;

        const jwt = await createVapidJwt(
          audience,
          vapidSubject,
          vapidPublicKey,
          vapidPrivateKey,
        );

        const plaintextBytes = toBuffer(
          new TextEncoder().encode(JSON.stringify(payload)),
        );

        const { ciphertext } = await encryptPayload(
          plaintextBytes,
          subscription.p256dh,
          subscription.auth,
        );

        const response = await fetch(subscription.endpoint, {
          method: "POST",
          headers: {
            Authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
            "Content-Encoding": "aes128gcm",
            "Content-Type": "application/octet-stream",
            TTL: "86400",
            Urgency: "normal",
          },
          body: ciphertext,
        });

        if (response.status === 410 || response.status === 404) {
          return { success: false, statusCode: response.status, gone: true };
        }

        return {
          success: response.status >= 200 && response.status < 300,
          statusCode: response.status,
          gone: false,
        };
      } catch {
        return { success: false, gone: false };
      }
    },
  };
}
