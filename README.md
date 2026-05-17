# Catan WeChat Mini App

A WeChat Mini Program MVP for learning and tracking a simplified Catan table game.

## What it does

- Starts a 3-player or 4-player local pass-and-play game.
- Renders a playable 19-hex board with resource tiles, number tokens, vertices, edges, roads, settlements, cities, and robber marker.
- Supports board actions: build settlement, build road, upgrade city, move robber.
- Rolls 2d6 and automatically produces resources from unblocked matching hexes.
- Tracks public player counters: resources, roads, settlements, cities, development cards, victory point cards, played knights, Longest Road, and Largest Army.
- Calculates visible victory points and marks game over when the current player reaches 10+ points.
- Includes a plain-text rules reference for build costs, turn flow, robber, development cards, and scoring.

This helper uses original text and no official Catan artwork. It is not an online multiplayer game.

## Repository layout

```text
docs/DESIGN.md                 Product and implementation design
miniprogram/                   WeChat Mini Program source
miniprogram/utils/game.js      Pure testable game state, board topology, and rules actions
miniprogram/utils/rules.js     Static rules reference data
tests/game.test.js             Node unit tests
```

## Develop

Run the logic tests:

```bash
npm test
npm run check
```

Open the project in WeChat DevTools with this directory as the project root. The project uses `touristappid` for local preview; replace it with a real AppID before publishing.

## Browser preview

You can also test the core UX in a normal browser without WeChat DevTools:

```bash
npm run preview
```

Then open:

```text
http://localhost:4173/web/
```

The browser preview reuses the same pure JavaScript game/rules modules as the Mini Program. It is a fast local test harness, not a production web build.

## MVP limitations

- No online sync.
- Robber stealing/discarding is currently prompted by the UI but not fully enforced.
- Opening placement order is assisted with a “free setup builds” toggle rather than a fully scripted snake-order setup phase.
- No login, backend, ads, or analytics.
