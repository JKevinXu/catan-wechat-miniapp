Page({
  startGame(event) {
    const count = event.currentTarget.dataset.count || 3;
    wx.navigateTo({ url: `/pages/game/game?players=${count}` });
  },

  openRules() {
    wx.navigateTo({ url: '/pages/rules/rules' });
  }
});
