import { query } from "@anthropic-ai/claude-agent-sdk";
import * as path from "path";
import { SYSTEM_PROMPT } from "./prompt.ts";
import { f1PicksServer } from "./f1-picks-server.ts";
import { guardHumanAnalysis, guardSubmitPick } from "./hooks.ts";
import { runAndLog } from "./logger.ts";

const agentQuery = query({
  prompt: "Figure out the current game state and act.",
  options: {
    systemPrompt: SYSTEM_PROMPT,
    cwd: path.resolve(import.meta.dirname, ".."),
    allowedTools: [
      "Read",
      "Write",
      "Edit",
      "Bash",
      "Glob",
      "Grep",
      "WebSearch",
      "WebFetch",
      "NotebookEdit",
      "mcp__exa__*",
      "mcp__f1picks__*",
    ],
    mcpServers: {
      exa: {
        type: "http",
        url: "https://mcp.exa.ai/mcp",
      },
      f1picks: f1PicksServer,
    },
    hooks: {
      PreToolUse: [
        { matcher: "*", hooks: [guardHumanAnalysis] },
        { matcher: "mcp__f1picks__submit_pick", hooks: [guardSubmitPick] },
      ],
    },
    persistSession: false,
    settingSources: [],
    permissionMode: "bypassPermissions",
    thinking: { type: "adaptive" },
    effort: "max",
    maxTurns: 100,
    model: "claude-opus-4-6",
  },
});

await runAndLog(agentQuery);
