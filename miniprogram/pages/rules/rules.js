const { BUILD_COSTS, RULE_SECTIONS, formatCost } = require('../../utils/rules');

Page({
  data: {
    buildCosts: [],
    sections: RULE_SECTIONS
  },

  onLoad() {
    this.setData({
      buildCosts: BUILD_COSTS.map((item) => ({
        ...item,
        costText: formatCost(item.cost)
      }))
    });
  }
});
