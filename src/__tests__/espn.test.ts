import { describe, expect, it } from "vitest";
import { renderDetail, renderList } from "../format.js";
import type { MatchDetail, MatchSummary } from "../types.js";

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

  it("keeps detail rows inside the terminal width", () => {
    const detail: MatchDetail = {
      updatedAt: "2026-06-15T18:00:00.000Z",
      match: {
        id: "1",
        name: "Cape Verde at Spain",
        shortName: "CPV @ ESP",
        date: "2026-06-15T16:00Z",
        status: "Second Half",
        statusDetail: "90'",
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
          score: "0",
        },
        venue: "Mercedes-Benz Stadium",
        city: "Atlanta, Georgia",
        league: "FIFA World Cup",
      },
      stats: [
        { name: "foulsCommitted", away: "9", home: "1" },
        { name: "possessionPct", away: "74.2", home: "25.8" },
      ],
      timeline: [
        {
          id: "1",
          minute: "90'",
          type: "Shot Blocked",
          text: "Attempt blocked.\rKevin Pina right footed shot from outside the box is blocked after a long attacking move.",
          important: false,
        },
      ],
    };
    const originalColumns = process.stdout.columns;
    const originalRows = process.stdout.rows;
    Object.defineProperty(process.stdout, "columns", { value: 90, configurable: true });
    Object.defineProperty(process.stdout, "rows", { value: 18, configurable: true });

    const output = renderDetail(detail, 0, "Updated");
    const visibleLines = output
      .split("\n")
      .map((line) => line.replace(/\x1b\[[0-9;]*m/g, ""));

    expect(visibleLines.every((line) => line.length <= 90)).toBe(true);
    expect(output).not.toContain("\r");

    Object.defineProperty(process.stdout, "columns", { value: originalColumns, configurable: true });
    Object.defineProperty(process.stdout, "rows", { value: originalRows, configurable: true });
  });
});
