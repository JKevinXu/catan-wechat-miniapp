# Catan WeChat Mini Program Design

> For Hermes: implement this MVP in small test-first steps. Core game logic must be platform-independent JavaScript under `miniprogram/utils/` so it can be unit-tested with Node without the WeChat runtime.

## Goal

Build a WeChat Mini Program MVP that helps players learn and run a simplified Settlers of Catan / Catan game assistant:

- Teach the basic rules and build costs.
- Let players configure 3-4 players.
- Track victory points, resources, settlements, cities, roads, played knights, Longest Road, and Largest Army.
- Roll dice, handle production hints, and handle robber discard threshold reminders on 7.
- Provide a compact turn checklist suitable for use at the table.

This is not an online multiplayer implementation and does not automate copyrighted board assets. It is a rules/helper app with original UI text.

## Product scope

### MVP features

1. Home screen
   - Start a new game with default player names.
   - Show quick rule summary.
   - Navigate to game tracker and rules reference.

2. Game tracker
   - Show current player and turn phase.
   - Roll 2d6.
   - If roll is 2-12 except 7: show production reminder.
   - If roll is 7: show robber reminder and players with more than 7 resource cards.
   - Track each player’s public state:
     - resources total and per-resource counts
     - roads
     - settlements
     - cities
     - development cards bought
     - knights played
     - Longest Road / Largest Army flags
     - computed visible victory points
   - Increment/decrement counters with validation.
   - End turn and rotate active player.
   - Announce when a player reaches 10+ victory points on their turn.

3. Rules reference
   - Build costs.
   - Turn structure.
   - Robber rules.
   - Development card descriptions.
   - Scoring reminders.

### Out of scope for MVP

- Online multiplayer synchronization.
- Full board map editor and exact hex production automation.
- Account login.
- Payment, ads, analytics.
- Use of official Catan artwork or trademarks beyond nominative plain-text explanation.

## Architecture

The app uses a lightweight WeChat Mini Program structure with page-level state and pure JS utility modules.

```text
catan-wechat-miniapp/
  docs/
    DESIGN.md
  miniprogram/
    app.js
    app.json
    app.wxss
    pages/
      home/
      game/
      rules/
    utils/
      game.js       # pure game state and scoring logic
      rules.js      # static rules/costs reference
  tests/
    game.test.js    # Node unit tests for utility logic
  package.json
  README.md
```

## Core data model

```js
GameState = {
  targetScore: 10,
  currentPlayerIndex: 0,
  phase: 'ROLL', // ROLL | TRADE_BUILD | GAME_OVER
  lastRoll: null,
  players: [PlayerState]
}

PlayerState = {
  id: 'p1',
  name: 'Player 1',
  resources: { brick: 0, lumber: 0, wool: 0, grain: 0, ore: 0 },
  roads: 0,
  settlements: 2,
  cities: 0,
  developmentCards: 0,
  victoryPointCards: 0,
  knightsPlayed: 0,
  hasLongestRoad: false,
  hasLargestArmy: false
}
```

Visible victory points:

```text
settlements * 1
+ cities * 2
+ victoryPointCards * 1
+ 2 if hasLongestRoad
+ 2 if hasLargestArmy
```

## Important rule constraints encoded in MVP

- Player count must be 3 or 4.
- Counters cannot go below 0.
- Settlements and cities cannot both be negative; city upgrade helper decrements settlement and increments city only if settlement exists.
- Longest Road requires at least 5 roads to be eligible.
- Largest Army requires at least 3 played knights to be eligible.
- Rolling is allowed only in `ROLL` phase.
- Ending turn moves back to `ROLL` phase unless game is over.

## UI design

Visual style:

- Warm board-game palette: parchment background, dark brown text, brick/orange action buttons, green resource badges.
- Large tap targets for table use.
- Minimal navigation: Home -> Game, Home -> Rules.

Pages:

1. `pages/home`
   - Title: “Catan Table Helper”
   - Short explanation.
   - Buttons: Start 3-player game, Start 4-player game, Rules.

2. `pages/game`
   - Current player panel.
   - Roll button and last roll message.
   - Robber/discard alert if roll is 7.
   - Player cards with counters and score.
   - End turn button.

3. `pages/rules`
   - Static sections generated from `utils/rules.js`.

4. Browser preview
   - `web/index.html` loads the same pure `miniprogram/utils/game.js` and `miniprogram/utils/rules.js` modules in a normal browser.
   - `web/app.js` provides a lightweight DOM harness for quick browser QA without WeChat DevTools.

## Test plan

Use Node’s built-in test runner.

Required unit tests:

1. `createGame` creates 3 or 4 players with legal starting state.
2. `createGame` rejects invalid player counts.
3. `calculateVictoryPoints` includes settlements, cities, VP cards, Longest Road, Largest Army.
4. `adjustResource` never allows negative resources.
5. `upgradeSettlementToCity` requires a settlement.
6. `rollDiceWithValues` changes phase and handles robber discard candidates.
7. `endTurn` rotates active player and resets phase.
8. Longest Road and Largest Army eligibility are enforced.

Verification commands:

```bash
npm test
node --check miniprogram/utils/game.js
node --check miniprogram/utils/rules.js
```

## Implementation plan

### Task 1: Create project skeleton and failing tests

Files:
- Create `package.json`
- Create `tests/game.test.js`

Write Node tests against the desired `miniprogram/utils/game.js` API. Run `npm test` and verify failure because implementation is missing.

### Task 2: Implement pure game utility module

Files:
- Create `miniprogram/utils/game.js`

Implement only enough for tests to pass. Run `npm test` and syntax checks.

### Task 3: Add rules utility and static rules reference

Files:
- Create `miniprogram/utils/rules.js`
- Add tests if behavior is added later.

### Task 4: Build WeChat Mini Program pages

Files:
- Create `miniprogram/app.js`, `app.json`, `app.wxss`
- Create `miniprogram/pages/home/*`
- Create `miniprogram/pages/game/*`
- Create `miniprogram/pages/rules/*`

Use CommonJS `require` for utility modules to fit WeChat Mini Program conventions.

### Task 5: Documentation and repository setup

Files:
- Create `README.md`
- Create `.gitignore`
- Initialize git, commit, create GitHub repository `JKevinXu/catan-wechat-miniapp`, and push.
