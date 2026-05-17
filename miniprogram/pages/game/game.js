const {
  RESOURCE_TYPES,
  createGame,
  calculateVictoryPoints,
  totalResources,
  adjustResource,
  adjustCounter,
  upgradeSettlementToCity,
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

  return {
    game,
    currentPlayer,
    resourceTypes: RESOURCE_TYPES,
    discardCandidateNames,
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
  data: withViewModel(createGame(3)),

  onLoad(query) {
    const playerCount = Number(query.players || 3);
    this.setGame(createGame(playerCount));
  },

  setGame(game) {
    this.setData(withViewModel(game));
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
