# world-cup-cli

Terminal live scoreboard and match timeline for the FIFA World Cup.

The default data source is ESPN's public World Cup scoreboard and match summary endpoints. It works without an API key and can show live scores, match status, team stats, key events, and commentary when ESPN exposes those fields.

## Run

```sh
npm install
npm run dev
```

Build and run:

```sh
npm run build
npm start
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

## Notes

ESPN's endpoints are not a formal public API, so the adapter is intentionally small and isolated. Paid sports data providers can be added as additional source adapters if richer or contract-backed live data is needed.
