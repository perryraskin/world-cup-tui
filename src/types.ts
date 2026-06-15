export interface TeamSide {
  id: string;
  name: string;
  shortName: string;
  abbreviation: string;
  score: string;
  winner?: boolean;
}

export interface MatchSummary {
  id: string;
  name: string;
  shortName: string;
  date: string;
  status: string;
  statusDetail: string;
  state: "pre" | "in" | "post" | string;
  home: TeamSide;
  away: TeamSide;
  venue?: string;
  city?: string;
  league: string;
  espnUrl?: string;
}

export interface TimelineEvent {
  id: string;
  minute: string;
  type: string;
  team?: string;
  text: string;
  important: boolean;
  wallclock?: string;
}

export interface TeamStat {
  name: string;
  home: string;
  away: string;
}

export interface MatchDetail {
  match: MatchSummary;
  timeline: TimelineEvent[];
  stats: TeamStat[];
  updatedAt: string;
}
