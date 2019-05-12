var { Chances } = require('./chance');

const Move = {
  apply: (move) => {
    switch (move.uci) {
    case "buy":
      return Buy(move.type);
    case "nobuyland":
      return Nobuyland;
    case "roll":
      return Roll();
    case "sell":
      return Sell(move.cities);
    case "selectcity":
      return SelectCity(move.city);
    }
    return null;
  }
};

function SelectCity(city) {
  return {
    uci: 'selectcity',
    city
  };
}

function Buy(type) {
  return {
    uci: 'buy',
    type
  };
}

const Nobuyland = {
  uci: 'nobuyland'
};

function Sell(cities) {
  return {
    uci: 'sell',
    cities
  };
}

const withRolls = function(arr) {
  var i = 0;
  return () => {
    return arr[(i++)%arr.length];
  };
};

// theme park
const rollTest1 = withRolls([1,1,1,1,16]);
const rollTest2 = withRolls([1,2,1,2,2,14,22]);

// chance
const rollTest3 = withRolls([1,2,1,1]);

// bankrupt
const rollTest4 = withRolls([1]);

function Roll() {
  return {
    uci: 'roll',
    // dice1: rollTest4(),
    // dice2: 0,
    // dice1: 1,
    // dice2: Math.ceil(Math.random() * 2),
    dice1: Math.ceil(Math.random() * 6),
    dice2: Math.ceil(Math.random() * 6),
    chance: Chances.random()
    // chance: Chances.byKey['reducetolls']
  };
};

function RollWith(dice1, dice2, chance) {
  return {
    uci: 'roll',
    dice1: dice1,
    dice2: dice2,
    chance: Chances.byKey[chance]
  };
};

module.exports = {
  Move,
  SelectCity,
  Buy,
  Nobuyland,
  Sell,
  Roll,
  RollWith
};
