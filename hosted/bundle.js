"use strict";

var draw = function draw() {
    ctx.fillStyle = "rgb(250,250,250)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    //console.log("clear");

    // draw falling balls
    if (draws.length > 0) {
        //console.log(draws);
        for (var i = 0; i < draws.length; i++) {
            var drawCall = draws[i];
            ctx.fillStyle = drawCall.color;
            ctx.beginPath();
            ctx.arc(drawCall.x, drawCall.y, BALL_RAD, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    // draw players
    for (var _i = 0; _i < rooms[roomNum].UserIds.length; _i++) {
        var _drawCall = users[rooms[roomNum].UserIds[_i]];
        //console.log(drawCall);
        if (!_drawCall.spect) {
            ctx.fillStyle = _drawCall.color;
            ctx.beginPath();
            ctx.arc(_drawCall.x, _drawCall.y, USER_RAD, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
        }
    }
};

var displayUsers = function displayUsers() {
    var userList = document.querySelector("#userList");
    // clear box
    userList.innerHTML = "";

    for (var i = 0; i < rooms[roomNum].UserIds.length; i++) {
        var user = document.createElement("LI");
        user.style.color = users[rooms[roomNum].UserIds[i]].color;
        if (id === rooms[roomNum].UserIds[i]) {
            user.style.listStyleType = "disc";
        }
        user.innerHTML += users[rooms[roomNum].UserIds[i]].name + " - " + Math.round(users[rooms[roomNum].UserIds[i]].points) + " points";
        if (rooms[roomNum].host === rooms[roomNum].UserIds[i]) {
            user.innerHTML += " (host)";
        }
        if (users[rooms[roomNum].UserIds[i]].spect) {
            user.innerHTML += " (spectator)";
        }
        userList.appendChild(user);
    }
};

var displayMessages = function displayMessages() {
    var chatBox = document.querySelector("#chatBox");
    chatBox.innerHTML = "";
    for (var i = 0; i < messages.length; i++) {
        var message = document.createElement("LI");
        message.style.color = messages[i].color;
        message.innerHTML += messages[i].message;
        chatBox.appendChild(message);
    }
};
'use strict';

var initHost = function initHost() {};

var startRound = function startRound() {
    if (rooms[roomNum].host === id) {
        setInterval(calculateBalls, 20);
        setInterval(newBall, 4000);
    }
};

var newBall = function newBall() {
    var ball = {
        x: Math.floor(Math.random() * WIDTH - 20) + 20,
        y: Math.floor(Math.random() * 20) + 20,
        xVel: 0,
        yVel: 0,
        color: 'black',
        user: -1,
        lastCollision: 0
    };
    rooms[roomNum].Balls.push(ball);
    // server will update next time balls update
    //socket.emit('newBall', ball);
};
'use strict';

var canvas = void 0;
var ctx = void 0;
var socket = void 0;
var id = void 0;
var roomNum = void 0;
var draws = [];
var users = {};
var rooms = [];
var messages = [];

// game constants
var HEIGHT = 500;
var WIDTH = 300;
var GRAVITY = .1;
var BOT_MARGIN = 20;
var BALL_RAD = 10;
var USER_RAD = 10;

var init = function init() {
    canvas = document.querySelector("#canvas");
    ctx = canvas.getContext('2d');

    socket = io.connect();

    socket.on('connect', function () {
        console.log('connecting');
        socket.emit('join', {});
    });

    socket.on('disconnect', function () {
        socket.emit('leave', {
            uid: id
        });
    });

    socket.on('syncClient', function (data) {
        id = data.id;
        draws = data.Balls;
        users = data.Users;
        rooms = data.rooms;
        roomNum = data.roomNum;
        console.log(data.rooms);
        console.log(rooms);
        setInterval(draw, 20);
        syncName();
        console.log('synced');
        if (users[id].spect) {
            document.querySelector("#readyButton").disabled = true;
        } else {

            document.querySelector("#readyButton").disabled = false;
        }
    });

    // in update.js
    socket.on('updateRoom', updateRoom);
    socket.on('updateUsers', updateUsers);
    socket.on('moveUser', updateUserPosition);
    socket.on('removeUser', removeUser);
    socket.on('updateBalls', updateBalls);
    socket.on('reset', syncAll);
    socket.on('end', endGame);
    socket.on('newMessage', newMessage);
    socket.on('denied', denied);
    socket.on('start', startRound);

    // in host.js


    var body = document.querySelector("body");
    body.addEventListener('mousemove', function (e) {

        var newX = e.clientX - canvas.offsetLeft;

        if (newX < 0) {
            newX = 0;
        } else if (newX > WIDTH) {
            newX = WIDTH;
        }
        socket.emit('userMove', newX);
    });

    var userForm = document.querySelector("#userSettings");
    var nameField = document.querySelector("#nameField");
    userForm.addEventListener('submit', function (e) {
        socket.emit('changeName', {
            name: nameField.value
        });
        e.preventDefault();
    });

    var messageForm = document.querySelector("#messageForm");
    var messageField = document.querySelector("#messageField");
    messageForm.addEventListener('submit', function (e) {
        socket.emit('sendMessage', {
            message: messageField.value
        });
        messageField.value = "";
        e.preventDefault();
    });

    var readyButton = document.querySelector("#readyButton");
    readyButton.addEventListener('click', function (e) {
        document.querySelector("#readyButton").disabled = true;
        socket.emit('ready');
    });
};

window.onload = init;
"use strict";

var collision = function collision(x1, y1, rad1, x2, y2, rad2) {
    /*
    console.log(x1);
    console.log(y1);
    console.log(rad1);
    console.log(x2);
    console.log(y2);
    console.log(rad2);
    */
    return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2) <= (rad1 + rad2) * (rad1 + rad2);
};

var calculateBalls = function calculateBalls() {
    var scored = [];
    for (var i = 0; i < rooms[roomNum].Balls.length; i++) {
        var ball = rooms[roomNum].Balls[i];
        ball.x += ball.xVel;
        ball.y += ball.yVel;

        ball.yVel += GRAVITY;
        var xNext = ball.x + ball.xVel;
        var yNext = ball.y + ball.yVel;
        if (xNext > WIDTH - BALL_RAD || xNext < BALL_RAD) {
            ball.xVel = -ball.xVel;
        }
        if (ball.lastCollision > 0) {
            ball.lastCollision--;
        }
        if (yNext > HEIGHT - BALL_RAD - USER_RAD - BOT_MARGIN && yNext < HEIGHT + BALL_RAD - BOT_MARGIN && ball.lastCollision === 0) {
            console.log("check collision");
            for (var j = 0; j < rooms[roomNum].UserIds.length; j++) {
                //console.log(j);
                var testUser = users[rooms[roomNum].UserIds[j]];

                // if collision detected
                if (!ball.spect && ball.user != testUser.id && collision(testUser.x, testUser.y, USER_RAD, xNext, yNext, BALL_RAD)) {

                    var xDiff = testUser.x - ball.x;
                    var yDiff = testUser.y - ball.y;
                    var dist = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
                    var vel = Math.sqrt(ball.yVel * ball.yVel + ball.xVel * ball.xVel);
                    ball.xVel = -vel * xDiff / dist;
                    ball.yVel = -vel * yDiff / dist;
                    ball.user = testUser.id;
                    ball.color = testUser.color;
                    ball.lastCollision = 10; // delay further collisions
                    console.log("collided");
                }
            }
        } else if (yNext > HEIGHT + BALL_RAD) {
            scored.push(i);
            console.log("score");
        }
        rooms[roomNum].Balls[i] = ball;
    }

    while (scored.length > 0) {
        var ballNum = scored.pop();
        if (users[rooms[roomNum].Balls[ballNum].user]) {
            users[rooms[roomNum].Balls[ballNum].user].points += 1;
            socket.emit('hostUpdateUser', users[rooms[roomNum].Balls[ballNum].user]);
        }
        rooms[roomNum].Balls.splice(ballNum, 1);
        console.log("ball " + ballNum + " removed");
    }
    socket.emit('hostUpdateBalls', rooms[roomNum].Balls);
};
"use strict";

var updateRoom = function updateRoom(data) {
    rooms[roomNum] = data.room;
    //console.log(data.room);
    // check if client is now the host
    draws = data.room.Balls;
    displayUsers();
};

var updateUsers = function updateUsers(data) {
    users[data.user.id] = data.user;
    console.log(data.user);

    displayUsers();
};

var updateUserPosition = function updateUserPosition(data) {
    users[data.id].x = data.newX;
};

var removeUser = function removeUser(data) {
    delete users[data.id];
    rooms[roomNum].UserIds.splice(rooms[roomNum].UserIds.indexOf(data.id), 1);
    displayUsers();
};

var updateBalls = function updateBalls(data) {
    draws = data;
    //draw();
};

var syncAll = function syncAll(data) {
    draws = data.Balls;
    users = data.Users;
    //draw();
    displayUsers();
};

var syncName = function syncName() {
    document.querySelector("#nameField").value = users[id].name;
};

var endGame = function endGame(data) {
    document.querySelector("#readyButton").disabled = false;
    console.log(users[data.winner] + ' won');
    if (messages.push({
        message: users[data.winner].name + " won",
        color: "black"
    }) > 20) {
        messages.shift();
    }
    displayMessages();
};

var newMessage = function newMessage(data) {
    if (messages.push(data) > 20) {
        messages.shift();
    }
    displayMessages();
};

var denied = function denied(data) {
    console.log(data.message);
    if (messages.push({
        message: data.message,
        color: "black"
    }) > 20) {
        messages.shift();
    }
    displayMessages();

    switch (data.code) {
        case "name":
            {
                syncName();
                break;
            }
        default:
            {

                break;
            }
    }
};
