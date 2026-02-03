import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AppBindings } from "../types";
import { register } from "../usecases/register.usecase";
import { login } from "../usecases/login.usecase";
import { logout } from "../usecases/logout.usecase";
import { getMe } from "../usecases/get-me.usecase";
import { createD1UserRepository } from "../repositories/d1/user.d1";
import { createD1SessionRepository } from "../repositories/d1/session.d1";
import {
  createPasswordService,
  createTokenService,
} from "../services/auth.impl";
import { errorToHttpStatus, errorToMessage } from "../usecases/errors";

const auth = new Hono<AppBindings>();

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  timezone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

auth.post("/register", zValidator("json", registerSchema), async (c) => {
  const body = c.req.valid("json");

  const result = await register(
    {
      userRepository: createD1UserRepository(c.env),
      sessionRepository: createD1SessionRepository(c.env),
      passwordService: createPasswordService(),
      tokenService: createTokenService(),
    },
    body,
  );

  if (!result.ok) {
    return c.json(
      { error: errorToMessage(result.error) },
      errorToHttpStatus(result.error),
    );
  }

  return c.json({
    data: {
      user: result.value.user,
      token: result.value.token,
    },
  });
});

auth.post("/login", zValidator("json", loginSchema), async (c) => {
  const body = c.req.valid("json");

  const result = await login(
    {
      userRepository: createD1UserRepository(c.env),
      sessionRepository: createD1SessionRepository(c.env),
      passwordService: createPasswordService(),
      tokenService: createTokenService(),
    },
    body,
  );

  if (!result.ok) {
    if (result.error.code === "UNAUTHORIZED") {
      return c.json({ error: "Invalid email or password" }, 401);
    }
    return c.json(
      { error: errorToMessage(result.error) },
      errorToHttpStatus(result.error),
    );
  }

  return c.json({
    data: {
      user: result.value.user,
      token: result.value.token,
    },
  });
});

auth.post("/logout", async (c) => {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  const result = await logout(
    { sessionRepository: createD1SessionRepository(c.env) },
    { token },
  );

  if (!result.ok) {
    return c.json(
      { error: errorToMessage(result.error) },
      errorToHttpStatus(result.error),
    );
  }

  return c.json({ data: { success: true } });
});

auth.get("/me", async (c) => {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  const result = await getMe(
    {
      userRepository: createD1UserRepository(c.env),
      sessionRepository: createD1SessionRepository(c.env),
    },
    { token },
  );

  if (!result.ok) {
    return c.json(
      { error: errorToMessage(result.error) },
      errorToHttpStatus(result.error),
    );
  }

  return c.json({
    data: {
      user: result.value.user,
    },
  });
});

export default auth;
