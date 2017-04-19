let canvas;
let ctx;
let socket;
let id;
let roomNum;
let draws = [];
let users = {};
let rooms = [];
let messages = [];

// game constants
const HEIGHT = 500;
const WIDTH = 300;
const GRAVITY = .1;
const BOT_MARGIN = 20;
const BALL_RAD = 10;
const USER_RAD = 10;


const init = () => {
    canvas = document.querySelector("#canvas");
    ctx = canvas.getContext('2d');

    socket = io.connect();

    socket.on('connect', () => {
        console.log('connecting');
        socket.emit('join', {});
    });

    socket.on('disconnect', () => {
        socket.emit('leave', {
            uid: id
        });
    });

    socket.on('syncClient', (data) => {
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
        if (users[id].spect){
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


    const body = document.querySelector("body");
    body.addEventListener('mousemove', (e) => {
        
        let newX = e.clientX - canvas.offsetLeft;
        
        if (newX < 0) {
            newX = 0;
        } else if (newX > WIDTH) {
            newX = WIDTH;
        }
        socket.emit('userMove', newX);
    });

    const userForm = document.querySelector("#userSettings");
    const nameField = document.querySelector("#nameField");
    userForm.addEventListener('submit', (e) => {
        socket.emit('changeName', {
            name: nameField.value
        });
        e.preventDefault();
    });

    const messageForm = document.querySelector("#messageForm");
    const messageField = document.querySelector("#messageField");
    messageForm.addEventListener('submit', (e) => {
        socket.emit('sendMessage', {
            message: messageField.value
        });
        messageField.value = "";
        e.preventDefault();
    });


    const readyButton = document.querySelector("#readyButton");
    readyButton.addEventListener('click', (e) => {
        document.querySelector("#readyButton").disabled = true;
        socket.emit('ready');
    });


};

window.onload = init;
