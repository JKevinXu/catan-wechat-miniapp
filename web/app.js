const gameApi = window.CatanGame;
const rulesApi = window.CatanRules;
const app = document.getElementById('app');

let route = 'game';
let game = gameApi.createPlayableGame(3);
let boardMode = 'settlement';
let freeBuild = true;

const resourceColors = {
  brick: '#c75b39',
  lumber: '#2f7d32',
  wool: '#9ccc65',
  grain: '#f2c94c',
  ore: '#8b8f98',
  desert: '#d7b46a'
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function currentPlayer() {
  return game.players[game.currentPlayerIndex];
}

function playerById(playerId) {
  return game.players.find((player) => player.id === playerId);
}

function setRoute(nextRoute) {
  route = nextRoute;
  render();
}

function startGame(playerCount) {
  game = gameApi.createPlayableGame(playerCount);
  boardMode = 'settlement';
  route = 'game';
  render();
}

function mutate(action) {
  try {
    game = action(game);
    render();
  } catch (error) {
    window.alert(error.message);
  }
}

function discardCandidateNames() {
  if (!game.lastRoll) return '';
  return game.lastRoll.discardCandidates
    .map((id) => playerById(id))
    .filter(Boolean)
    .map((player) => player.name)
    .join(', ');
}

function navHtml() {
  return `
    <div class="nav-tabs">
      <button class="neutral ${route === 'home' ? 'active' : ''}" data-action="route" data-route="home">Home</button>
      <button class="neutral ${route === 'game' ? 'active' : ''}" data-action="route" data-route="game">Play Board</button>
      <button class="neutral ${route === 'rules' ? 'active' : ''}" data-action="route" data-route="rules">Rules</button>
    </div>
  `;
}

function renderHome() {
  return `
    <main class="container">
      ${navHtml()}
      <section class="card">
        <h1 class="title">Catan Browser Preview</h1>
        <p class="subtitle">A local pass-and-play board MVP. Build on the hex board, roll dice, collect resources, move the robber, and race to 10 points.</p>
        <div class="actions">
          <button class="primary" data-action="start" data-count="3">Start 3-player game</button>
          <button class="primary" data-action="start" data-count="4">Start 4-player game</button>
          <button class="secondary" data-action="route" data-route="game">Open Play Board</button>
          <button class="neutral" data-action="route" data-route="rules">Rules Reference</button>
        </div>
      </section>
    </main>
  `;
}

function renderGame() {
  const player = currentPlayer();
  const candidateNames = discardCandidateNames();
  const winner = game.winnerId ? playerById(game.winnerId) : null;

  return `
    <main class="container wide">
      ${navHtml()}
      <section class="card game-status">
        <div>
          <h1 class="title">${escapeHtml(player.name)}'s turn</h1>
          <p class="subtitle">Phase: ${escapeHtml(game.phase)} · Score: ${gameApi.calculateVictoryPoints(player)} VP</p>
          ${game.lastRoll ? `
            <div class="roll-box">
              <strong>Roll: ${game.lastRoll.dieA} + ${game.lastRoll.dieB} = ${game.lastRoll.total}</strong>
              <p>${escapeHtml(game.lastRoll.message)}</p>
              ${candidateNames ? `<p class="warning">Discard candidates: ${escapeHtml(candidateNames)}</p>` : ''}
            </div>
          ` : ''}
          ${winner ? `<div class="winner">${escapeHtml(winner.name)} reached 10+ points!</div>` : ''}
        </div>
        <div class="actions status-actions">
          <button class="primary" data-action="roll" ${game.phase !== 'ROLL' || winner ? 'disabled' : ''}>Roll dice</button>
          <button class="secondary" data-action="end-turn" ${winner ? 'disabled' : ''}>End turn</button>
          <button class="neutral" data-action="start" data-count="3">Restart 3P</button>
          <button class="neutral" data-action="start" data-count="4">Restart 4P</button>
        </div>
      </section>

      <section class="play-layout">
        <div class="card board-card">
          <div class="board-toolbar">
            <strong>Action mode</strong>
            ${renderModeButton('settlement', 'Build settlement')}
            ${renderModeButton('road', 'Build road')}
            ${renderModeButton('city', 'Upgrade city')}
            ${renderModeButton('robber', 'Move robber')}
            <label class="free-toggle"><input type="checkbox" data-action="toggle-free" ${freeBuild ? 'checked' : ''}> free setup builds</label>
          </div>
          ${renderBoardSvg()}
          <div class="legend">
            ${Object.entries(resourceColors).map(([name, color]) => `<span><i style="background:${color}"></i>${name}</span>`).join('')}
          </div>
        </div>

        <aside>
          ${renderPlayersPanel()}
          ${renderLogPanel()}
        </aside>
      </section>
    </main>
  `;
}

function renderModeButton(mode, label) {
  return `<button class="${boardMode === mode ? 'primary' : 'neutral'}" data-action="mode" data-mode="${mode}">${label}</button>`;
}

function hexPoints(hex) {
  const size = game.board.size;
  const points = [];
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 180) * (30 + 60 * i);
    points.push(`${hex.x + size * Math.cos(angle)},${hex.y + size * Math.sin(angle)}`);
  }
  return points.join(' ');
}

