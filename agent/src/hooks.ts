import type { HookCallback, PreToolUseHookInput } from "@anthropic-ai/claude-agent-sdk";
import * as readline from "readline";
import * as path from "path";

function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
  });
  return new Promise((resolve) => {
    rl.question(`\n⚠️  ${question} [y/N] `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}

const AGENT_DIR = path.resolve(import.meta.dirname, "..");
const HUMAN_ANALYSIS_DIR = path.resolve(AGENT_DIR, "..", "analysis");

function isHumanAnalysisPath(filePath: string): boolean {
  const resolved = path.resolve(AGENT_DIR, filePath);
  return resolved === HUMAN_ANALYSIS_DIR || resolved.startsWith(HUMAN_ANALYSIS_DIR + path.sep);
}

export const guardHumanAnalysis: HookCallback = async (input) => {
  const preInput = input as PreToolUseHookInput;
  const toolInput = preInput.tool_input as Record<string, unknown>;

  const filePath = (toolInput.file_path ?? toolInput.path ?? toolInput.pattern) as string | undefined;
  if (typeof filePath === "string" && isHumanAnalysisPath(filePath)) {
    return {
      hookSpecificOutput: {
        hookEventName: preInput.hook_event_name,
        permissionDecision: "deny",
        permissionDecisionReason: "Access to the root analysis/ directory is not allowed. Use agent/analysis/ instead.",
      },
    };
  }

  if (preInput.tool_name === "Bash" && typeof toolInput.command === "string") {
    if (toolInput.command.includes(HUMAN_ANALYSIS_DIR) || /(?<!\/)\banalysis\//.test(toolInput.command)) {
      return {
        hookSpecificOutput: {
          hookEventName: preInput.hook_event_name,
          permissionDecision: "deny",
          permissionDecisionReason: "Access to the root analysis/ directory is not allowed. Use agent/analysis/ instead.",
        },
      };
    }
  }

  return {};
};

export const guardSubmitPick: HookCallback = async (input) => {
  const preInput = input as PreToolUseHookInput;
  const toolInput = preInput.tool_input as Record<string, unknown>;

  const ok = await confirm(
    `Gravel wants to submit pick: driver_id=${toolInput.driver_id} for race_id=${toolInput.race_id}. Allow?`,
  );

  return {
    hookSpecificOutput: {
      hookEventName: preInput.hook_event_name,
      permissionDecision: ok ? "allow" : "deny",
      ...(ok ? {} : { permissionDecisionReason: "User declined the pick submission." }),
    },
  };
};
