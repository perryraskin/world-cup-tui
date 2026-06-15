import type { MatchDetail, MatchSummary, TeamSide, TeamStat, TimelineEvent } from "./types.js";

const SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";
const SUMMARY_URL =
  "https://site.web.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary";

export interface ScoreboardOptions {
  date?: string;
  limit?: number;
}

export async function fetchScoreboard(options: ScoreboardOptions = {}): Promise<MatchSummary[]> {
  const url = new URL(SCOREBOARD_URL);
  url.searchParams.set("limit", String(options.limit ?? 100));
  if (options.date) url.searchParams.set("dates", options.date);

  const json = await fetchJson(url);
  const league = String(json.leagues?.[0]?.name ?? "FIFA World Cup");
  const events = Array.isArray(json.events) ? json.events : [];
  return events.map((event: any) => parseScoreboardEvent(event, league)).filter(Boolean);
}

export async function fetchMatchDetail(match: MatchSummary): Promise<MatchDetail> {
  const url = new URL(SUMMARY_URL);
  url.searchParams.set("event", match.id);
  const json = await fetchJson(url);
  const headerMatch = parseSummaryHeader(json, match);
  return {
    match: headerMatch,
    timeline: parseTimeline(json),
    stats: parseStats(json),
    updatedAt: new Date().toISOString(),
  };
}

async function fetchJson(url: URL): Promise<any> {
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "world-cup-cli/0.1",
    },
  });
  if (!response.ok) {
    throw new Error(`ESPN request failed ${response.status}: ${url.toString()}`);
  }
  return response.json();
}

function parseScoreboardEvent(event: any, league: string): MatchSummary {
  const competition = event.competitions?.[0];
  const competitors = Array.isArray(competition?.competitors) ? competition.competitors : [];
  const homeRaw = competitors.find((item: any) => item.homeAway === "home") ?? competitors[0];
  const awayRaw = competitors.find((item: any) => item.homeAway === "away") ?? competitors[1];
  const status = event.status?.type ?? {};
  return {
    id: String(competition?.id ?? event.id),
    name: String(event.name ?? ""),
    shortName: String(event.shortName ?? event.name ?? ""),
    date: String(event.date ?? competition?.date ?? ""),
    status: String(status.description ?? status.name ?? ""),
    statusDetail: String(status.detail ?? status.shortDetail ?? ""),
    state: String(status.state ?? "pre"),
    home: parseTeam(homeRaw),
    away: parseTeam(awayRaw),
    venue: competition?.venue?.fullName,
    city: competition?.venue?.address?.city,
    league,
    espnUrl: event.links?.[0]?.href ?? competition?.links?.[0]?.href,
  };
}

function parseSummaryHeader(json: any, fallback: MatchSummary): MatchSummary {
  const competition = json.header?.competitions?.[0];
  if (!competition) return fallback;
  const competitors = Array.isArray(competition.competitors) ? competition.competitors : [];
  const homeRaw = competitors.find((item: any) => item.homeAway === "home") ?? competitors[0];
  const awayRaw = competitors.find((item: any) => item.homeAway === "away") ?? competitors[1];
  const status = competition.status?.type ?? {};
  return {
    ...fallback,
    id: String(competition.id ?? fallback.id),
    name: String(json.header?.name ?? fallback.name),
    shortName: String(json.header?.shortName ?? fallback.shortName),
    date: String(competition.date ?? fallback.date),
    status: String(status.description ?? fallback.status),
    statusDetail: String(status.detail ?? status.shortDetail ?? fallback.statusDetail),
    state: String(status.state ?? fallback.state),
    home: parseTeam(homeRaw),
    away: parseTeam(awayRaw),
  };
}

function parseTeam(raw: any): TeamSide {
  const team = raw?.team ?? {};
  return {
    id: String(team.id ?? raw?.id ?? ""),
    name: String(team.displayName ?? team.name ?? "TBD"),
    shortName: String(team.shortDisplayName ?? team.shortName ?? team.displayName ?? "TBD"),
    abbreviation: String(team.abbreviation ?? team.shortDisplayName ?? "TBD"),
    score: String(raw?.score ?? "0"),
    winner: raw?.winner === true,
  };
}

function parseTimeline(json: any): TimelineEvent[] {
  const commentary = Array.isArray(json.commentary) ? json.commentary : [];
  const keyEvents = Array.isArray(json.keyEvents) ? json.keyEvents : [];
  const events = commentary.length > 0 ? commentary : keyEvents;
  return events
    .map((item: any, index: number) => {
      const play = item.play ?? item;
      const type = String(play.type?.text ?? item.type ?? "Update");
      return {
        id: String(play.id ?? item.id ?? `${item.sequence ?? index}`),
        minute: String(item.time?.displayValue ?? play.clock?.displayValue ?? ""),
        type,
        team: play.team?.displayName,
        text: String(item.text ?? play.text ?? play.shortText ?? ""),
        important: isImportant(type, String(item.text ?? play.text ?? "")),
        wallclock: play.wallclock,
      };
    })
    .filter((item: TimelineEvent) => item.text)
    .sort((a: TimelineEvent, b: TimelineEvent) => {
      const aw = a.wallclock ? Date.parse(a.wallclock) : 0;
      const bw = b.wallclock ? Date.parse(b.wallclock) : 0;
      if (aw !== bw) return bw - aw;
      return Number(b.id) - Number(a.id);
    });
}

function parseStats(json: any): TeamStat[] {
  const teams = json.boxscore?.teams;
  if (!Array.isArray(teams) || teams.length < 2) return [];
  const awayStats = Array.isArray(teams[0]?.statistics) ? teams[0].statistics : [];
  const homeStats = Array.isArray(teams[1]?.statistics) ? teams[1].statistics : [];
  return awayStats.map((away: any, index: number) => {
    const home = homeStats[index] ?? {};
    return {
      name: String(away.name ?? home.name ?? ""),
      away: String(away.displayValue ?? away.value ?? ""),
      home: String(home.displayValue ?? home.value ?? ""),
    };
  }).filter((stat: TeamStat) => stat.name);
}

function isImportant(type: string, text: string): boolean {
  return /goal|penalty|red card|yellow card|substitution|var/i.test(`${type} ${text}`);
}
