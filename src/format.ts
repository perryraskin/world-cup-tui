import type { MatchDetail, MatchSummary, TeamStat, TimelineEvent } from "./types.js";

const colors = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  gray: "\x1b[90m",
  inverse: "\x1b[7m",
};

export function renderList(matches: MatchSummary[], selected: number, message: string): string {
  const { columns, rows } = process.stdout;
  const width = columns || 120;
  const height = rows || 36;
  const lines: string[] = [];
  lines.push(frameLine(width));
  lines.push(pad(`${colors.bold}${colors.cyan}WORLD CUP LIVE${colors.reset}  ${colors.dim}${new Date().toLocaleTimeString()}${colors.reset}`, width));
  lines.push(frameLine(width));
  if (message) lines.push(pad(`${colors.yellow}${message}${colors.reset}`, width));
  if (matches.length === 0) {
    lines.push("");
    lines.push("No matches returned for this query.");
  } else {
    const visible = matches.slice(Math.max(0, selected - Math.floor((height - 8) / 2)), Math.max(0, selected - Math.floor((height - 8) / 2)) + height - 7);
    for (const match of visible) {
      const index = matches.indexOf(match);
      const prefix = index === selected ? `${colors.inverse}>${colors.reset}` : " ";
      lines.push(`${prefix} ${formatMatchRow(match, width - 3)}`);
    }
  }
  lines.push("");
  lines.push(`${colors.dim}j/k or arrows move • enter open match • r refresh • o open ESPN • q quit${colors.reset}`);
  return fit(lines, height).join("\n");
}

export function renderDetail(detail: MatchDetail, scroll: number, message: string): string {
  const { columns, rows } = process.stdout;
  const width = columns || 140;
  const height = rows || 40;
  const leftWidth = Math.min(52, Math.max(36, Math.floor(width * 0.34)));
  const rightWidth = width - leftWidth - 3;
  const bodyHeight = height - 6;
  const left = renderMatchPanel(detail, leftWidth, bodyHeight);
  const right = renderTimelinePanel(detail.timeline, scroll, rightWidth, bodyHeight);
  const lines: string[] = [];
  lines.push(frameLine(width));
  lines.push(pad(`${colors.bold}${colors.cyan}${detail.match.shortName || detail.match.name}${colors.reset}  ${scoreline(detail.match)}  ${colors.dim}${detail.match.statusDetail || detail.match.status}${colors.reset}`, width));
  lines.push(frameLine(width));
  if (message) lines.push(pad(`${colors.yellow}${message}${colors.reset}`, width));
  for (let i = 0; i < bodyHeight; i += 1) {
    lines.push(`${pad(left[i] ?? "", leftWidth)} ${colors.gray}│${colors.reset} ${truncateAnsi(right[i] ?? "", rightWidth)}`);
  }
  lines.push(`${colors.dim}j/k scroll • r refresh • o open ESPN • b/esc back • q quit${colors.reset}`);
  return fit(lines, height).join("\n");
}

function renderMatchPanel(detail: MatchDetail, width: number, height: number): string[] {
  const match = detail.match;
  const lines = [
    `${colors.bold}MATCH${colors.reset}`,
    `${match.away.name} ${colors.bold}${match.away.score}${colors.reset}`,
    `${match.home.name} ${colors.bold}${match.home.score}${colors.reset}`,
    `${colors.dim}${match.status}${match.statusDetail ? ` • ${match.statusDetail}` : ""}${colors.reset}`,
    match.venue ? `${colors.dim}${match.venue}${match.city ? `, ${match.city}` : ""}${colors.reset}` : "",
    "",
    `${colors.bold}TEAM STATS${colors.reset}`,
    ...detail.stats.slice(0, Math.max(0, height - 8)).map((stat) => formatStat(stat, width)),
  ].filter(Boolean);
  return lines.map((line) => truncateAnsi(line, width));
}

function renderTimelinePanel(events: TimelineEvent[], scroll: number, width: number, height: number): string[] {
  const lines = [`${colors.bold}PLAY-BY-PLAY${colors.reset}`];
  if (events.length === 0) {
    lines.push(`${colors.dim}No commentary available yet.${colors.reset}`);
    return lines;
  }
  for (const event of events.slice(scroll, scroll + Math.max(1, height - 1))) {
    const minute = event.minute ? event.minute.padStart(4) : "    ";
    const typeColor = event.important ? colors.yellow : colors.cyan;
    lines.push(`${colors.gray}${minute}${colors.reset} ${typeColor}${truncate(event.type, 14).padEnd(14)}${colors.reset} ${truncate(event.text, width - 22)}`);
  }
  return lines.map((line) => truncateAnsi(line, width));
}

function formatMatchRow(match: MatchSummary, width: number): string {
  const live = match.state === "in" ? colors.green : match.state === "post" ? colors.gray : colors.yellow;
  const label = match.state === "pre" ? kickoffLabel(match.date) : (match.statusDetail || match.status);
  const row = `${live}${label.padEnd(10)}${colors.reset} ${match.away.abbreviation.padEnd(4)} ${match.away.score.padStart(2)}  -  ${match.home.score.padEnd(2)} ${match.home.abbreviation.padEnd(4)} ${colors.dim}${match.venue ?? ""}${colors.reset}`;
  return truncateAnsi(row, width);
}

function formatStat(stat: TeamStat, width: number): string {
  const nameWidth = Math.max(8, width - 18);
  return `${stat.away.padStart(6)} ${truncate(humanizeStat(stat.name), nameWidth).padEnd(nameWidth)} ${stat.home.padStart(6)}`;
}

function scoreline(match: MatchSummary): string {
  return `${match.away.abbreviation} ${match.away.score} - ${match.home.score} ${match.home.abbreviation}`;
}

function frameLine(width: number): string {
  return colors.gray + "─".repeat(Math.max(1, width)) + colors.reset;
}

function kickoffLabel(date: string): string {
  const parsed = Date.parse(date);
  if (!Number.isFinite(parsed)) return "scheduled";
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(parsed));
}

function humanizeStat(name: string): string {
  return name
    .replace(/Pct$/, "%")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function fit(lines: string[], height: number): string[] {
  return lines.slice(0, Math.max(1, height));
}

function pad(value: string, width: number): string {
  const clipped = truncateAnsi(value, width);
  return clipped + " ".repeat(Math.max(0, width - visibleLength(clipped)));
}

function truncateAnsi(value: string, width: number): string {
  const cleaned = value.replace(/[\r\n\t]+/g, " ");
  const plain = stripAnsi(cleaned);
  if (plain.length <= width) return cleaned;
  return truncate(plain, width);
}

function visibleLength(value: string): number {
  return stripAnsi(value).length;
}

function stripAnsi(value: string): string {
  return value.replace(/\x1b\[[0-9;]*m/g, "");
}

function truncate(value: string, width: number): string {
  if (width <= 1) return value.slice(0, Math.max(0, width));
  return value.length > width ? `${value.slice(0, width - 1)}…` : value;
}
