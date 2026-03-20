import { createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

const API_BASE = process.env.F1_PICKS_API_BASE;
if (!API_BASE) throw new Error("F1_PICKS_API_BASE env var not set");

let authToken: string | null = null;

async function ensureAuth(): Promise<string> {
  if (authToken) return authToken;

  const email = process.env.F1_PICKS_EMAIL;
  const password = process.env.F1_PICKS_PASSWORD;
  if (!email || !password) {
    throw new Error("F1_PICKS_EMAIL and F1_PICKS_PASSWORD env vars not set");
  }

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const json = await res.json() as { data?: { token?: string }; error?: string };
  const token = json.data?.token;
  if (!res.ok || !token) {
    throw new Error(json.error ?? `Login failed: HTTP ${res.status}`);
  }

  authToken = token;
  return authToken;
}

async function api(
  endpoint: string,
  options: { method?: string; body?: unknown } = {},
) {
  const token = await ensureAuth();
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) {
    return { error: (data as Record<string, unknown>).error ?? `HTTP ${res.status}`, status: res.status };
  }
  return data;
}

function text(obj: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(obj, null, 2) }] };
}

export const f1PicksServer = createSdkMcpServer({
  name: "f1picks",
  version: "1.0.0",
  tools: [
    tool(
      "get_current_race",
      "Get the current/next race in the season.",
      {},
      async () => text(await api("/races/current")),
    ),

    tool(
      "get_races",
      "Get all races in the season with their status (upcoming/in_progress/completed).",
      {},
      async () => text(await api("/races")),
    ),

    tool(
      "get_race_results",
      "Get results for a specific race by ID. Includes finishing positions and points.",
      { race_id: z.number().describe("The race ID") },
      async (args) => text(await api(`/races/${args.race_id}/results`)),
    ),

    tool(
      "get_drivers",
      "Get all drivers in the season.",
      {},
      async () => text(await api("/drivers")),
    ),

    tool(
      "get_available_drivers",
      "Get drivers available to pick (not yet used).",
      {},
      async () => text(await api("/drivers/available")),
    ),

    tool(
      "get_my_picks",
      "Get all picks made so far this season.",
      {},
      async () => text(await api("/picks")),
    ),

    tool(
      "get_leaderboard",
      "Get the current season leaderboard/standings.",
      {},
      async () => text(await api("/leaderboard")),
    ),

    tool(
      "submit_pick",
      "Submit a driver pick for a race.",
      {
        race_id: z.number().describe("The race ID to pick for"),
        driver_id: z.number().describe("The driver ID to pick"),
      },
      async (args) =>
        text(
          await api("/picks", {
            method: "POST",
            body: { race_id: args.race_id, driver_id: args.driver_id },
          }),
        ),
    ),
  ],
});
