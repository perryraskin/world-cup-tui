import { describe, expect, it } from "vitest";
import { renderList } from "../format.js";
import type { MatchSummary } from "../types.js";

describe("rendering", () => {
  it("renders a scoreboard row", () => {
    const matches: MatchSummary[] = [
      {
        id: "1",
        name: "Spain at Cape Verde",
        shortName: "CPV @ ESP",
        date: "2026-06-15T16:00Z",
        status: "First Half",
        statusDetail: "12'",
        state: "in",
        away: {
          id: "cpv",
          name: "Cape Verde",
          shortName: "Cape Verde",
          abbreviation: "CPV",
          score: "0",
        },
        home: {
          id: "esp",
          name: "Spain",
          shortName: "Spain",
          abbreviation: "ESP",
          score: "1",
        },
        league: "FIFA World Cup",
      },
    ];

    expect(renderList(matches, 0, "Updated")).toContain("WORLD CUP LIVE");
    expect(renderList(matches, 0, "Updated")).toContain("CPV");
    expect(renderList(matches, 0, "Updated")).toContain("ESP");
  });
});
