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