function renderBoardSvg() {
  const xs = game.board.vertices.map((v) => v.x);
  const ys = game.board.vertices.map((v) => v.y);
  const minX = Math.min(...xs) - 35;
  const maxX = Math.max(...xs) + 35;
  const minY = Math.min(...ys) - 35;
  const maxY = Math.max(...ys) + 35;

  return `
    <svg class="game-board" viewBox="${minX} ${minY} ${maxX - minX} ${maxY - minY}" role="img" aria-label="Playable hex board">
      <g class="hex-layer">
        ${game.board.hexes.map((hex) => `
          <g class="hex" data-action="board-hex" data-hex="${hex.id}">
            <polygon points="${hexPoints(hex)}" fill="${resourceColors[hex.resource]}" />
            <circle cx="${hex.x}" cy="${hex.y}" r="16" fill="${hex.number ? '#fff8e8' : '#d7b46a'}" stroke="#3d2b1f" />
            <text x="${hex.x}" y="${hex.y - 3}" text-anchor="middle" class="hex-number">${hex.number || ''}</text>
            <text x="${hex.x}" y="${hex.y + 14}" text-anchor="middle" class="hex-resource">${hex.resource}</text>
            ${hex.hasRobber ? `<text x="${hex.x}" y="${hex.y - 24}" text-anchor="middle" class="robber">●</text>` : ''}
          </g>
        `).join('')}
      </g>
      <g class="edge-layer">
        ${game.board.edges.map((edge) => {
          const a = game.board.vertices.find((v) => v.id === edge.vertexIds[0]);
          const b = game.board.vertices.find((v) => v.id === edge.vertexIds[1]);
          const owner = edge.roadOwnerId ? playerById(edge.roadOwnerId) : null;
          return `
            <line class="edge-hit" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" data-action="board-edge" data-edge="${edge.id}" />
            <line class="road ${owner ? 'owned' : ''}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${owner ? owner.color : 'transparent'}" />
          `;
        }).join('')}
      </g>
      <g class="vertex-layer">
        ${game.board.vertices.map((vertex) => {
          const owner = vertex.building ? playerById(vertex.building.playerId) : null;
          const isCity = vertex.building && vertex.building.type === 'city';
          return `
            <g data-action="board-vertex" data-vertex="${vertex.id}" class="vertex-group">
              <circle class="vertex-hit" cx="${vertex.x}" cy="${vertex.y}" r="10" />
              ${owner ? `<${isCity ? 'rect' : 'circle'} class="building" ${isCity ? `x="${vertex.x - 8}" y="${vertex.y - 8}" width="16" height="16" rx="3"` : `cx="${vertex.x}" cy="${vertex.y}" r="8"`} fill="${owner.color}" />` : `<circle class="vertex-dot" cx="${vertex.x}" cy="${vertex.y}" r="3" />`}
            </g>
          `;
        }).join('')}
      </g>
    </svg>
  `;
}

