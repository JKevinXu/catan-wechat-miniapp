const RESOURCE_TYPES = ['brick', 'lumber', 'wool', 'grain', 'ore'];
const PHASES = {
  ROLL: 'ROLL',
  TRADE_BUILD: 'TRADE_BUILD',
  GAME_OVER: 'GAME_OVER'
};

const PLAYER_COLORS = ['#d94835', '#2f7ed8', '#2f9e44', '#8b5cf6'];

function createEmptyResources() {
  return RESOURCE_TYPES.reduce((resources, type) => {
    resources[type] = 0;
    return resources;
  }, {});
}

function normalizeNames(input) {
  if (Array.isArray(input)) {
    return input.map((name, index) => String(name || `Player ${index + 1}`).trim() || `Player ${index + 1}`);
  }

  const count = Number(input);
  if (!Number.isInteger(count)) {
    throw new Error('createGame expects 3 or 4 players');
  }
  return Array.from({ length: count }, (_, index) => `Player ${index + 1}`);
}

function assertPlayerCount(names) {
  if (!Array.isArray(names) || ![3, 4].includes(names.length)) {
    throw new Error('Catan table helper supports 3 or 4 players');
  }
}

function createPlayer(name, index, startingPieces = { roads: 2, settlements: 2 }) {
  return {
    id: `p${index + 1}`,
    name,
    color: PLAYER_COLORS[index % PLAYER_COLORS.length],
    resources: createEmptyResources(),
    roads: startingPieces.roads,
    settlements: startingPieces.settlements,
    setupSettlementsPlaced: 0,
    cities: 0,
    developmentCards: 0,
    victoryPointCards: 0,
    knightsPlayed: 0,
    hasLongestRoad: false,
    hasLargestArmy: false
  };
}

function cloneBoard(board) {
  if (!board) return undefined;
  return {
    ...board,
    hexes: board.hexes.map((hex) => ({ ...hex, vertexIds: [...hex.vertexIds], edgeIds: [...hex.edgeIds] })),
    vertices: board.vertices.map((vertex) => ({
      ...vertex,
      adjacentHexIds: [...vertex.adjacentHexIds],
      edgeIds: [...vertex.edgeIds],
      building: vertex.building ? { ...vertex.building } : null
    })),
    edges: board.edges.map((edge) => ({ ...edge, vertexIds: [...edge.vertexIds] }))
  };
}

function cloneGame(game) {
  return {
    ...game,
    board: cloneBoard(game.board),
    log: game.log ? [...game.log] : [],
    lastRoll: game.lastRoll ? {
      ...game.lastRoll,
      discardCandidates: [...game.lastRoll.discardCandidates],
      production: game.lastRoll.production ? game.lastRoll.production.map((item) => ({ ...item })) : []
    } : null,
    players: game.players.map((player) => ({
      ...player,
      resources: { ...player.resources }
    }))
  };
}

function createGame(input = 3) {
  const names = normalizeNames(input);
  assertPlayerCount(names);

  return {
    targetScore: 10,
    currentPlayerIndex: 0,
    phase: PHASES.ROLL,
    lastRoll: null,
    winnerId: null,
    log: [],
    players: names.map((name, index) => createPlayer(name, index))
  };
}

function axialDistance(q, r) {
  const s = -q - r;
  return Math.max(Math.abs(q), Math.abs(r), Math.abs(s));
}

function pointKey(x, y) {
  return `${Math.round(x * 1000) / 1000},${Math.round(y * 1000) / 1000}`;
}

