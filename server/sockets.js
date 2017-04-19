let io;

let userNum = 0;

const rooms = [];
const Users = {};
const Names = {};

// game constants
const HEIGHT = 500;
// const WIDTH = 300;
// const GRAVITY = 10;
const BOT_MARGIN = 20;
// const BALL_RAD = 10;
// const USER_RAD = 10;

const randColor = () => {
  const red = Math.floor((Math.random() * 255) + 0);
  return `rgb(${red}, ${255 - red}, ${Math.floor((Math.random() * 255) + 0)})`;
};

// create a new room
const createNewRoom = () => {
  const newRoom = {
    roomName: `room${rooms.length}`,
    host: 0,
    running: false,
    Balls: [],
    UserIds: [],
    Func: {},
  };

    // handle the end of a round
  newRoom.Func.endRound = function () {
    newRoom.running = false;
    newRoom.Balls = [];
    let leader = newRoom.UserIds[0];
    for (let i = 1; i < newRoom.UserIds.length; i++) {
            // make the player with the most points the leader
      if (Users[newRoom.UserIds[i]].points > Users[leader].points) {
        leader = newRoom.UserIds[i];
      }
            // remove spectator mode for players who entered mid-game
      if (Users[newRoom.UserIds[i]].spect) {
        Users[newRoom.UserIds[i]].spect = false;
        console.log('spect removed');
      }
            // reset users to not ready
      Users[newRoom.UserIds[i]].ready = false;
      console.log(Users[newRoom.UserIds[i]]);
      io.sockets.in(newRoom.roomName).emit('updateUsers', {
        user: Users[newRoom.UserIds[i]],
      });
    }
    io.sockets.in(newRoom.roomName).emit('end', {
      winner: leader,
    });
    io.sockets.in(newRoom.roomName).emit('updateRoom', {
      room: newRoom,
    });
  };
    // start a new circle


  rooms.push(newRoom);
  return (rooms.length - 1);
};

