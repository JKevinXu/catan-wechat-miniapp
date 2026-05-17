const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createBoard,
  createPlayableGame,
  buildSettlement,
  buildRoad,
  upgradeCityAtVertex,
  moveRobber,
  produceResourcesForRoll,
  getAdjacentVertexIds,
  RESOURCE_TYPES
} = require('../miniprogram/utils/game');

function firstNumberedHex(board) {
  return board.hexes.find((hex) => hex.number && !hex.hasRobber);
}

function firstVertexForHex(board, hexId) {
  return board.vertices.find((vertex) => vertex.adjacentHexIds.includes(hexId));
}

function findNonAdjacentEmptyVertex(board, usedVertexIds) {
  return board.vertices.find((vertex) => {
    if (usedVertexIds.includes(vertex.id)) return false;
    const adjacent = getAdjacentVertexIds(board, vertex.id);
    return usedVertexIds.every((usedId) => !adjacent.includes(usedId));
  });
}

test('createBoard generates a playable 19-hex board topology', () => {
  const board = createBoard();

  assert.equal(board.hexes.length, 19);
  assert.ok(board.vertices.length >= 54, `expected at least 54 vertices, got ${board.vertices.length}`);
  assert.ok(board.edges.length >= 72, `expected at least 72 edges, got ${board.edges.length}`);
  assert.equal(new Set(board.hexes.map((hex) => hex.id)).size, 19);
  assert.equal(new Set(board.vertices.map((vertex) => vertex.id)).size, board.vertices.length);
  assert.equal(new Set(board.edges.map((edge) => edge.id)).size, board.edges.length);
});

test('createBoard starts one robber on the desert tile', () => {
  const board = createBoard();
  const robberHexes = board.hexes.filter((hex) => hex.hasRobber);

  assert.equal(robberHexes.length, 1);
  assert.equal(robberHexes[0].resource, 'desert');
  assert.equal(robberHexes[0].number, null);
});

test('buildSettlement obeys the distance rule even during setup', () => {
  let game = createPlayableGame(['Ada', 'Ben', 'Chen']);
  const vertex = game.board.vertices[0];
  const adjacent = getAdjacentVertexIds(game.board, vertex.id)[0];

  game = buildSettlement(game, 'p1', vertex.id, { free: true, setup: true });

  assert.equal(game.board.vertices.find((item) => item.id === vertex.id).building.playerId, 'p1');
  assert.throws(
    () => buildSettlement(game, 'p2', adjacent, { free: true, setup: true }),
    /distance rule/
  );
});

test('opening setup limits each player to two settlements', () => {
  let game = createPlayableGame(['Ada', 'Ben', 'Chen']);
  const first = game.board.vertices[0];
  const second = findNonAdjacentEmptyVertex(game.board, [first.id]);
  assert.ok(second, 'expected a legal second setup settlement vertex');

  game = buildSettlement(game, 'p1', first.id, { free: true, setup: true });
  game = buildSettlement(game, 'p1', second.id, { free: true, setup: true });

  const third = findNonAdjacentEmptyVertex(game.board, [first.id, second.id]);
  assert.ok(third, 'expected a non-adjacent third vertex to prove the setup limit');
  assert.throws(
    () => buildSettlement(game, 'p1', third.id, { free: true, setup: true }),
    /opening setup.*two settlements/i
  );
  assert.equal(game.players[0].settlements, 2);
});

test('opening setup does not allow city upgrades that bypass the two-settlement placement limit', () => {
  let game = createPlayableGame(['Ada', 'Ben', 'Chen']);
  const vertex = game.board.vertices[0];

  game = buildSettlement(game, 'p1', vertex.id, { free: true, setup: true });

  assert.throws(
    () => upgradeCityAtVertex(game, 'p1', vertex.id, { free: true, setup: true }),
    /cities.*opening setup/i
  );
});

test('buildRoad places a road connected to the player settlement', () => {
  let game = createPlayableGame(['Ada', 'Ben', 'Chen']);
  const vertex = game.board.vertices[0];
  const edge = game.board.edges.find((item) => item.vertexIds.includes(vertex.id));

  game = buildSettlement(game, 'p1', vertex.id, { free: true, setup: true });
  game = buildRoad(game, 'p1', edge.id, { free: true, setup: true });

  assert.equal(game.board.edges.find((item) => item.id === edge.id).roadOwnerId, 'p1');
  assert.throws(() => buildRoad(game, 'p2', edge.id, { free: true, setup: true }), /already has a road/);
});

test('produceResourcesForRoll gives resources to settlements and cities on matching unblocked hexes', () => {
  let game = createPlayableGame(['Ada', 'Ben', 'Chen']);
  const hex = firstNumberedHex(game.board);
  const vertex = firstVertexForHex(game.board, hex.id);

  game = buildSettlement(game, 'p1', vertex.id, { free: true, setup: true });
  game = produceResourcesForRoll(game, hex.number);

  assert.equal(game.players[0].resources[hex.resource], 1);

  game = upgradeCityAtVertex(game, 'p1', vertex.id, { free: true });
  game = produceResourcesForRoll(game, hex.number);

  assert.equal(game.players[0].resources[hex.resource], 3);
});

test('moveRobber blocks production on the robber hex', () => {
  let game = createPlayableGame(['Ada', 'Ben', 'Chen']);
  const hex = firstNumberedHex(game.board);
  const vertex = firstVertexForHex(game.board, hex.id);

  game = buildSettlement(game, 'p1', vertex.id, { free: true, setup: true });
  game = moveRobber(game, hex.id);
  game = produceResourcesForRoll(game, hex.number);

  assert.equal(game.players[0].resources[hex.resource], 0);
  assert.equal(game.board.hexes.find((item) => item.id === hex.id).hasRobber, true);
});

test('createPlayableGame keeps resource counters compatible with the tracker', () => {
  const game = createPlayableGame(['Ada', 'Ben', 'Chen']);

  assert.deepEqual(Object.keys(game.players[0].resources), RESOURCE_TYPES);
  assert.ok(game.board);
  assert.equal(game.players[0].settlements, 0);
  assert.equal(game.players[0].roads, 0);
});
