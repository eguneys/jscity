var { ok, is, not, isabove, deep_is, runtest, matcher, log } = require('./testutils');
var { makeGame, Game } = require('./game');
var { SelectCity, Sell, Buy, Nobuyland, Roll, RollWith } = require('./move');
var { Cities, Tiles } = require('./state');


const noevent = runtest(matcher((game, ename) => {
  return game.events.filter(e => !!e[ename]).length === 0;
}, 'contains event'));
const oneevent =  runtest(matcher((game, ename) => {
  return game.events.filter(e => !!e[ename]).length === 1;
}, "doesn't contain event"));

function withGame(f) {
  return f(makeGame());
}

function applyMoves(game, ...args) {
  return args.reduce((g, arg) => !!g?g.move(arg):null, game);
}

function Tests() {
  this.run = () => {
    gameTests();
    chanceTests();
  };
}

function chanceTests() {

  const rollChance = (chance) => RollWith(3, 0, chance);

  log("chances");

  withGame(game => {
    game.players['player1'].cash = 1000;
    const game2 = game.move(rollChance('ragstoriches'));
    is('exchange cash', game2.players['player1'].cash, 2000);
    is('exchange cash', game2.players['player2'].cash, 1000);
    oneevent('rags event', game2, 'rags');
  });

  withGame(game => {
    const game2 = game.move(rollChance('visitseoul'));
    is('on seoul', game2.players['player1'].currentTile, 21);
    is('move event', game2.events.filter(e => e['move'] === 18).length, 1);
  });  


  withGame(game => {
    const game2 = game.move(rollChance('backward1'));
    isabove('backward move event', game.events.filter(e => e['move']).length, 2);
    is("move backwards", game.players['player1'].currentTile, 2);

    const game3 = makeGame().move(rollChance('forward2'));
    isabove('forward move event', game3.events.filter(e => e['move']).length, 2);
    is("move forwards", game3.players['player1'].currentTile, 5);
  });

  withGame(game => {
    const game2 = game.move(rollChance('starcity'));
    oneevent('no place to select', game2, 'nocity');

    const game3 = applyMoves(makeGame(),
                             RollWith(1,0),
                             Buy("land"),
                             RollWith(1,0),
                             RollWith(2,0, 'starcity'));
    is('star city prompt', game3.prompt, 'starcity');
    is('same turn', game3.turns, 3);
    deep_is('select city', game3.selectCities, ['hongkong']);

    const game4 = game3.move(SelectCity('hongkong'));

    ok("can select city", game4);
    oneevent("star city event", game4, 'starcity');
  });

  withGame(game => {
    const game4 = applyMoves(game,
                             RollWith(1,0),
                             Nobuyland,
                             RollWith(4,0),
                             Buy("land"),
                             RollWith(2, 0, 'reducetolls'),
                             SelectCity('jakarta'));
    ok('can select city for reduce tolls', game4);
    oneevent("reduce tolls event", game4, 'reducetolls');

    const game2 = applyMoves(makeGame(),
                             RollWith(1,0),
                             Nobuyland,
                             RollWith(4,0),
                             Buy("land"),
                             RollWith(2, 0, 'reducetolls'),
                             SelectCity('jakarta'),
                             RollWith(1,0),
                             Nobuyland,
                             // jakarta
                             RollWith(1,0));
    is("reduce tolls no pay toll", game2.players['player1'].cash, 2000);

    const game3 = applyMoves(game2,
                             // 2
                             RollWith(2,0),
                             Nobuyland,
                             RollWith(3, 0),
                             Nobuyland,
                             // 3
                             RollWith(1,0),
                             Nobuyland,
                             RollWith(1,0),
                             Nobuyland);

    oneevent('reduce tolls expire event', game3, 'reduceexpire');

    const game5 = applyMoves(game3,
                             // 4
                             RollWith(2,0),
                             Nobuyland,
                             RollWith(20, 0));

    is("reduce tolls pay toll after 3 turns", game5.players['player1'].cash, 2000 + 300 -
       Cities['jakarta']['land'].toll);
                             
  });

}

