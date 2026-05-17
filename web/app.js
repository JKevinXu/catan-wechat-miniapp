const gameApi = window.CatanGame;
const rulesApi = window.CatanRules;
const app = document.getElementById('app');

let route = 'home';
let game = gameApi.createGame(3);

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function setRoute(nextRoute) {
  route = nextRoute;
  render();
}

function startGame(playerCount) {
  game = gameApi.createGame(playerCount);
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

function currentPlayer() {
  return game.players[game.currentPlayerIndex];
}

function playerScore(player) {
  return gameApi.calculateVictoryPoints(player);
}

function discardCandidateNames() {
  if (!game.lastRoll) return '';
  return game.lastRoll.discardCandidates
    .map((id) => game.players.find((player) => player.id === id))
    .filter(Boolean)
    .map((player) => player.name)
    .join(', ');
}

function navHtml() {
  return `
    <div class="nav-tabs">
      <button class="neutral ${route === 'home' ? 'active' : ''}" data-action="route" data-route="home">Home</button>
      <button class="neutral ${route === 'game' ? 'active' : ''}" data-action="route" data-route="game">Game Tracker</button>
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
        <p class="subtitle">This browser harness mirrors the WeChat Mini Program MVP so you can test the table-helper logic without WeChat DevTools.</p>
        <div class="actions">
          <button class="primary" data-action="start" data-count="3">Start 3-player game</button>
          <button class="primary" data-action="start" data-count="4">Start 4-player game</button>
          <button class="secondary" data-action="route" data-route="rules">Rules Reference</button>
        </div>
      </section>
      <section class="card">
        <h2>Quick flow</h2>
        <p>Roll dice → collect resources → trade/build → end turn. First player to 10 victory points wins.</p>
      </section>
    </main>
  `;
}

function renderGame() {
  const player = currentPlayer();
  const candidateNames = discardCandidateNames();
  const winner = game.winnerId ? game.players.find((item) => item.id === game.winnerId) : null;

  return `
    <main class="container">
      ${navHtml()}
      <section class="card">
        <h1 class="title">${escapeHtml(player.name)}'s turn</h1>
        <p class="subtitle">Phase: ${escapeHtml(game.phase)}</p>
        ${game.lastRoll ? `
          <div class="roll-box">
            <strong>Roll: ${game.lastRoll.dieA} + ${game.lastRoll.dieB} = ${game.lastRoll.total}</strong>
            <p>${escapeHtml(game.lastRoll.message)}</p>
            ${candidateNames ? `<p class="warning">Discard candidates: ${escapeHtml(candidateNames)}</p>` : ''}
          </div>
        ` : ''}
        ${winner ? `<div class="winner">${escapeHtml(winner.name)} reached 10+ points!</div>` : ''}
        <div class="actions">
          <button class="primary" data-action="roll" ${game.phase !== 'ROLL' || winner ? 'disabled' : ''}>Roll dice</button>
          <button class="secondary" data-action="end-turn" ${winner ? 'disabled' : ''}>End turn</button>
          <button class="neutral" data-action="route" data-route="rules">Rules Reference</button>
        </div>
      </section>
      <section class="grid">
        ${game.players.map(renderPlayerCard).join('')}
      </section>
    </main>
  `;
}

function renderPlayerCard(player) {
  return `
    <article class="card">
      <div class="player-header">
        <h2>${escapeHtml(player.name)}</h2>
        <span class="score">${playerScore(player)} VP</span>
      </div>
      <p class="muted">Resources: ${gameApi.totalResources(player)}</p>
      <div class="resource-grid">
        ${gameApi.RESOURCE_TYPES.map((resource) => `
          <div class="resource-cell">
            <div><strong>${escapeHtml(resource)}</strong></div>
            <div class="counter-row">
              <button data-action="resource" data-player="${player.id}" data-resource="${resource}" data-delta="-1">-</button>
              <span>${player.resources[resource]}</span>
              <button data-action="resource" data-player="${player.id}" data-resource="${resource}" data-delta="1">+</button>
            </div>
          </div>
        `).join('')}
      </div>
      ${renderCounter(player, 'roads', 'Roads')}
      ${renderCounter(player, 'settlements', 'Settlements')}
      <div class="counter-row">
        <span>Cities: ${player.cities}</span>
        <span class="counter-buttons">
          <button data-action="counter" data-player="${player.id}" data-field="cities" data-delta="-1">-</button>
          <button data-action="upgrade-city" data-player="${player.id}">Upgrade</button>
        </span>
      </div>
      ${renderCounter(player, 'developmentCards', 'Dev cards')}
      ${renderCounter(player, 'victoryPointCards', 'VP cards')}
      ${renderCounter(player, 'knightsPlayed', 'Knights')}
      <div class="actions">
        <button class="neutral" data-action="longest-road" data-player="${player.id}">${player.hasLongestRoad ? 'Remove Longest Road' : 'Set Longest Road'}</button>
        <button class="neutral" data-action="largest-army" data-player="${player.id}">${player.hasLargestArmy ? 'Remove Largest Army' : 'Set Largest Army'}</button>
      </div>
    </article>
  `;
}

function renderCounter(player, field, label) {
  return `
    <div class="counter-row">
      <span>${label}: ${player[field]}</span>
      <span class="counter-buttons">
        <button data-action="counter" data-player="${player.id}" data-field="${field}" data-delta="-1">-</button>
        <button data-action="counter" data-player="${player.id}" data-field="${field}" data-delta="1">+</button>
      </span>
    </div>
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

app.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button || button.disabled) return;

  const { action } = button.dataset;
  if (action === 'route') setRoute(button.dataset.route);
  if (action === 'start') startGame(Number(button.dataset.count));
  if (action === 'roll') mutate((state) => gameApi.rollDice(state));
  if (action === 'end-turn') mutate((state) => gameApi.endTurn(state));
  if (action === 'resource') mutate((state) => gameApi.adjustResource(state, button.dataset.player, button.dataset.resource, Number(button.dataset.delta)));
  if (action === 'counter') mutate((state) => gameApi.adjustCounter(state, button.dataset.player, button.dataset.field, Number(button.dataset.delta)));
  if (action === 'upgrade-city') mutate((state) => gameApi.upgradeSettlementToCity(state, button.dataset.player));
  if (action === 'longest-road') {
    const player = game.players.find((item) => item.id === button.dataset.player);
    mutate((state) => gameApi.setLongestRoad(state, button.dataset.player, !player.hasLongestRoad));
  }
  if (action === 'largest-army') {
    const player = game.players.find((item) => item.id === button.dataset.player);
    mutate((state) => gameApi.setLargestArmy(state, button.dataset.player, !player.hasLargestArmy));
  }
});

render();
