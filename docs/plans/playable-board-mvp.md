# Playable Hex Board MVP Implementation Plan

> For Hermes: implement test-first. Keep official-brand risk low by using original visual assets, generic resource icons/colors, and plain educational rules text.

**Goal:** Convert the current statistic tracker into a playable local pass-and-play board game MVP with a real hex playboard.

**Architecture:** Add board topology and rules actions to the existing pure JS game module, then reuse those actions from both the browser preview and WeChat Mini Program. The browser preview gets the complete clickable playboard first because it is fastest to test; the Mini Program receives the same board data/rendering model for follow-up use.

**Tech Stack:** Plain JavaScript CommonJS/browser globals, SVG/HTML for browser board rendering, WXML/CSS data rendering for Mini Program, Node built-in test runner.

---

## MVP definition

The playable MVP supports local pass-and-play:

1. Generate a standard 19-hex board layout.
2. Render hex resources, dice numbers, vertices, and edges.
3. Let the active player choose an action mode:
   - Build settlement
   - Build road
   - Upgrade city
   - Move robber
4. Enforce core placement rules:
   - Settlement must be on a vertex.
   - No adjacent settlements/cities.
   - Non-setup settlement must connect to the player’s road.
   - Road must be on an edge and connect to the player’s network.
   - City upgrades only the player’s own settlement.
5. Roll dice and automatically produce resources from occupied vertices touching rolled hexes, unless blocked by the robber.
6. Detect visible 10-point wins.

## Data additions

`GameState.board`:

```js
{
  hexes: [{ id, q, r, resource, number, hasRobber }],
  vertices: [{ id, x, y, adjacentHexIds, building: null | { playerId, type } }],
  edges: [{ id, vertexIds: [a, b], roadOwnerId: null }]
}
```

Actions added to `miniprogram/utils/game.js`:

- `createBoard()`
- `createPlayableGame(players)`
- `getAdjacentVertexIds(board, vertexId)`
- `buildSettlement(game, playerId, vertexId, options)`
- `buildRoad(game, playerId, edgeId, options)`
- `upgradeCityAtVertex(game, playerId, vertexId)`
- `moveRobber(game, hexId)`
- `produceResourcesForRoll(game, rollTotal)`

## Browser UI additions

`web/app.js`:

- Add Play Board route as the default game route.
- Render board as SVG:
  - hex polygons by resource color
  - number tokens
  - robber marker
  - clickable vertices
  - clickable edges
  - settlements/cities/roads colored by player
- Add mode buttons for build settlement, build road, upgrade city, move robber.
- Add event handlers for board clicks.

`web/styles.css`:

- Add board panel, SVG sizing, color legend, action toolbar, event log styling.

## Mini Program additions

`miniprogram/pages/game/game.js`:

- Use `createPlayableGame` instead of `createGame`.
- Expose board data for rendering.

`miniprogram/pages/game/game.wxml`:

- Add scrollable board list/visual approximation for tiles and points.

## Tests

Add `tests/board.test.js` with failing tests first:

1. Board has 19 hexes, at least 54 vertices, and at least 72 edges.
2. Exactly one robber starts on the desert tile.
3. Setup settlement placement obeys distance rule.
4. Road placement can connect to own settlement.
5. A dice roll produces resources for settlements and cities adjacent to matching unblocked hexes.
6. Robber blocks production on its hex.
7. City upgrade replaces settlement and changes production to 2.

## Verification

```bash
npm test
npm run check
npm run preview
```

Browser manual QA:

1. Open `http://localhost:4173/web/`.
2. Start game.
3. Confirm board is visible.
4. Build settlement on a vertex.
5. Build road on a connected edge.
6. Roll dice and confirm resources/log update.
7. Move robber and confirm blocked production message.
