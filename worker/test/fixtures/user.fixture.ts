/**
 * User test fixtures
 */

import type { User } from "../../../shared/types";

let userIdCounter = 1;

export interface CreateUserOptions {
  id?: number;
  email?: string;
  name?: string;
  passwordHash?: string;
  timezone?: string;
  isAdmin?: boolean;
  createdAt?: string;
}

export function createUser(options: CreateUserOptions = {}): User {
  const id = options.id ?? userIdCounter++;
  return {
    id,
    email: options.email ?? `user${id}@example.com`,
    name: options.name ?? `User ${id}`,
    password_hash: options.passwordHash ?? "hashed:password123",
    timezone: options.timezone ?? "UTC",
    is_admin: options.isAdmin ?? false,
    created_at: options.createdAt ?? new Date().toISOString(),
  };
}

export function createAdmin(options: CreateUserOptions = {}): User {
  return createUser({ ...options, isAdmin: true });
}

export function resetUserIdCounter(): void {
  userIdCounter = 1;
}