function createBoard() {
  const size = 42;
  const resources = [
    'ore', 'wool', 'lumber',
    'brick', 'grain', 'wool', 'brick',
    'grain', 'lumber', 'desert', 'lumber', 'ore',
    'lumber', 'ore', 'grain', 'wool',
    'brick', 'grain', 'wool'
  ];
  const numbers = [10, 2, 9, 12, 6, 4, 10, 9, 11, null, 3, 8, 8, 3, 4, 5, 5, 6, 11];
  const coords = [];

  for (let r = -2; r <= 2; r += 1) {
    for (let q = -2; q <= 2; q += 1) {
      if (axialDistance(q, r) <= 2) coords.push({ q, r });
    }
  }

  const vertexMap = new Map();
  const edgeMap = new Map();
  const vertices = [];
  const edges = [];

  function getVertexId(x, y) {
    const key = pointKey(x, y);
    if (!vertexMap.has(key)) {
      const id = `v${vertices.length}`;
      vertexMap.set(key, id);
      vertices.push({ id, x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100, adjacentHexIds: [], edgeIds: [], building: null });
    }
    return vertexMap.get(key);
  }

  function getEdgeId(a, b) {
    const key = [a, b].sort().join('|');
    if (!edgeMap.has(key)) {
      const id = `e${edges.length}`;
      edgeMap.set(key, id);
      edges.push({ id, vertexIds: [a, b], roadOwnerId: null });
    }
    return edgeMap.get(key);
  }

  const hexes = coords.map(({ q, r }, index) => {
    const id = `h${index}`;
    const cx = size * Math.sqrt(3) * (q + r / 2);
    const cy = size * 1.5 * r;
    const vertexIds = [];
    for (let i = 0; i < 6; i += 1) {
      const angle = (Math.PI / 180) * (30 + 60 * i);
      const vertexId = getVertexId(cx + size * Math.cos(angle), cy + size * Math.sin(angle));
      vertexIds.push(vertexId);
      const vertex = vertices.find((item) => item.id === vertexId);
      vertex.adjacentHexIds.push(id);
    }
    const edgeIds = vertexIds.map((vertexId, i) => {
      const edgeId = getEdgeId(vertexId, vertexIds[(i + 1) % 6]);
      return edgeId;
    });
    return {
      id,
      q,
      r,
      x: Math.round(cx * 100) / 100,
      y: Math.round(cy * 100) / 100,
      resource: resources[index],
      number: numbers[index],
      hasRobber: resources[index] === 'desert',
      vertexIds,
      edgeIds
    };
  });

  for (const edge of edges) {
    for (const vertexId of edge.vertexIds) {
      const vertex = vertices.find((item) => item.id === vertexId);
      vertex.edgeIds.push(edge.id);
    }
  }

  return { size, hexes, vertices, edges };
}

function createPlayableGame(input = 3) {
  const names = normalizeNames(input);
  assertPlayerCount(names);
  return {
    targetScore: 10,
    currentPlayerIndex: 0,
    phase: PHASES.ROLL,
    lastRoll: null,
    winnerId: null,
    selectedMode: 'settlement',
    log: ['New playable board created. Opening setup allows each player to place at most two settlements and matching roads, then turn off free setup to continue building.'],
    board: createBoard(),
    players: names.map((name, index) => createPlayer(name, index, { roads: 0, settlements: 0 }))
  };
}

function calculateVictoryPoints(player) {
  return player.settlements + (player.cities * 2) + player.victoryPointCards +
    (player.hasLongestRoad ? 2 : 0) + (player.hasLargestArmy ? 2 : 0);
}

function totalResources(player) {
  return RESOURCE_TYPES.reduce((sum, type) => sum + Number(player.resources[type] || 0), 0);
}

function findPlayerIndex(game, playerId) {
  const index = game.players.findIndex((player) => player.id === playerId);
  if (index === -1) {
    throw new Error(`Unknown player: ${playerId}`);
  }
  return index;
}

function findBoardItem(items, id, label) {
  const item = items.find((entry) => entry.id === id);
  if (!item) throw new Error(`Unknown ${label}: ${id}`);
  return item;
}

function assertResource(resource) {
  if (!RESOURCE_TYPES.includes(resource)) {
    throw new Error(`Unknown resource: ${resource}`);
  }
}

function addLog(game, message) {
  game.log = [message, ...(game.log || [])].slice(0, 12);
}

function adjustResource(game, playerId, resource, delta) {
  assertResource(resource);
  const next = cloneGame(game);
  const index = findPlayerIndex(next, playerId);
  const current = Number(next.players[index].resources[resource] || 0);
  next.players[index].resources[resource] = Math.max(0, current + Number(delta));
  return next;
}

function adjustCounter(game, playerId, field, delta) {
  const allowed = ['roads', 'settlements', 'cities', 'developmentCards', 'victoryPointCards', 'knightsPlayed'];
  if (!allowed.includes(field)) {
    throw new Error(`Unknown counter: ${field}`);
  }
  const next = cloneGame(game);
  const index = findPlayerIndex(next, playerId);
  next.players[index][field] = Math.max(0, Number(next.players[index][field] || 0) + Number(delta));
  return updateWinner(next);
}

function upgradeSettlementToCity(game, playerId) {
  const next = cloneGame(game);
  const index = findPlayerIndex(next, playerId);
  if (next.players[index].settlements < 1) {
    throw new Error('No settlement available to upgrade');
  }
  next.players[index].settlements -= 1;
  next.players[index].cities += 1;
  return updateWinner(next);
}

function getAdjacentVertexIds(board, vertexId) {
  const vertex = findBoardItem(board.vertices, vertexId, 'vertex');
  const adjacent = new Set();
  for (const edgeId of vertex.edgeIds) {
    const edge = findBoardItem(board.edges, edgeId, 'edge');
    for (const id of edge.vertexIds) {
      if (id !== vertexId) adjacent.add(id);
    }
  }
  return [...adjacent];
}

