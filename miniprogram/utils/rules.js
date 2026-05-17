const RESOURCE_LABELS = {
  brick: 'Brick',
  lumber: 'Lumber',
  wool: 'Wool',
  grain: 'Grain',
  ore: 'Ore'
};

const BUILD_COSTS = [
  { name: 'Road', cost: { brick: 1, lumber: 1 }, note: 'Extends from your existing road, settlement, or city.' },
  { name: 'Settlement', cost: { brick: 1, lumber: 1, wool: 1, grain: 1 }, note: 'Must connect to your road and obey the distance rule.' },
  { name: 'City', cost: { grain: 2, ore: 3 }, note: 'Upgrades one settlement; produces 2 resources.' },
  { name: 'Development Card', cost: { wool: 1, grain: 1, ore: 1 }, note: 'Buy now, play on a later turn except hidden VP cards.' }
];

const RULE_SECTIONS = [
  {
    title: 'Goal',
    items: ['Reach 10 victory points on your turn.', 'Settlements are 1 point. Cities are 2 points.', 'Longest Road and Largest Army are 2 points each. Some development cards are 1 point.']
  },
  {
    title: 'Turn Flow',
    items: ['Roll 2 dice.', 'All players collect resources from tiles matching the roll.', 'Trade with players or bank, then build.', 'End your turn.']
  },
  {
    title: 'Robber on 7',
    items: ['No tiles produce.', 'Players with more than 7 resource cards discard half, rounded down.', 'Move the robber to block a tile.', 'Steal 1 random card from a player touching that tile.']
  },
  {
    title: 'Development Cards',
    items: ['Knight: move robber and steal 1 card.', 'Road Building: build 2 roads for free.', 'Year of Plenty: take any 2 resources from the bank.', 'Monopoly: choose a resource; all opponents give you all cards of that type.', 'Victory Point: keep hidden and reveal when you win.']
  }
];

function formatCost(cost) {
  return Object.keys(cost)
    .map((resource) => `${cost[resource]} ${RESOURCE_LABELS[resource]}`)
    .join(' + ');
}

const rulesApiExport = {
  RESOURCE_LABELS,
  BUILD_COSTS,
  RULE_SECTIONS,
  formatCost
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = rulesApiExport;
}

if (typeof window !== 'undefined') {
  window.CatanRules = rulesApiExport;
}
