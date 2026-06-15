# world-cup-tui

Terminal live scoreboard and match timeline for the FIFA World Cup.

The default data source is ESPN's public World Cup scoreboard and match summary endpoints. It works without an API key and can show live scores, match status, team stats, key events, and commentary when ESPN exposes those fields.

## Features

- Live World Cup match list with score, status, kickoff time, and venue
- Match detail screen with scoreline, venue, team stats, and play-by-play
- Auto-refreshing terminal UI with manual refresh
- Keyboard controls modeled after lightweight sports TUIs
- Opens the selected ESPN match page in your browser
- No API key required for the default ESPN source

## Install

```sh
npm install
```

## Run

Development mode:

```sh
npm run dev
```

Build and run:

```sh
npm run build
npm start
```

After build, you can also run the binary directly:

```sh
node dist/index.js
```

If installed globally or linked locally, the binary is:

```sh
world-cup-tui
```

## Controls

- `j` / down: move down or scroll timeline
- `k` / up: move up or scroll timeline
- `enter`: open selected match
- `b` / `esc`: back to match list
- `r`: refresh now
- `o`: open selected match on ESPN
- `q`: quit

## Options

```sh
npm run dev -- --refresh 10
npm run dev -- --date 20260615
npm run dev -- --limit 20
```

- `--refresh <seconds>`: auto-refresh interval, default `15`
- `--date <YYYYMMDD>`: request a specific ESPN scoreboard date
- `--limit <count>`: scoreboard event limit, default `100`

## Data Source

The CLI currently uses:

- Scoreboard: `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard`
- Match detail: `https://site.web.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary`

These endpoints returned live FIFA World Cup match data during development, including commentary for active matches. They are not a formal ESPN public API contract, so the adapter is kept small and isolated in `src/espn.ts`.

## Development

```sh
npm run typecheck
npm test
npm run build
```

## Notes

Paid sports data providers can be added as additional source adapters if richer or contract-backed live data is needed.
