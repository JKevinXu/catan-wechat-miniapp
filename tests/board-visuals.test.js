const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

test('browser board renders board-game style piece and resource icons', () => {
  const app = fs.readFileSync(path.join(root, 'web', 'app.js'), 'utf8');

  assert.match(app, /resourceIcons/);
  assert.match(app, /renderSettlementIcon/);
  assert.match(app, /renderCityIcon/);
  assert.match(app, /renderRoadIcon/);
  assert.match(app, /renderRobberToken/);
  assert.match(app, /class="settlement-piece/);
  assert.match(app, /class="city-piece/);
  assert.match(app, /class="road owned/);
  assert.match(app, /high-probability-number/);
});

test('browser board stylesheet includes polished icon styling', () => {
  const css = fs.readFileSync(path.join(root, 'web', 'styles.css'), 'utf8');

  assert.match(css, /\.settlement-piece/);
  assert.match(css, /\.city-piece/);
  assert.match(css, /\.resource-icon/);
  assert.match(css, /\.robber-token/);
  assert.match(css, /\.high-probability-number/);
  assert.match(css, /\.dice-button/);
  assert.match(css, /filter: drop-shadow/);
});

test('browser tile icon layout keeps resource, number, label, and robber separated', () => {
  const app = fs.readFileSync(path.join(root, 'web', 'app.js'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'web', 'styles.css'), 'utf8');

  assert.match(app, /y=\"\$\{hex\.y - 36\}\" text-anchor=\"middle\" class=\"hex-icon\"/);
  assert.match(app, /cy=\"\$\{hex\.y \+ 2\}\" r=\"15\"/);
  assert.match(app, /y=\"\$\{hex\.y \+ 37\}\" text-anchor=\"middle\" class=\"hex-resource\"/);
  assert.match(app, /cx=\"\$\{hex\.x \+ 18\}\" cy=\"\$\{hex\.y - 18\}\"/);
  assert.match(app, /\$\{hex\.number \? `/);
  assert.match(app, /class=\"number-token/);
  assert.match(css, /\.hex-icon \{[\s\S]*font-size: 18px;/);
  assert.match(css, /\.hex-resource \{[\s\S]*font-size: 7px;/);
});

test('mini program board uses visual icons for pieces and resources', () => {
  const wxml = fs.readFileSync(path.join(root, 'miniprogram', 'pages', 'game', 'game.wxml'), 'utf8');
  const wxss = fs.readFileSync(path.join(root, 'miniprogram', 'pages', 'game', 'game.wxss'), 'utf8');

  assert.match(wxml, /piece-legend/);
  assert.match(wxml, /🏠/);
  assert.match(wxml, /🛣️/);
  assert.match(wxml, /🏙️/);
  assert.match(wxss, /\.piece-legend/);
  assert.match(wxss, /\.resource-badge/);
});
