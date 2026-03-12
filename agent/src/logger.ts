import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import * as fs from "fs";
import * as path from "path";

const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;

export async function runAndLog(agentQuery: AsyncIterable<SDKMessage>) {
  const runsDir = path.join(import.meta.dirname, "..", "runs");
  fs.mkdirSync(runsDir, { recursive: true });
  const logPath = path.join(runsDir, `${new Date().toISOString().replace(/[:.]/g, "-")}.jsonl`);
  const logStream = fs.createWriteStream(logPath, { flags: "a" });

  const t0 = Date.now();
  let turns = 0;

  process.stdout.write(bold("gravel") + dim(" · f1 picks agent\n"));
  process.stdout.write(dim("─".repeat(48) + "\n"));

  for await (const message of agentQuery) {
    logStream.write(JSON.stringify(message) + "\n");

    switch (message.type) {
      case "assistant":
        turns++;
        for (const block of message.message.content) {
          if (block.type === "thinking" && "thinking" in block) {
            const lines = (block.thinking as string).split("\n");
            const preview = lines.length > 3
              ? lines.slice(0, 3).join("\n") + `\n  … (${lines.length - 3} more lines)`
              : block.thinking;
            process.stdout.write(dim(`  thinking │ ${(preview as string).replace(/\n/g, "\n           │ ")}\n`));
          }
          if ("text" in block && block.type === "text") {
            process.stdout.write(block.text + "\n");
          }
          if (block.type === "tool_use") {
            const input = block.input as Record<string, unknown>;
            const compact = Object.entries(input)
              .map(([k, v]) => {
                const s = typeof v === "string" ? v : JSON.stringify(v);
                return `${dim(k + "=")}${s.length > 60 ? s.slice(0, 57) + "…" : s}`;
              })
              .join(" ");
            process.stdout.write(cyan(`  ▸ ${block.name}`) + ` ${compact}\n`);
          }
        }
        break;

      case "user":
        if (message.tool_use_result != null) {
          const result = message.tool_use_result;
          const raw = typeof result === "string" ? result : JSON.stringify(result);
          const lines = raw.split("\n");
          const preview = lines.length > 6
            ? lines.slice(0, 6).join("\n") + `\n    … ${lines.length - 6} more lines`
            : raw;
          process.stdout.write(dim(`    ← ${preview.replace(/\n/g, "\n      ")}\n`));
        }
        break;

      case "result": {
        const msg = message as Record<string, unknown>;
        const cost = "total_cost_usd" in msg ? (msg.total_cost_usd as number) : 0;
        const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
        process.stdout.write(dim("─".repeat(48) + "\n"));
        process.stdout.write(green("done") + dim(` · ${turns} turns · ${elapsed}s · $${cost.toFixed(4)}\n`));
        break;
      }
    }
  }

  logStream.end();
  process.stderr.write(dim(`log: ${logPath}\n`));
}
