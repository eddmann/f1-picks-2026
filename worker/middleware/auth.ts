import { createMiddleware } from "hono/factory";
import type { Env, User, Session, AppBindings } from "../types";

export async function getAuthenticatedUser(
  request: Request,
  env: Env,
): Promise<User | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  if (!token) {
    return null;
  }

  const session = await env.DB.prepare(
    "SELECT * FROM sessions WHERE token = ? AND expires_at > datetime('now')",
  )
    .bind(token)
    .first<Session>();

  if (!session) {
    return null;
  }

  const user = await env.DB.prepare("SELECT * FROM users WHERE id = ?")
    .bind(session.user_id)
    .first<User>();

  return user || null;
}

export const authMiddleware = createMiddleware<AppBindings>(async (c, next) => {
  const user = await getAuthenticatedUser(c.req.raw, c.env);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  c.set("user", user);
  await next();
});

export const adminMiddleware = createMiddleware<AppBindings>(
  async (c, next) => {
    const user = await getAuthenticatedUser(c.req.raw, c.env);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    if (!user.is_admin) {
      return c.json({ error: "Forbidden" }, 403);
    }
    c.set("user", user);
    await next();
  },
);
