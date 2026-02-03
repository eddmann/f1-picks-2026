import type { User } from "../../shared/types";
import type { Result } from "../utils/result";
import type { UseCaseError } from "./errors";
import type { UserRepository } from "../repositories/interfaces/user.repository";
import type { SessionRepository } from "../repositories/interfaces/session.repository";
import { ok, err } from "../utils/result";
import { unauthorized } from "./errors";

export interface PublicUser {
  id: number;
  email: string;
  name: string;
  timezone: string;
  is_admin: boolean;
  created_at: string;
}

export interface GetMeResult {
  user: PublicUser;
}

export interface GetMeDeps {
  userRepository: UserRepository;
  sessionRepository: SessionRepository;
}

export interface GetMeInput {
  token: string | null;
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

export async function getMe(
  deps: GetMeDeps,
  input: GetMeInput,
): Promise<Result<GetMeResult, UseCaseError>> {
  if (!input.token) {
    return err(unauthorized());
  }

  const session = await deps.sessionRepository.getValidSession(input.token);
  if (!session) {
    return err(unauthorized());
  }

  const user = await deps.userRepository.getById(session.user_id);
  if (!user) {
    return err(unauthorized());
  }

  return ok({
    user: toPublicUser(user),
  });
}
