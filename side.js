module.exports = {
  fromTurns: (turns) => {
    return (turns % 2 === 1 ? 'player1': 'player2');
  }
};