function renderPlayersPanel() {
  return `
    <section class="card">
      <h2>Players</h2>
      ${game.players.map((player) => `
        <article class="mini-player" style="border-left-color:${player.color}">
          <div class="player-header">
            <strong>${escapeHtml(player.name)}</strong>
            <span class="score">${gameApi.calculateVictoryPoints(player)} VP</span>
          </div>
          <div class="muted">Roads ${player.roads} · Settlements ${player.settlements} · Cities ${player.cities}</div>
          <div class="resource-line">
            ${gameApi.RESOURCE_TYPES.map((resource) => `<span>${resource}: ${player.resources[resource]}</span>`).join('')}
          </div>
        </article>
      `).join('')}
    </section>
  `;
}

function renderLogPanel() {
  return `
    <section class="card">
      <h2>Game Log</h2>
      ${(game.log || []).map((item) => `<div class="log-line">${escapeHtml(item)}</div>`).join('')}
    </section>
  `;
}

function renderRules() {
  return `
    <main class="container">
      ${navHtml()}
      <section class="card">
        <h1 class="title">Rules Reference</h1>
        <p class="subtitle">Compact table-side rules for the base game.</p>
      </section>
      <section class="card">
        <h2>Build Costs</h2>
        ${rulesApi.BUILD_COSTS.map((item) => `
          <div class="cost-row">
            <strong>${escapeHtml(item.name)}</strong>: ${escapeHtml(rulesApi.formatCost(item.cost))}
            <div class="muted">${escapeHtml(item.note)}</div>
          </div>
        `).join('')}
      </section>
      ${rulesApi.RULE_SECTIONS.map((section) => `
        <section class="card">
          <h2>${escapeHtml(section.title)}</h2>
          ${section.items.map((item) => `<div class="rule-item">• ${escapeHtml(item)}</div>`).join('')}
        </section>
      `).join('')}
    </main>
  `;
}

function render() {
  if (route === 'game') app.innerHTML = renderGame();
  else if (route === 'rules') app.innerHTML = renderRules();
  else app.innerHTML = renderHome();
}

app.addEventListener('change', (event) => {
  const input = event.target.closest('input[data-action="toggle-free"]');
  if (!input) return;
  freeBuild = input.checked;
  render();
});

app.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action]');
  if (!target || target.disabled) return;

  const { action } = target.dataset;
  const player = currentPlayer();
  const buildOptions = { free: freeBuild, setup: freeBuild };

  if (action === 'route') setRoute(target.dataset.route);
  if (action === 'start') startGame(Number(target.dataset.count));
  if (action === 'mode') {
    boardMode = target.dataset.mode;
    render();
  }
  if (action === 'roll') mutate((state) => gameApi.rollDice(state));
  if (action === 'end-turn') mutate((state) => gameApi.endTurn(state));
  if (action === 'board-vertex') {
    if (boardMode === 'settlement') mutate((state) => gameApi.buildSettlement(state, player.id, target.dataset.vertex, buildOptions));
    if (boardMode === 'city') mutate((state) => gameApi.upgradeCityAtVertex(state, player.id, target.dataset.vertex, buildOptions));
  }
  if (action === 'board-edge' && boardMode === 'road') {
    mutate((state) => gameApi.buildRoad(state, player.id, target.dataset.edge, buildOptions));
  }
  if (action === 'board-hex' && boardMode === 'robber') {
    mutate((state) => gameApi.moveRobber(state, target.dataset.hex));
  }
});

render();
