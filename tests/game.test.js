const test = require('node:test');
const assert = require('node:assert/strict');

const {
  RESOURCE_TYPES,
  createGame,
  calculateVictoryPoints,
  totalResources,
  adjustResource,
  upgradeSettlementToCity,
  rollDiceWithValues,
  endTurn,
  setLongestRoad,
  setLargestArmy
} = require('../miniprogram/utils/game');

test('createGame creates 3 players with legal starting state', () => {
  const game = createGame(['Ada', 'Ben', 'Chen']);

  assert.equal(game.players.length, 3);
  assert.equal(game.currentPlayerIndex, 0);
  assert.equal(game.phase, 'ROLL');
  assert.equal(game.targetScore, 10);
  assert.deepEqual(game.players.map((p) => p.name), ['Ada', 'Ben', 'Chen']);

  for (const player of game.players) {
    assert.equal(player.settlements, 2);
    assert.equal(player.roads, 2);
    assert.equal(player.cities, 0);
    assert.equal(calculateVictoryPoints(player), 2);
    assert.deepEqual(Object.keys(player.resources), RESOURCE_TYPES);
  }
});

test('createGame creates default names and rejects invalid player counts', () => {
  assert.deepEqual(createGame(4).players.map((p) => p.name), [
    'Player 1',
    'Player 2',
    'Player 3',
    'Player 4'
  ]);
  assert.throws(() => createGame(2), /3 or 4 players/);
  assert.throws(() => createGame(['A', 'B', 'C', 'D', 'E']), /3 or 4 players/);
});

test('calculateVictoryPoints includes settlements, cities, VP cards, Longest Road, and Largest Army', () => {
  const player = createGame(['Ada', 'Ben', 'Chen']).players[0];
  player.settlements = 3;
  player.cities = 2;
  player.victoryPointCards = 1;
  player.hasLongestRoad = true;
  player.hasLargestArmy = true;

  assert.equal(calculateVictoryPoints(player), 12);
});

test('adjustResource changes resource counts and never allows negative resources', () => {
  const game = createGame(['Ada', 'Ben', 'Chen']);
  const updated = adjustResource(game, 'p1', 'brick', 3);
  assert.equal(updated.players[0].resources.brick, 3);

  const clamped = adjustResource(updated, 'p1', 'brick', -10);
  assert.equal(clamped.players[0].resources.brick, 0);
  assert.equal(totalResources(clamped.players[0]), 0);

  assert.throws(() => adjustResource(game, 'p1', 'gold', 1), /Unknown resource/);
});

test('upgradeSettlementToCity requires a settlement and updates score', () => {
  const game = createGame(['Ada', 'Ben', 'Chen']);
  const upgraded = upgradeSettlementToCity(game, 'p1');

  assert.equal(upgraded.players[0].settlements, 1);
  assert.equal(upgraded.players[0].cities, 1);
  assert.equal(calculateVictoryPoints(upgraded.players[0]), 3);

  const noSettlement = createGame(['Ada', 'Ben', 'Chen']);
  noSettlement.players[0].settlements = 0;
  assert.throws(() => upgradeSettlementToCity(noSettlement, 'p1'), /No settlement/);
});

test('rollDiceWithValues changes phase and handles robber discard candidates', () => {
  let game = createGame(['Ada', 'Ben', 'Chen']);
  game = adjustResource(game, 'p1', 'brick', 8);
  game = adjustResource(game, 'p2', 'ore', 7);

  const robberRoll = rollDiceWithValues(game, 3, 4);
  assert.equal(robberRoll.lastRoll.total, 7);
  assert.equal(robberRoll.phase, 'ROBBER');
  assert.deepEqual(robberRoll.lastRoll.discardCandidates, ['p1']);
  assert.match(robberRoll.lastRoll.message, /Robber/);

  game = { ...robberRoll, phase: 'TRADE_BUILD' };
  game = endTurn(game);
  const productionRoll = rollDiceWithValues(game, 4, 4);
  assert.equal(productionRoll.lastRoll.total, 8);
  assert.deepEqual(productionRoll.lastRoll.discardCandidates, []);
  assert.match(productionRoll.lastRoll.message, /Produce/);

  assert.throws(() => rollDiceWithValues(productionRoll, 1, 1), /ROLL phase/);
});

test('endTurn requires rolling before ending a normal turn', () => {
  const game = createGame(['Ada', 'Ben', 'Chen']);

  assert.throws(() => endTurn(game), /Roll before ending your turn/);
  const setupAdvanced = endTurn(game, { setup: true });
  assert.equal(setupAdvanced.currentPlayerIndex, 1);
});

test('endTurn rotates active player and resets phase', () => {
  let game = createGame(['Ada', 'Ben', 'Chen']);
  game = rollDiceWithValues(game, 2, 3);
  game = endTurn(game);

  assert.equal(game.currentPlayerIndex, 1);
  assert.equal(game.phase, 'ROLL');
  assert.equal(game.lastRoll, null);
});

test('Longest Road and Largest Army eligibility are enforced', () => {
  let game = createGame(['Ada', 'Ben', 'Chen']);

  assert.throws(() => setLongestRoad(game, 'p1', true), /at least 5 roads/);
  game.players[0].roads = 5;
  game = setLongestRoad(game, 'p1', true);
  assert.equal(game.players[0].hasLongestRoad, true);
  assert.equal(game.players[1].hasLongestRoad, false);

  assert.throws(() => setLargestArmy(game, 'p2', true), /at least 3 knights/);
  game.players[1].knightsPlayed = 3;
  game = setLargestArmy(game, 'p2', true);
  assert.equal(game.players[0].hasLargestArmy, false);
  assert.equal(game.players[1].hasLargestArmy, true);
});
