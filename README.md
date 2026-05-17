# Catan WeChat Mini App

A WeChat Mini Program MVP for learning and tracking a simplified Catan table game.

## What it does

- Starts a 3-player or 4-player table helper.
- Tracks public player counters: resources, roads, settlements, cities, development cards, victory point cards, played knights, Longest Road, and Largest Army.
- Rolls 2d6 and shows production or robber reminders.
- Calculates visible victory points and marks game over when the current player reaches 10+ points.
- Includes a plain-text rules reference for build costs, turn flow, robber, development cards, and scoring.

This helper uses original text and no official Catan artwork. It is not an online multiplayer game.

## Repository layout

```text
docs/DESIGN.md                 Product and implementation design
miniprogram/                   WeChat Mini Program source
miniprogram/utils/game.js      Pure testable game state logic
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

## MVP limitations

- No online sync.
- No exact board map production calculation.
- No login, backend, ads, or analytics.