const onJoin = (sock) => {
  const socket = sock;

  socket.on('join', () => {
    socket.uid = userNum;
    userNum++;

        // find a room that isn't full or make a new one
    socket.rNum = rooms.findIndex(room => room.UserIds.length < 5);
    if (socket.rNum === -1) {
      socket.rNum = createNewRoom();
    }
    rooms[socket.rNum].UserIds.push(socket.uid);
    if (rooms[socket.rNum].UserIds.length === 1) {
      rooms[socket.rNum].host = socket.uid;
    }
    socket.roomName = `${rooms[socket.rNum].roomName}`;

    socket.join(socket.roomName);

        // add user to users
    Users[socket.uid] = {
      id: socket.uid,
      color: randColor(),
      name: `player ${socket.uid}`,
      room: socket.rNum,
      x: 20,
      y: HEIGHT - BOT_MARGIN,
      points: 0,
      spect: true,
      ready: false,
    };
        // initialize user as a spectator unless between games
    if (!rooms[socket.rNum].running) {
      Users[socket.uid].spect = false;
    }
        // add name to indicate it is taken
    Names[Users[socket.uid].name] = socket.uid;
        // give the client the state of the server
    socket.emit('syncClient', {
      id: socket.uid,
      Balls: rooms[socket.rNum].Balls,
      Users,
      rooms,
      roomNum: socket.rNum,
    });

        // send new user's data to all clients
    io.sockets.in(socket.roomName).emit('updateUsers', {
      user: Users[socket.uid],
    });
    io.sockets.in(socket.roomName).emit('updateRoom', {
      room: rooms[socket.rNum],
    });
    io.sockets.in(socket.roomName).emit('newMessage', {
      message: `${Users[socket.uid].name} joined ${socket.roomName}`,
      color: 'black',
    });
    console.log(`someone joined ${socket.roomName}`);
  });

    // remove users if they leave
  socket.on('disconnect', () => {
    socket.leave(socket.roomName);
    if (Users[socket.uid] != null) {
      delete Names[Users[socket.uid].name];
      delete Users[socket.uid];
    } rooms[socket.rNum].UserIds.splice(rooms[socket.rNum].UserIds.indexOf(socket.uid), 1);
    if (rooms[socket.rNum].UserIds.length > 0) {
      if (socket.uid === rooms[socket.rNum].host) {
        io.sockets.in(socket.roomName).emit('hostLeft');
        rooms[socket.rNum].Func.endRound();
        rooms[socket.rNum].host = rooms[socket.rNum].UserIds[0];
        io.sockets.in(socket.roomName).emit('newMessage', {
          message: `${rooms[socket.rNum].host} is new host`,
          color: 'black',
        });
        console.log(`${rooms[socket.rNum].host} is new host`);
        io.sockets.in(socket.roomName).emit('updateRoom', {
          room: rooms[socket.rNum],
        });
      }
    } else {
      rooms[socket.rNum].host = -1;
    }
    io.sockets.in(socket.roomName).emit('removeUser', {
      id: socket.uid,
    });
    console.log('someone left');
  });

  socket.on('sendMessage', (data) => {
    const newMessage = data.message.replace(/</g, '&lt;');
    io.sockets.in(socket.roomName).emit('newMessage', {
      message: `${Users[socket.uid].name}: ${newMessage}`,
      color: Users[socket.uid].color,
    });
  });

    // get movement on the canvas
  socket.on('userMove', (data) => {
        // check if spectator mode
    if (!Users[socket.uid].spect) {
      Users[socket.uid].x = data;
            // console.log(data);
      io.sockets.in(socket.roomName).emit('moveUser', {
        id: socket.uid,
        newX: Users[socket.uid].x,
      });
    }
  });

  socket.on('hostUpdateBalls', (data) => {
        // console.log(data);
    rooms[socket.rNum].Balls = data;
    io.sockets.in(socket.roomName).emit('updateBalls', data);
  });

    /*
    socket.on('hostNewBall', (data) => {
        rooms[socket.roomNum].Balls = data;
        io.sockets.in(socket.roomName).emit('updateBalls', data);
    });
    */

  socket.on('hostUpdateUser', (data) => {
    Users[data.id].points = data.points;
    io.sockets.in(socket.roomName).emit('updateUsers', {
      user: Users[data.id],
    });
  });

  socket.on('ready', () => {
    Users[socket.uid].ready = true;
    let roomReady = true;
    io.sockets.in(socket.roomName).emit('newMessage', {
      message: `${Users[socket.uid].name} is ready`,
      color: Users[socket.uid].color,
    });
    for (let i = 0; i < rooms[socket.rNum].UserIds.length; i++) {
      if (!Users[rooms[socket.rNum].UserIds[i]].ready) {
        roomReady = false;
      }
    }

        // start round if everyone ready
    if (roomReady) {
      io.sockets.in(socket.roomName).emit('newMessage', {
        message: 'game starting',
        color: 'black',
      });
      rooms[socket.rNum].Balls = [];
      for (let i = 0; i < rooms[socket.rNum].UserIds.length; i++) {
        Users[rooms[socket.rNum].UserIds[i]].points = 0;
      }
      io.sockets.in(socket.roomName).emit('reset', {
        Balls: rooms[socket.rNum].Balls,
        Users,
      });
      if (!rooms[socket.rNum].running) {
        rooms[socket.rNum].running = true;
        io.sockets.in(socket.roomName).emit('start');
      }
    }
  });


  socket.on('changeName', (data) => {
        // sanitize a bit
    const newName = data.name.replace(/</g, '&lt;');
    console.log(newName);
    if (newName === '') {
      socket.emit('denied', {
        message: 'server: cannot have empty name',
        code: 'name',
      });
    } else if (Names[newName] != null) {
      socket.emit('denied', {
        message: 'server: name already taken',
        code: 'name',
      });
    } else {
            // remove old name
      delete Names[Users[socket.uid].name];
            // add new name
      Names[newName] = socket.uid;
            // set new name
      Users[socket.uid].name = newName;
            // update clients
      io.sockets.in(socket.roomName).emit('updateUsers', {
        user: Users[socket.uid],
      });
    }
  });
};

const setupSockets = (ioServer) => {
  io = ioServer;
  io.on('connection', (socket) => {
    onJoin(socket);
        /*

        */
    console.log('connection');
  });
};

module.exports.setupSockets = setupSockets;
