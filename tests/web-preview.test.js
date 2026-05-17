const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

test('browser preview HTML includes app mount and browser bundle', () => {
  const html = fs.readFileSync(path.join(root, 'web', 'index.html'), 'utf8');

  assert.match(html, /<div id="app">/);
  assert.match(html, /src="\.\/app\.js"/);
  assert.match(html, /Catan Browser Preview/);
});

test('browser preview app exposes key table-helper controls', () => {
  const app = fs.readFileSync(path.join(root, 'web', 'app.js'), 'utf8');

  assert.match(app, /Start 3-player game/);
  assert.match(app, /Start 4-player game/);
  assert.match(app, /Roll dice/);
  assert.match(app, /End turn/);
  assert.match(app, /Rules Reference/);
});

test('browser board supports direct click actions without choosing a build mode first', () => {
  const app = fs.readFileSync(path.join(root, 'web', 'app.js'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'web', 'styles.css'), 'utf8');

  assert.match(app, /function handleVertexClick/);
  assert.match(app, /function handleEdgeClick/);
  assert.match(app, /function handleHexClick/);
  assert.match(app, /buildSettlement\(state, player\.id, vertexId/);
  assert.match(app, /upgradeCityAtVertex\(state, player\.id, vertexId/);
  assert.match(app, /buildRoad\(state, player\.id, edgeId/);
  assert.match(app, /moveRobber\(state, hexId/);
  assert.doesNotMatch(app, /if \(boardMode === 'settlement'\) mutate/);
  assert.match(app, /Click empty corners to build settlements; click your settlements to upgrade cities; click edges to build roads; click tiles to move the robber\./);
  assert.match(css, /\.interaction-hint/);
});
