const initHost = () => {
    
}

const startRound = () => {
    if (rooms[roomNum].host === id) {
        setInterval(calculateBalls, 20);
        setInterval(newBall, 4000);
    }
}

const newBall = () => {
    let ball = {
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
