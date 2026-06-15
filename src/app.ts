import { spawn } from "node:child_process";
import { fetchMatchDetail, fetchScoreboard } from "./espn.js";
import { renderDetail, renderList } from "./format.js";
import type { MatchDetail, MatchSummary } from "./types.js";

export interface AppOptions {
  refreshSeconds: number;
  date?: string;
  limit: number;
}

export class WorldCupCli {
  private matches: MatchSummary[] = [];
  private detail?: MatchDetail;
  private selected = 0;
  private scroll = 0;
  private timer?: NodeJS.Timeout;
  private message = "Loading...";
  private closed = false;

  constructor(private readonly options: AppOptions) {}

  async start(): Promise<void> {
    process.stdin.setRawMode?.(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (key: Buffer | string) => void this.handleKey(String(key)));
    process.stdout.write("\x1b[?1049h\x1b[?25l");
    process.on("SIGINT", () => this.stop());
    process.stdout.on("resize", () => this.render());
    await this.refresh();
    this.timer = setInterval(() => {
      void this.refresh();
    }, this.options.refreshSeconds * 1000);
  }

  stop(): void {
    if (this.closed) return;
    this.closed = true;
    if (this.timer) clearInterval(this.timer);
    process.stdin.setRawMode?.(false);
    process.stdin.pause();
    process.stdout.write("\x1b[?25h\x1b[?1049l");
  }

  private async refresh(): Promise<void> {
    try {
      this.matches = await fetchScoreboard({
        date: this.options.date,
        limit: this.options.limit,
      });
      if (this.matches.length > 0) {
        this.selected = clamp(this.selected, 0, this.matches.length - 1);
      }
      if (this.detail) {
        const current = this.matches.find((match) => match.id === this.detail?.match.id) ?? this.detail.match;
        this.detail = await fetchMatchDetail(current);
      }
      this.message = `Updated ${new Date().toLocaleTimeString()} • auto-refresh ${this.options.refreshSeconds}s`;
    } catch (error) {
      this.message = error instanceof Error ? error.message : String(error);
    }
    this.render();
  }

  private async openSelected(): Promise<void> {
    const match = this.matches[this.selected];
    if (!match) return;
    this.message = "Loading match detail...";
    this.render();
    try {
      this.detail = await fetchMatchDetail(match);
      this.scroll = 0;
      this.message = `Updated ${new Date().toLocaleTimeString()}`;
    } catch (error) {
      this.message = error instanceof Error ? error.message : String(error);
    }
    this.render();
  }

  private async handleKey(key: string): Promise<void> {
    if (key === "\u0003" || key === "q") return this.stop();
    if (key === "r") return this.refresh();
    if (key === "o") return this.openEspn();
    if (key === "\r") return this.detail ? undefined : this.openSelected();
    if (key === "b" || key === "\u001b") {
      this.detail = undefined;
      this.scroll = 0;
      this.render();
      return;
    }

    const down = key === "j" || key === "\u001b[B";
    const up = key === "k" || key === "\u001b[A";
    if (!down && !up) return;

    if (this.detail) {
      const maxScroll = Math.max(0, this.detail.timeline.length - 1);
      this.scroll = clamp(this.scroll + (down ? 1 : -1), 0, maxScroll);
    } else {
      this.selected = clamp(this.selected + (down ? 1 : -1), 0, Math.max(0, this.matches.length - 1));
    }
    this.render();
  }

  private openEspn(): void {
    const match = this.detail?.match ?? this.matches[this.selected];
    if (!match?.espnUrl) {
      this.message = "No ESPN URL available for this match.";
      this.render();
      return;
    }
    spawn("open", [match.espnUrl], { detached: true, stdio: "ignore" }).unref();
    this.message = "Opened selected match on ESPN.";
    this.render();
  }

  private render(): void {
    if (this.closed) return;
    const output = this.detail
      ? renderDetail(this.detail, this.scroll, this.message)
      : renderList(this.matches, this.selected, this.message);
    process.stdout.write(`\x1b[H\x1b[2J${output}`);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
