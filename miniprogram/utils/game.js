const RESOURCE_TYPES = ['brick', 'lumber', 'wool', 'grain', 'ore'];
const PHASES = {
  ROLL: 'ROLL',
  TRADE_BUILD: 'TRADE_BUILD',
  GAME_OVER: 'GAME_OVER'
};

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

function createPlayer(name, index) {
  return {
    id: `p${index + 1}`,
    name,
    resources: createEmptyResources(),
    roads: 2,
    settlements: 2,
    cities: 0,
    developmentCards: 0,
    victoryPointCards: 0,
    knightsPlayed: 0,
    hasLongestRoad: false,
    hasLargestArmy: false
  };
}

function cloneGame(game) {
  return {
    ...game,
    lastRoll: game.lastRoll ? { ...game.lastRoll, discardCandidates: [...game.lastRoll.discardCandidates] } : null,
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
    players: names.map(createPlayer)
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

function assertResource(resource) {
  if (!RESOURCE_TYPES.includes(resource)) {
    throw new Error(`Unknown resource: ${resource}`);
  }
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
  return next;
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

  const next = cloneGame(game);
  const total = dieA + dieB;
  const discardCandidates = total === 7
    ? next.players.filter((player) => totalResources(player) > 7).map((player) => player.id)
    : [];

  next.phase = PHASES.TRADE_BUILD;
  next.lastRoll = {
    dieA,
    dieB,
    total,
    discardCandidates,
    message: total === 7
      ? 'Robber activated: players with more than 7 resource cards discard half, then move the robber and steal 1 card.'
      : `Produce resources from every tile numbered ${total}. Settlements collect 1, cities collect 2.`
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
  calculateVictoryPoints,
  totalResources,
  adjustResource,
  adjustCounter,
  upgradeSettlementToCity,
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
