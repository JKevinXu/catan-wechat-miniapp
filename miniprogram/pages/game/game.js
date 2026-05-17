const {
  RESOURCE_TYPES,
  createPlayableGame,
  calculateVictoryPoints,
  totalResources,
  adjustResource,
  adjustCounter,
  upgradeSettlementToCity,
  buildSettlement,
  buildRoad,
  upgradeCityAtVertex,
  moveRobber,
  rollDice,
  endTurn,
  setLongestRoad,
  setLargestArmy
} = require('../../utils/game');

function withViewModel(game) {
  const currentPlayer = game.players[game.currentPlayerIndex] || null;
  const discardCandidateNames = game.lastRoll
    ? game.lastRoll.discardCandidates
      .map((id) => game.players.find((player) => player.id === id))
      .filter(Boolean)
      .map((player) => player.name)
      .join(', ')
    : '';

  const boardHexes = game.board.hexes.map((hex) => ({
    ...hex,
    label: hex.number ? `${hex.resource} ${hex.number}` : hex.resource,
    robberLabel: hex.hasRobber ? ' ● robber' : ''
  }));

  const boardVertices = game.board.vertices.map((vertex) => ({
    ...vertex,
    label: vertex.building ? `${vertex.building.type} ${vertex.building.playerId}` : 'empty'
  }));

  const boardEdges = game.board.edges.map((edge) => ({
    ...edge,
    label: edge.roadOwnerId ? `road ${edge.roadOwnerId}` : 'empty edge'
  }));

  return {
    game,
    currentPlayer,
    resourceTypes: RESOURCE_TYPES,
    discardCandidateNames,
    boardHexes,
    boardVertices,
    boardEdges,
    log: game.log || [],
    players: game.players.map((player) => ({
      ...player,
      resourceRows: RESOURCE_TYPES.map((resource) => ({
        name: resource,
        count: player.resources[resource]
      })),
      resourceTotal: totalResources(player),
      score: calculateVictoryPoints(player)
    })),
    isRollPhase: game.phase === 'ROLL',
    isGameOver: game.phase === 'GAME_OVER',
    winner: game.winnerId ? game.players.find((player) => player.id === game.winnerId) : null
  };
}

Page({
  data: {
    ...withViewModel(createPlayableGame(3)),
    mode: 'settlement',
    freeBuild: true
  },

  onLoad(query) {
    const playerCount = Number(query.players || 3);
    this.setGame(createPlayableGame(playerCount));
  },

  setGame(game) {
    this.setData(withViewModel(game));
  },

  setMode(event) {
    this.setData({ mode: event.currentTarget.dataset.mode });
  },

  toggleFreeBuild() {
    this.setData({ freeBuild: !this.data.freeBuild });
  },

  currentBuildOptions() {
    return { free: this.data.freeBuild, setup: this.data.freeBuild };
  },

  roll() {
    try {
      this.setGame(rollDice(this.data.game));
    } catch (error) {
      wx.showToast({ title: error.message, icon: 'none' });
    }
  },

  endTurn() {
    this.setGame(endTurn(this.data.game));
  },

  tapHex(event) {
    if (this.data.mode !== 'robber') return;
    try {
      this.setGame(moveRobber(this.data.game, event.currentTarget.dataset.hexId));
    } catch (error) {
      wx.showToast({ title: error.message, icon: 'none' });
    }
  },

  tapVertex(event) {
    const playerId = this.data.currentPlayer.id;
    const vertexId = event.currentTarget.dataset.vertexId;
    try {
      if (this.data.mode === 'settlement') {
        this.setGame(buildSettlement(this.data.game, playerId, vertexId, this.currentBuildOptions()));
      } else if (this.data.mode === 'city') {
        this.setGame(upgradeCityAtVertex(this.data.game, playerId, vertexId, this.currentBuildOptions()));
      }
    } catch (error) {
      wx.showToast({ title: error.message, icon: 'none' });
    }
  },

  tapEdge(event) {
    if (this.data.mode !== 'road') return;
    try {
      this.setGame(buildRoad(this.data.game, this.data.currentPlayer.id, event.currentTarget.dataset.edgeId, this.currentBuildOptions()));
    } catch (error) {
      wx.showToast({ title: error.message, icon: 'none' });
    }
  },

  adjustResource(event) {
    const { playerId, resource, delta } = event.currentTarget.dataset;
    try {
      this.setGame(adjustResource(this.data.game, playerId, resource, Number(delta)));
    } catch (error) {
      wx.showToast({ title: error.message, icon: 'none' });
    }
  },

  adjustCounter(event) {
    const { playerId, field, delta } = event.currentTarget.dataset;
    try {
      this.setGame(adjustCounter(this.data.game, playerId, field, Number(delta)));
    } catch (error) {
      wx.showToast({ title: error.message, icon: 'none' });
    }
  },

  upgradeCity(event) {
    const { playerId } = event.currentTarget.dataset;
    try {
      this.setGame(upgradeSettlementToCity(this.data.game, playerId));
    } catch (error) {
      wx.showToast({ title: error.message, icon: 'none' });
    }
  },

  toggleLongestRoad(event) {
    const { playerId } = event.currentTarget.dataset;
    const player = this.data.game.players.find((item) => item.id === playerId);
    try {
      this.setGame(setLongestRoad(this.data.game, playerId, !player.hasLongestRoad));
    } catch (error) {
      wx.showToast({ title: error.message, icon: 'none' });
    }
  },

  toggleLargestArmy(event) {
    const { playerId } = event.currentTarget.dataset;
    const player = this.data.game.players.find((item) => item.id === playerId);
    try {
      this.setGame(setLargestArmy(this.data.game, playerId, !player.hasLargestArmy));
    } catch (error) {
      wx.showToast({ title: error.message, icon: 'none' });
    }
  },

  openRules() {
    wx.navigateTo({ url: '/pages/rules/rules' });
  }
});
