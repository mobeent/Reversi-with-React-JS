const socket = io()
let state = {}
let checkother = 0
let user = 0
let points = 2
let other
let turn = 1
let otherpoints = 2
let buttonclick = 0
let passflag = 0
let hoverflipped = []
const directions = [{'x':1, 'y':0}, {'x':1, 'y':1}, {'x':0, 'y':1},
{'x':-1, 'y':1}, {'x':-1, 'y':0}, {'x':-1, 'y':-1}, {'x':0, 'y':-1},
{'x':1, 'y':-1}]


const setState = (updates) => {
  Object.assign(state, updates)
  ReactDOM.render(React.createElement(Root, state), document.getElementById('root'))
}

socket.on('initialconnection', users => {
  user = users
  if (user === 1) {
    setState({'message':'Waiting for Player 2', 'points':points, 'otherpoints':0})
    socket.emit('gotuser')
  } else {
    checkother = 1
    setState({message:'Turn: Player 1', 'points':points, 'otherpoints':2})
    socket.emit('gotuser')
  }
})

socket.on('seconduserconnected', () => {
  if (user === 1) {
    checkother = 1
    setState({message:'Turn: Player 1', 'points':points, 'otherpoints': 2})
  }
})

socket.on('movemade', data => {
  coordinates = data.coords;
  otherpoints = data.points
  if (data.turn === 1) {
    turn = 2
    setState({message:'Turn: Player 2', 'points':points, 'otherpoints': otherpoints})
  } else {
    turn = 1
    setState({message:'Turn: Player 1', 'points':points, 'otherpoints': otherpoints})
  }
  if (possiblemoves() === 0 && points !== 0) {
    setState({message:'No possible moves. Pass turn.', 'points':points, 'otherpoints': otherpoints})
  }
  if (points === 0) {
    socket.emit('Game Over', {coords:'coordinates', 'points':points})
  }
  if (noemptyspace() === 0) {
    socket.emit('Game Over', {coords:'coordinates', 'points':points})
  }
})

socket.on('flip', data => {
  coordinates = data.coords;
  points = points - 1
  setState()
})

socket.on('passed', data => {
  passflag = 1
  turn = data.turn
  if (turn === 1) {
    setState({message:'Turn: Player 1', 'points':points, 'otherpoints': otherpoints})
  } else if (turn === 2) {
    setState({message:'Turn: Player 2', 'points':points, 'otherpoints': otherpoints})
  }
})

socket.on('Game Finished', data => {
  checkother = 0
  if (points > otherpoints) {
    setState({message:'Game Over, YOU WIN CONGRATULATIONS!', 'points':points, 'otherpoints': otherpoints})
  } else if (points < otherpoints) {
    setState({message:'Game Over, YOU LOSE, TOUGH LUCK!', 'points':points, 'otherpoints': otherpoints})
  } else {
    setState({message:'Game Over, It is a DRAW!', 'points':points, 'otherpoints': otherpoints})
  }
})

socket.on('disconnected', data => {
  setState({message:'The other player disconnected. Reload Game.', 'points':points, 'otherpoints': otherpoints})
})

const noemptyspace = () => {
  let empty = 0
  for (let idx = 1; idx < 9; idx++) {
    for (let idy = 1; idy < 9; idy++) {
      if (coordinates[idx-1][idy-1].buttonval == '') {
        empty = 1
        break
      }
    }
    if (empty === 1)
      break
  }
  return empty
}

const possiblemoves = () => {
  let moves = 0
  for (let idx = 1; idx < 9; idx++) {
    for (let idy = 1; idy < 9; idy++) {
      for (let i = 0; i < directions.length; i++) {
        let count = 0
        count = chekmovement(idx, idy, count, directions[i])
        if (count !== 0) {
          moves = 1
          break
        }
      }
      if (moves === 1)
        break
    }
    if (moves === 1)
      break
  }
  return moves
}

const handleClick = (element) => {
  buttonclick = 1
  hoverflipped.forEach(value => {
    coordinates[value.x-1][value.y-1].buttonval = value.id
  })
  setState()
  hoverflipped = []
  idx = parseInt(element.buttonid[1])
  idy = parseInt(element.buttonid[2])
  if (turn === user && checkother === 1) {
    if (coordinates[idx-1][idy-1].buttonval == '') {
      if (validmove(element) === true) {
        if (user === 1)
          coordinates[idx-1][idy-1].buttonval = 'X';
        else
          coordinates[idx-1][idy-1].buttonval = 'O';
        points = points + 1
        socket.emit('Movemade', {'coords':coordinates, 'turn':turn, 'points':points})
        if (turn === 1) {
          turn = 2
          setState({message:'Turn: Player 2', 'points':points, 'otherpoints':otherpoints})
        } else {
          turn = 1
          setState({message:'Turn: Player 1', 'points':points, 'otherpoints': otherpoints})
        }
      }
    }
  }
}

const validmove = (element) => {
  let flipped = 0
  const idx = parseInt(element.buttonid[1])
  const idy = parseInt(element.buttonid[2])
  for (let i = 0; i < directions.length; i++) {
    let count = 0
    count = chekmovement(idx, idy, count, directions[i])
    if (count !== 0) {
      flipped = flipped + 1
      flip(idx, idy, directions[i], count)
    }
  }
  return flippedornot(flipped)
}

