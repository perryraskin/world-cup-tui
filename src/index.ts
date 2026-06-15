#!/usr/bin/env node
import { WorldCupCli } from "./app.js";

const options = parseArgs(process.argv.slice(2));
const app = new WorldCupCli(options);
await app.start();

function parseArgs(args: string[]) {
  const options = {
    refreshSeconds: 15,
    limit: 100,
    date: undefined as string | undefined,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];
    if (arg === "--refresh" && next) {
      options.refreshSeconds = Math.max(2, Number(next) || options.refreshSeconds);
      index += 1;
    } else if (arg === "--limit" && next) {
      options.limit = Math.max(1, Number.parseInt(next, 10) || options.limit);
      index += 1;
    } else if (arg === "--date" && next) {
      options.date = next.replaceAll("-", "");
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      console.log(`world-cup-tui

Usage:
  world-cup-tui [--refresh seconds] [--date YYYYMMDD] [--limit count]

Controls:
  j/k or arrows   move/scroll
  enter           open selected match
  b or esc        back
  r               refresh now
  o               open ESPN match page
  q               quit
`);
      process.exit(0);
    }
  }

  return options;
}
