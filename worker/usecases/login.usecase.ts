import type { User } from "../../shared/types";
import type { Result } from "../utils/result";
import type { UseCaseError } from "./errors";
import type { UserRepository } from "../repositories/interfaces/user.repository";
import type { SessionRepository } from "../repositories/interfaces/session.repository";
import type { PasswordService, TokenService } from "../services/auth.service";
import { ok, err } from "../utils/result";
import { unauthorized, validationError } from "./errors";

export interface PublicUser {
  id: number;
  email: string;
  name: string;
  timezone: string;
  is_admin: boolean;
  created_at: string;
}

export interface LoginResult {
  user: PublicUser;
  token: string;
}

export interface LoginDeps {
  userRepository: UserRepository;
  sessionRepository: SessionRepository;
  passwordService: PasswordService;
  tokenService: TokenService;
}

export interface LoginInput {
  email: string;
  password: string;
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

export async function login(
  deps: LoginDeps,
  input: LoginInput,
): Promise<Result<LoginResult, UseCaseError>> {
  if (!input.email) {
    return err(validationError("Email is required", "email"));
  }
  if (!input.password) {
    return err(validationError("Password is required", "password"));
  }

  const email = input.email.toLowerCase();

  const user = await deps.userRepository.getByEmail(email);
  if (!user) {
    return err(unauthorized());
  }

  const valid = await deps.passwordService.verify(
    input.password,
    user.password_hash,
  );
  if (!valid) {
    return err(unauthorized());
  }

  const token = deps.tokenService.generate();
  await deps.sessionRepository.create(user.id, token);

  return ok({
    user: toPublicUser(user),
    token,
  });
}