function playerHasNetworkAtVertex(board, playerId, vertexId) {
  const vertex = findBoardItem(board.vertices, vertexId, 'vertex');
  if (vertex.building && vertex.building.playerId === playerId) return true;
  return vertex.edgeIds.some((edgeId) => findBoardItem(board.edges, edgeId, 'edge').roadOwnerId === playerId);
}

function canAfford(player, cost) {
  return Object.keys(cost).every((resource) => player.resources[resource] >= cost[resource]);
}

function payCost(player, cost) {
  for (const [resource, amount] of Object.entries(cost)) {
    player.resources[resource] -= amount;
  }
}

function assertBuildAllowed(game, options = {}) {
  if (!options.setup && game.phase !== PHASES.TRADE_BUILD) {
    throw new Error('Roll dice before building');
  }
}

function buildSettlement(game, playerId, vertexId, options = {}) {
  assertBuildAllowed(game, options);
  const next = cloneGame(game);
  const playerIndex = findPlayerIndex(next, playerId);
  const player = next.players[playerIndex];
  const vertex = findBoardItem(next.board.vertices, vertexId, 'vertex');
  if (vertex.building) throw new Error('That vertex already has a building');

  const adjacentBuilding = getAdjacentVertexIds(next.board, vertexId)
    .map((id) => findBoardItem(next.board.vertices, id, 'vertex'))
    .some((item) => item.building);
  if (adjacentBuilding) throw new Error('Settlement violates the distance rule');

  if (options.setup && Number(player.setupSettlementsPlaced || 0) >= 2) {
    throw new Error('Opening setup allows at most two settlements per player');
  }

  if (!options.setup && !playerHasNetworkAtVertex(next.board, playerId, vertexId)) {
    throw new Error('Settlement must connect to one of your roads');
  }

  const cost = { brick: 1, lumber: 1, wool: 1, grain: 1 };
  if (!options.free) {
    if (!canAfford(player, cost)) throw new Error('Not enough resources to build settlement');
    payCost(player, cost);
  }

  vertex.building = { playerId, type: 'settlement' };
  player.settlements += 1;
  if (options.setup) {
    player.setupSettlementsPlaced = Number(player.setupSettlementsPlaced || 0) + 1;
  }
  addLog(next, `${player.name} built a settlement.`);
  return updateWinner(next);
}

function buildRoad(game, playerId, edgeId, options = {}) {
  assertBuildAllowed(game, options);
  const next = cloneGame(game);
  const playerIndex = findPlayerIndex(next, playerId);
  const player = next.players[playerIndex];
  const edge = findBoardItem(next.board.edges, edgeId, 'edge');
  if (edge.roadOwnerId) throw new Error('That edge already has a road');

  const connects = edge.vertexIds.some((vertexId) => playerHasNetworkAtVertex(next.board, playerId, vertexId));
  if (!connects) throw new Error('Road must connect to your settlement, city, or road');

  const cost = { brick: 1, lumber: 1 };
  if (!options.free) {
    if (!canAfford(player, cost)) throw new Error('Not enough resources to build road');
    payCost(player, cost);
  }

  edge.roadOwnerId = playerId;
  player.roads += 1;
  addLog(next, `${player.name} built a road.`);
  return updateWinner(next);
}

function upgradeCityAtVertex(game, playerId, vertexId, options = {}) {
  assertBuildAllowed(game, options);
  const next = cloneGame(game);
  const playerIndex = findPlayerIndex(next, playerId);
  const player = next.players[playerIndex];
  const vertex = findBoardItem(next.board.vertices, vertexId, 'vertex');
  if (options.setup) {
    throw new Error('Cities cannot be built during opening setup');
  }
  if (!vertex.building || vertex.building.playerId !== playerId || vertex.building.type !== 'settlement') {
    throw new Error('Choose one of your settlements to upgrade');
  }

  const cost = { grain: 2, ore: 3 };
  if (!options.free) {
    if (!canAfford(player, cost)) throw new Error('Not enough resources to upgrade city');
    payCost(player, cost);
  }

  vertex.building = { playerId, type: 'city' };
  player.settlements -= 1;
  player.cities += 1;
  addLog(next, `${player.name} upgraded a settlement to a city.`);
  return updateWinner(next);
}

function moveRobber(game, hexId) {
  const next = cloneGame(game);
  const target = findBoardItem(next.board.hexes, hexId, 'hex');
  next.board.hexes.forEach((hex) => { hex.hasRobber = false; });
  target.hasRobber = true;
  addLog(next, `Robber moved to ${target.resource}${target.number ? ` ${target.number}` : ''}.`);
  return next;
}

