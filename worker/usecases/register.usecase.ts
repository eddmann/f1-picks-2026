import type { User } from "../../shared/types";
import type { Result } from "../utils/result";
import type { UseCaseError } from "./errors";
import type { UserRepository } from "../repositories/interfaces/user.repository";
import type { SessionRepository } from "../repositories/interfaces/session.repository";
import type { PasswordService, TokenService } from "../services/auth.service";
import { ok, err } from "../utils/result";
import { conflict, validationError } from "./errors";

export interface PublicUser {
  id: number;
  email: string;
  name: string;
  timezone: string;
  is_admin: boolean;
  created_at: string;
}

export interface RegisterResult {
  user: PublicUser;
  token: string;
}

export interface RegisterDeps {
  userRepository: UserRepository;
  sessionRepository: SessionRepository;
  passwordService: PasswordService;
  tokenService: TokenService;
}

export interface RegisterInput {
  email: string;
  name: string;
  password: string;
  timezone?: string;
}

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    timezone: user.timezone,
    is_admin: Boolean(user.is_admin),
    created_at: user.created_at,
  };
}

export async function register(
  deps: RegisterDeps,
  input: RegisterInput,
): Promise<Result<RegisterResult, UseCaseError>> {
  if (!input.email || !input.email.includes("@")) {
    return err(validationError("Invalid email address", "email"));
  }

  if (!input.name || input.name.trim().length === 0) {
    return err(validationError("Name is required", "name"));
  }

  if (!input.password || input.password.length < 6) {
    return err(
      validationError("Password must be at least 6 characters", "password"),
    );
  }

  const email = input.email.toLowerCase();

  const existing = await deps.userRepository.getByEmail(email);
  if (existing) {
    return err(conflict("Email already registered"));
  }

  const passwordHash = await deps.passwordService.hash(input.password);
  const timezone = input.timezone || "UTC";

  const user = await deps.userRepository.create(
    email,
    input.name,
    passwordHash,
    timezone,
  );

  const token = deps.tokenService.generate();
  await deps.sessionRepository.create(user.id, token);

  return ok({
    user: toPublicUser(user),
    token,
  });
}
