import type { Result } from "../utils/result";
import type { UseCaseError } from "./errors";
import type { SessionRepository } from "../repositories/interfaces/session.repository";
import { ok } from "../utils/result";

export interface LogoutResult {
  success: boolean;
}

export interface LogoutDeps {
  sessionRepository: SessionRepository;
}

export interface LogoutInput {
  token: string | null;
}

export async function logout(
  deps: LogoutDeps,
  input: LogoutInput,
): Promise<Result<LogoutResult, UseCaseError>> {
  if (input.token) {
    await deps.sessionRepository.delete(input.token);
  }

  return ok({ success: true });
}