const chekmovement = (idx, idy, count, direction) => {
  while (1) {
    idx = direction.x + idx
    idy = direction.y + idy
    if (checkedge(idx, idy) || coordinates[idx-1][idy-1].buttonval == '') {
      count = 0
      break
    }
    if (user === 1) {
      if (coordinates[idx-1][idy-1].buttonval === 'X') {
        break
      }
    }
    if (user === 2) {
      if (coordinates[idx-1][idy-1].buttonval === 'O') {
        break
      }
    }
    count = count + 1
  }
  return count
}

const checkedge = (x, y) => {
  return y === 9 || y === 0 || x === 0 || x === 9
}

const flippedornot = (flipped) => {
  if (flipped === 0) {
    return false
  }
  return true
}

const flip = (idx, idy, direction, count) => {
  for (let i = 0; i < count; i++) {
    idx = direction.x + idx
    idy = direction.y + idy
    points = points + 1
    if (user === 1)
      coordinates[idx-1][idy-1].buttonval = 'X';
    else
      coordinates[idx-1][idy-1].buttonval = 'O';

    otherpoints = otherpoints - 1;
    socket.emit('flipped', {'coord':coordinates, 'turn':turn})
  }
}

let coordinates = [];
let temp = [];
for (let i = '1'; i < '9'; i++) {
  temp = [];
  for (let j = '1'; j < '9'; j++) {
    if (i == '4' && j == '4') {
      temp.push({'buttonid':"b"+i+j, 'buttonval':'X'})
    } else if (i == '5' && j == '5') {
      temp.push({'buttonid':"b"+i+j, 'buttonval':'X'})
    } else if (i == '4' && j == '5') {
      temp.push({'buttonid':"b"+i+j, 'buttonval':'O'})
    } else if (i == '5' && j == '4') {
      temp.push({'buttonid':"b"+i+j, 'buttonval':'O'})
    } else {
      temp.push({'buttonid':"b"+i+j, 'buttonval':''})
    }
  }
  coordinates.push(temp);
}

const handlePass = (val) => {
  if (checkother === 1) {
    if (passflag === 1) {
      socket.emit('Game Over', {coords:'coordinates', 'points':points})
    } else {
      if (user === 1) {
        turn = 2
        setState({message:'Turn: Player 2', 'points':points, 'otherpoints': otherpoints})
      } else if (user === 2) {
        turn = 1
        setState({message:'Turn: Player 1', 'points':points, 'otherpoints': otherpoints})
      }
      socket.emit(val, {'turn':turn})
    }
  }
}

const over = (element) => {
  idx = parseInt(element.buttonid[1])
  idy = parseInt(element.buttonid[2])
  if (coordinates[idx-1][idy-1].buttonval == '') {
    hoverover(element)
    setState()
  }
}

const hoverover = (element) => {
  let alreadystored = 0
  const idx = parseInt(element.buttonid[1])
  const idy = parseInt(element.buttonid[2])
  for (let i = 0; i < directions.length; i++) {
    let count = 0
    count = chekmovement(idx, idy, count, directions[i])
    if (count !== 0) {
      if (alreadystored === 0) {
        hoverflipped.push({'x':idx, 'y':idy, 'id':coordinates[idx-1][idy-1].buttonval})
        coordinates[idx-1][idy-1].buttonval = '--';
        alreadystored = 1
      }
      hoverflip(idx, idy, directions[i], count)
    }
  }
}

const hoverflip = (idx, idy, direction, count) => {
  for (let i = 0; i < count; i++) {
    idx = direction.x + idx
    idy = direction.y + idy
    hoverflipped.push({'x':idx, 'y':idy, 'id':coordinates[idx-1][idy-1].buttonval})
    coordinates[idx-1][idy-1].buttonval = '--';
  }
}

const out = (element) => {
  if (buttonclick === 0) {
    hoverflipped.forEach(value => {
      coordinates[value.x-1][value.y-1].buttonval = value.id
    })
    setState()
    hoverflipped = []
  } else {
    buttonclick = 0
  }
}

const Root = (state) =>
  React.createElement('div', {style: {'margin': '50px', 'margin-left':'400px'}}, [`You are: Player ${user}`,
    React.createElement('div', {style: {'margin-left':'400px'}}, [`Your Score : ${state.points}`]),
    React.createElement('div', {style: {'margin-left':'400px'}}, [`Other player Score : ${state.otherpoints}`]),
    React.createElement('div', null, [`${state.message}`,
      coordinates.map(value =>
        React.createElement('div', null, [
          value.map(element =>
            React.createElement('button', {onClick: () => handleClick(element), onMouseOver: () => over(element),
              onMouseOut: () => out(element),
              style: {'height': '70px', 'width': '70px', 'font-size': '20pt'}}, `${element.buttonval}`)
          )
        ])
      ),
      React.createElement('button', {onClick: () => handlePass('Pass'),
        style: {'margin':'20px', 'margin-left':'200px', 'height': '50px', 'width': '150px', 'font-size': '15pt'}}, 'Pass Turn')
    ])
  ])
