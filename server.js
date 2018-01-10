const fs = require('fs')
const http = require('http')
const socketio = require('socket.io')

const readFile = file => new Promise((resolve, reject) =>
  fs.readFile(file, 'utf-8', (err, data) => err ? reject(err) : resolve(data)))

const server = http.createServer(async (request, response) => {
  try {
    response.end(await readFile(request.url.substr(1)))
  } catch (err) {
    response.end()
  }
})

let users = 1
let games = []
let waiting = []

const io = socketio(server)

io.sockets.on('connection', socket => {
  socket.emit('initialconnection', users)

  socket.on('gotuser', () => {
    if (users === 1) {
      waiting.push(socket)
      users = 2
    } else {
      usertwoconnect(socket)
      users = 1
    }
  })

  socket.on('Movemade', data => {
    checkgame('movemade', data, socket)
  })

  socket.on('flipped', data => {
    checkgame('flip', data, socket)
  })

  socket.on('Pass', data => {
    checkgame('passed', data, socket)
  })

  socket.on('Game Over', data => {
    checkgame('Game Finished', data, socket)
  })

  socket.on('disconnect', () => disconnectedplayer('disconnected', {}, socket))
})

const usertwoconnect = socket => {
  games.push({'firstplayer':waiting[0],
    'secondplayer':socket})
  waiting[0].emit('seconduserconnected')
  socket.emit('seconduserconnected')
  waiting.splice(0, 1)
}

const disconnectedplayer = (stringtoemit, data, socket) => {
  for (let i = 0; i < games.length; i++) {
    if (games[i].firstplayer === socket) {
      games[i].secondplayer.emit(stringtoemit, data)
      games.splice(i, 1)
    } else if (games[i].secondplayer === socket) {
      games[i].firstplayer.emit(stringtoemit, data)
      games.splice(i, 1)
    }
  }
}

const checkgame = (stringtoemit, data, socket) => {
  for (let i = 0; i < games.length; i++) {
    if (games[i].firstplayer === socket) {
      games[i].secondplayer.emit(stringtoemit, data)
      if (stringtoemit === 'Game Finished') {
        games[i].firstplayer.emit(stringtoemit, data)
        games.splice(i, 1)
      }
    } else if (games[i].secondplayer === socket) {
      games[i].firstplayer.emit(stringtoemit, data)
      if (stringtoemit === 'Game Finished') {
        games[i].secondplayer.emit(stringtoemit, data)
        games.splice(i, 1)
      }
    }
  }
}

server.listen(8000, () => console.log('listening at localhost:8000'))