function gameTests() {

  for (var i = 0; i<100; i++) {
    var cityIndex = Tiles.cityIndex();
    is('city index', Tiles[cityIndex].type, 'city');
  }

  withGame(game => {
    const invalidMoves = [Buy('land'),
                          Nobuyland,
                          Sell(['jakarta']),
                          SelectCity('jakarta')];
    
    invalidMoves.forEach(move =>
      withGame(game => {
        var game2 = game.move(move);
        is(`can't ${move.uci} on first move`,
           game2, null);
      })
    );
  });

  withGame(game => {
    var roll = Roll();
    var game2 = game.move(roll);
    log('for random roll' + (roll.dice1 + roll.dice2));

    ok('roll move is ok', game2);
    is('contains roll event', game2.events.filter(event => !!event['roll']).length, 1);
    isabove('contains move event', game2.events.filter(event => !!event['move']).length, 1);
    // not('prompt is not roll', game2.prompt, 'roll');
  });

  withGame(game => {
    log('double roll');
    var doubleRoll = RollWith(1,1);
    var game2 = applyMoves(game, doubleRoll,
                           Buy("land"));
    is('player turn is not changed', game2.turnColor, 'player1');    
  });

  log('foreveryroll');
  let chance = 'ragstoriches';
  [RollWith(1,1), RollWith(1,2, chance), RollWith(1,5)].forEach(rollMove => {
    log(rollMove.dice1 + rollMove.dice2);
    not('roll move is ok', makeGame().move(rollMove), null);
    not('roll move is ok', makeGame().move(rollMove), undefined);
    oneevent('contains roll event', makeGame().move(rollMove), 'roll');
    // not('prompt is not roll', makeGame().move(rollMove).prompt, 'roll');
  });

  log('buycity');
  const landOnCity = RollWith(2, 0);
  const landOnCity2 = RollWith(1,3);
  const landOnChance = RollWith(1,2, 'ragstoriches');
  const landOnCorner = RollWith(12, 0);
  withGame(game => {
    const game2 = game.move(landOnCity);
    is('prompt is ok', game2.prompt, 'buycity');
    is('turn is ok', game2.turns, 1);
    is('current tile is ok', game2.players[game2.turnColor].currentTile, 2);
    is('cannot roll twice', game2.move(Roll()), null);
  });

  withGame(game => {
    const game2 = applyMoves(game, landOnCity, Nobuyland);
    log('buycity nobuyland');
    ok('is valid', game2);
    is('prompt is ok', game2.prompt, 'roll');
    is('turn is ok', game2.turns, 2);
    noevent('no buy event', game2, 'buy');
  });

  withGame(game => {
    const game2 = applyMoves(game, landOnCity, Buy('land'));
    log('buycity buyland');
    ok('is valid', game2);
    is('prompt is ok', game2.prompt, 'roll');
    is('turn is ok', game2.turns, 2);
    oneevent('one buy event', game2, 'buy');

    log('buycity buyland on no cash');
    game2.players['player2'].cash = 1;
    const game3 = game.move(landOnCity2);
    is('prompt is ok', game2.prompt, 'roll');
    is('turn is next turn', game2.turns, 3);
  });
  
  withGame(game => {
    const game2 = applyMoves(game, landOnCity, Nobuyland, landOnCity, Nobuyland);
    log('buycity start roll on city');
    ok('is valid', game2);
    is('prompt is ok', game2.prompt, 'roll');
    is('turn is ok', game2.turns, 3);

    const game3 = game2.move(Buy('land'));
    is('not possible to buyland before roll', game3, null);
  });

  withGame(game => {
    log('land on chance');
    const game2 = applyMoves(game, landOnChance);
    const game3 = applyMoves(makeGame(), landOnChance, Nobuyland);
    const game4 = applyMoves(makeGame(), landOnChance, Buy("land"));
    not('no buy prompt', game2.prompt, 'buycity');
    oneevent('chance event', game2, 'chance');
    is('cant nobuyland', game3, null);
    is('cant buyland', game4, null);
  });

  withGame(game => {
    log('land on corner');
    const game2 = applyMoves(game, landOnCorner);
    not('no buy prompt', game2.prompt, 'buycity');
    is('cant nobuyland', game2.move(Nobuyland), null);
    is('cant buyland', game2.move(Buy("land")), null);
  });

  const landOnSame = RollWith(Tiles.length, 0);
  withGame(game => {
    log('pay toll');
    const game2 = applyMoves(game, landOnCity, Buy("land"), landOnCity);
    is('prompt roll', game2.prompt, 'roll');
    is('turns ok', game2.turns, 3);
    oneevent('paytoll event', game2, 'toll');
    log("land on own city when land owned");
    const game3 = game.move(landOnSame);
    is('prompt buycity', game3.prompt, 'buycity');
    is('turns ok', game3.turns, 3);
    noevent('no paytoll', game3, 'toll');
    log("land on own city when hotel owned");
    const game4 = applyMoves(game3,
                             Buy('hotel'),
                             landOnCity,
                             Nobuyland,
                             landOnSame);
    ok('is valid', game4);
    is('prompt is roll', game4.prompt, 'roll');
    is ('turns ok', game4.turns, 6);
    noevent('no paytoll', game4, 'toll');
    log("buy land twice");
    const game5 = applyMoves(makeGame(),
                             landOnCity,
                             Buy("land"),
                             landOnCity,
                             landOnSame,
                             Buy('land'));
    // is('not valid', game5, null);
  });

  const landOnShanghai = RollWith(2, 0);
  const landOnGo = RollWith(Tiles.length, 0);
  const passGo = RollWith(Tiles.length, 3, 'starcity');
  withGame(game => {
    log("cash payments");
    const game2 = applyMoves(game, landOnShanghai, Buy("land"));
    is('buy land pays cash', game2.players['player1'].cash, 2000 - Cities['shanghai']['land'].cost);
    const game3 = applyMoves(game, landOnShanghai);
    is('pay toll pays cash', game2.players['player2'].cash, 2000 - Cities['shanghai']['land'].toll);
    is('payed toll earns cash', game2.players['player1'].cash, 2000 - Cities['shanghai']['land'].cost + Cities['shanghai']['land'].toll);

    const game4 = applyMoves(makeGame(), landOnGo);
    is('land on go earns cash', game4.players['player1'].cash, 2300);
    is('pass go earns cash', game4.move(passGo).players['player1'].cash, 2300);
   
    const game5 = makeGame();
    game5.players['player1'].cash = 100;
    const game6 = applyMoves(game5, landOnShanghai, Buy("hotel"));
    is('cant afford buy', game6, null);
  });

  withGame(game => {
    log("finish game");
    game.players['player2'].cash = 10;
    const game2 = applyMoves(game, landOnShanghai,
                             Buy("hotel"), landOnShanghai);
    is("game ends when player bankrupts", game2.finished(), true);
    is("game winner", game2.winner, 'player1');
    oneevent("player bankrupts", game2, 'bankrupt');
  });

  withGame(game => {
    log("player assets");
    is("cash is asset", game.playerAsset('player1'), game.players['player1'].cash);
    const game2 = applyMoves(game, landOnShanghai, Buy("land"));
    const landCost = Cities['shanghai']['land'].cost;
    is("land is asset", game.playerAsset('player1'), game2.players['player1'].cash + landCost);

    log("pay toll on low cash with assets");
    // jakarta land toll 7
    const game3 = applyMoves(makeGame(),
                             landOnShanghai,
                             Buy("land"),
                             RollWith(4, 0),
                             Buy("land"));
    game3.players['player1'].cash = 0;
    const game4 = game3.move(RollWith(2, 0));
    is("prompt is sell", game4.prompt, 'sell');
    is("turn is ok", game4.turns, 3);
    is("need money is ok", game4.needMoney, 7);
    noevent("no bankrupt", game4, 'bankrupt');
    noevent("no bankrupt", game4, 'toll');
    not('game is not finished', game4.finished(), true);

    log("pay toll on low cash with no assets");
    // jakarta land toll 7
    const game5 = applyMoves(makeGame(),
                             RollWith(2, 0),
                             Nobuyland,
                             RollWith(4, 0),
                             Buy("land"));
    game5.players['player1'].cash = 0;
    const game6 = game5.move(RollWith(2, 0));
    not("prompt is not sell", game6.prompt, 'sell');
    is("turn is ok", game6.turns, 3);
    oneevent("bankrupt", game6, 'bankrupt');
    is('game is finished', game6.finished(), true);
  });

  withGame(game => {
    log("sell unowned city");
    // jakarta land toll 7
    const game3 = applyMoves(game,
                             landOnShanghai,
                             Buy("land"),
                             // jakarta
                             RollWith(4, 0),
                             Buy("land"));
    game3.players['player1'].cash = 0;
    const game4 = applyMoves(game3,
                             RollWith(2, 0),
                             Sell(['hongkong']));
    is("not valid", game4, null);
    const game5 = game3.move(Sell(['jakarta']));
    is("not valid", game5, null);

    const game6 = applyMoves(makeGame(),
                             // shanghai
                             RollWith(2, 0),
                             Buy("land"),
                             // buenos
                             RollWith(10, 0),
                             Buy("hotel"),
                             // mumbai
                             RollWith(5, 0),
                             Buy("hotel"),
                             // player1
                             RollWith(3, 0),
                             Nobuyland);
    game6.players['player1'].cash = 0;
    const game7 = applyMoves(game6,
                             // buenos
                             RollWith(3, 0),
                             Sell(['shanghai']));
    is("cant sell not enough cost", game7, null);


    const game8 = applyMoves(makeGame(),
                             // shanghai cost 30
                             RollWith(2, 0),
                             Buy("land"),
                             // buenos hotel toll 525
                             RollWith(10, 0),
                             Buy("hotel"),
                             // mumbai
                             RollWith(5, 0),
                             Buy("hotel"),
                             // player1
                             RollWith(3, 0),
                             Nobuyland);
    game8.players['player1'].cash = 525 - 30;
    const game9 = applyMoves(game8,
                             // buenos
                             RollWith(3, 0),
                             Sell(['shanghai']));
    not("can sell with cash and asset", game9, null);
  });

  withGame(game => {
    log("sell city");
    // jakarta land toll 7
    // shanghai land cost 30
    const game6 = applyMoves(game,
                             landOnShanghai,
                             Buy("land"),
                             // jakarta
                             RollWith(4, 0),
                             Buy("land"));
    game6.players['player1'].cash = 0;
    const game7 = applyMoves(game6,
                             RollWith(2, 0),
                             Sell(['shanghai']));
    ok('game is ok', game7);
    is("prompt is roll", game7.prompt, 'roll');
    is("turns is ok", game7.turns, 4);
    is("player cash is ok", game7.players['player1'].cash, Cities['shanghai']['land'].cost - Cities['jakarta']['land'].toll);
    is("player doesnt own city", game7.tolls['shanghai'], undefined);
    oneevent("sell event", game7, 'sell');
    oneevent("toll event", game7, 'toll');
  });

  withGame(game => {
    log("city streak");
    const game2 = applyMoves(game,
                             landOnShanghai,
                             Buy("land"),
                             landOnShanghai,
                             // hongkong
                             RollWith(23, 0),
                             Buy("land"));
    oneevent("streak event", game2, 'streak');

    const game3 = applyMoves(makeGame(),
                             //hongkong
                             RollWith(1,0),
                             Buy("land"),
                             RollWith(1,0),
                             // shanghai
                             RollWith(1,0),
                             Buy("land"));
    oneevent("streak event", game3, 'streak');

    const game5 = applyMoves(game3,
                             // shanghai toll 2
                             RollWith(1,0));
    is("player pays double", game5.players['player2'].cash, 2000 - Cities['hongkong']['land'].toll - Cities['shanghai']['land'].toll * 2);


    const game4 = applyMoves(makeGame(),
                             //hongkong
                             RollWith(1,0),
                             Buy("land"),
                             RollWith(1,0),
                             // shanghai
                             RollWith(1,0),
                             Buy("land"),
                             RollWith(1,0),
                             RollWith(23, 0),
                             Buy("hotel"));
    noevent("no streak event after upgrade", game4, 'streak');
  });

  withGame(game => {
    const game2 = applyMoves(game,
                             RollWith(1,0),
                             Buy("land"),
                             RollWith(2,0),
                             Buy("land"));    
    noevent("no streak evnet on different owners", game2, 'streak');
  });

  withGame(game => {
    log('streak is removed on sell');
    const game2 = applyMoves(makeGame(),
                             //hongkong
                             RollWith(1,0),
                             Buy("land"),
                             RollWith(4,0),
                             Buy("land"),
                             // shanghai
                             RollWith(1,0),
                             Buy("land"),
                             RollWith(1,0),
                             Nobuyland);
    game2.players['player1'].cash = 0;
    const game3 = applyMoves(game2,
                             RollWith(2, 0),
                             Sell(['hongkong']));

    is('streak is gone', game3.streaks['hongkong'].sold, true);
    is('multiply is gone', game3.tolls['shanghai'].multiply, 1);
  });

  withGame(game => {
    log('streak is added after a sell');
    const game2 = applyMoves(makeGame(),
                             //hongkong
                             RollWith(1,0),
                             Buy("land"),
                             RollWith(4,0),
                             Buy("land"),
                             // shanghai
                             RollWith(1,0),
                             Buy("land"),
                             RollWith(1,0),
                             Nobuyland);
    game2.players['player1'].cash = 0;
    const game3 = applyMoves(game2,
                             RollWith(2, 0),
                             Sell(['hongkong', 'shanghai']),
                             RollWith(20, 0),
                             Buy("land"),
                             RollWith(1,0),
                             RollWith(1,0),
                             Buy("land"));

    oneevent("streak event", game3, 'streak');
  });

  withGame(game => {
    log("tornado corner");
    const game2 = applyMoves(game,
                             RollWith(6, 0));
    oneevent("tornado event", game2, 'tornado');
    not("current tile is changed", game2.players['player1'].currentTile, 6);

  });

  withGame(game => {
    log("theme park corner");
    const game2 = applyMoves(game,
                             RollWith(1, 0),
                             Buy("land"),
                             RollWith(1, 0),
                             RollWith(1, 0),
                             Buy("land"),
                             RollWith(1, 0),
                             RollWith(16, 0));
    is("prompt select theme city", game2.prompt, 'themecity');
    is("turn is ok ", game2.turns, 5);
    deep_is("selectcities is ok", game2.selectCities, ['hongkong', 'shanghai']);

    const game3 = game2.move(SelectCity('mumbai'));
    is("cant select other city", game3, null);

    const game4 = game2.move(SelectCity('hongkong'));
    ok("can select city", game4);
    is("prompt is ok", game4.prompt, 'roll');
    is("turn is ok", game4.turns, 6);
    oneevent("themecity event", game4, 'themecity');
  });

  withGame(game => {
    log("theme park corner no city to select");
    const game2 = applyMoves(game,
                             RollWith(18, 0));
    is("prompt roll", game2.prompt, 'roll');
    is("turn is ok ", game2.turns, 2);
    oneevent('no city to select', game2, 'nocity');
  });

  withGame(game => {
    const game2 = applyMoves(game,
                             RollWith(1, 0),
                             Buy("land"),
                             RollWith(1, 0),
                             RollWith(1, 0),
                             Buy("land"),
                             RollWith(1, 0),
                             RollWith(16, 0),
                             SelectCity("hongkong"),
                             RollWith(23, 0));
    is("theme city costs double", game2.players['player2'].cash,
       2000 + 300 -
       Cities['hongkong']['land'].toll -
       Cities['shanghai']['land'].toll * 2 -
       Cities['hongkong']['land'].toll * 4 );
  });

}

module.exports = {
  Tests
};