function produceResourcesForRoll(game, rollTotal) {
  const next = cloneGame(game);
  if (!next.board || rollTotal === 7) return next;
  const production = [];

  for (const hex of next.board.hexes) {
    if (hex.number !== rollTotal || hex.hasRobber || !RESOURCE_TYPES.includes(hex.resource)) continue;
    for (const vertexId of hex.vertexIds) {
      const vertex = findBoardItem(next.board.vertices, vertexId, 'vertex');
      if (!vertex.building) continue;
      const playerIndex = findPlayerIndex(next, vertex.building.playerId);
      const amount = vertex.building.type === 'city' ? 2 : 1;
      next.players[playerIndex].resources[hex.resource] += amount;
      production.push({ playerId: vertex.building.playerId, resource: hex.resource, amount, hexId: hex.id });
    }
  }

  if (production.length) {
    addLog(next, `Roll ${rollTotal}: produced ${production.map((item) => `${item.amount} ${item.resource} for ${item.playerId}`).join(', ')}.`);
  } else {
    addLog(next, `Roll ${rollTotal}: no production.`);
  }
  return next;
}

function validateDie(value) {
  if (!Number.isInteger(value) || value < 1 || value > 6) {
    throw new Error('Dice values must be integers from 1 to 6');
  }
}

function rollDiceWithValues(game, dieA, dieB) {
  if (game.phase !== PHASES.ROLL) {
    throw new Error('Dice can only be rolled during the ROLL phase');
  }
  validateDie(dieA);
  validateDie(dieB);

  const total = dieA + dieB;
  let next = cloneGame(game);
  if (next.board && total !== 7) {
    next = produceResourcesForRoll(next, total);
  }
  const discardCandidates = total === 7
    ? next.players.filter((player) => totalResources(player) > 7).map((player) => player.id)
    : [];

  next.phase = PHASES.TRADE_BUILD;
  next.lastRoll = {
    dieA,
    dieB,
    total,
    discardCandidates,
    production: [],
    message: total === 7
      ? 'Robber activated: players with more than 7 resource cards discard half, then move the robber and steal 1 card.'
      : `Produced resources from every unblocked tile numbered ${total}. Settlements collect 1, cities collect 2.`
  };

  return next;
}

function rollDice(game, random = Math.random) {
  const dieA = Math.floor(random() * 6) + 1;
  const dieB = Math.floor(random() * 6) + 1;
  return rollDiceWithValues(game, dieA, dieB);
}

function updateWinner(game) {
  const next = cloneGame(game);
  const current = next.players[next.currentPlayerIndex];
  if (current && calculateVictoryPoints(current) >= next.targetScore) {
    next.phase = PHASES.GAME_OVER;
    next.winnerId = current.id;
  }
  return next;
}

function endTurn(game) {
  if (game.phase === PHASES.GAME_OVER) {
    return cloneGame(game);
  }
  const scored = updateWinner(game);
  if (scored.phase === PHASES.GAME_OVER) {
    return scored;
  }

  const next = cloneGame(scored);
  next.currentPlayerIndex = (next.currentPlayerIndex + 1) % next.players.length;
  next.phase = PHASES.ROLL;
  next.lastRoll = null;
  return next;
}

function setLongestRoad(game, playerId, enabled) {
  const next = cloneGame(game);
  const index = findPlayerIndex(next, playerId);
  if (enabled && next.players[index].roads < 5) {
    throw new Error('Longest Road requires at least 5 roads');
  }
  next.players.forEach((player) => {
    player.hasLongestRoad = false;
  });
  next.players[index].hasLongestRoad = Boolean(enabled);
  return updateWinner(next);
}

function setLargestArmy(game, playerId, enabled) {
  const next = cloneGame(game);
  const index = findPlayerIndex(next, playerId);
  if (enabled && next.players[index].knightsPlayed < 3) {
    throw new Error('Largest Army requires at least 3 knights');
  }
  next.players.forEach((player) => {
    player.hasLargestArmy = false;
  });
  next.players[index].hasLargestArmy = Boolean(enabled);
  return updateWinner(next);
}

const gameApiExport = {
  RESOURCE_TYPES,
  PHASES,
  createGame,
  createBoard,
  createPlayableGame,
  calculateVictoryPoints,
  totalResources,
  adjustResource,
  adjustCounter,
  upgradeSettlementToCity,
  getAdjacentVertexIds,
  buildSettlement,
  buildRoad,
  upgradeCityAtVertex,
  moveRobber,
  produceResourcesForRoll,
  rollDiceWithValues,
  rollDice,
  endTurn,
  setLongestRoad,
  setLargestArmy,
  updateWinner
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = gameApiExport;
}

if (typeof window !== 'undefined') {
  window.CatanGame = gameApiExport;
}
