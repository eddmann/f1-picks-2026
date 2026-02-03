import { describe, test, expect } from "bun:test";
import { createHttpEnv, requestJson } from "./helpers";

describe("HTTP /api/health", () => {
  test("returns ok status", async () => {
    const env = await createHttpEnv();

    const { res, body } = await requestJson<{ status: string }>(
      env,
      "/api/health",
    );

    expect(res.status).toBe(200);
    expect(body.status).toBe("ok");
  });
});
