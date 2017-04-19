const collision = (x1, y1, rad1, x2, y2, rad2) => {
    /*
    console.log(x1);
    console.log(y1);
    console.log(rad1);
    console.log(x2);
    console.log(y2);
    console.log(rad2);
    */
    return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2) <= (rad1 + rad2) * (rad1 + rad2);
}

const calculateBalls = () => {
    let scored = [];
    for (let i = 0; i < rooms[roomNum].Balls.length; i++) {
        let ball = rooms[roomNum].Balls[i];
        ball.x += ball.xVel;
        ball.y += ball.yVel;

        ball.yVel += GRAVITY;
        let xNext = ball.x + ball.xVel;
        let yNext = ball.y + ball.yVel;
        if (xNext > WIDTH - BALL_RAD || xNext < BALL_RAD) {
            ball.xVel = -ball.xVel;
        }
        if (ball.lastCollision > 0){
            ball.lastCollision--;
        }
        if (yNext > HEIGHT - BALL_RAD - USER_RAD - BOT_MARGIN &&
            yNext < HEIGHT + BALL_RAD - BOT_MARGIN && ball.lastCollision === 0) {
            console.log("check collision");
            for (let j = 0; j < rooms[roomNum].UserIds.length; j++) {
                //console.log(j);
                const testUser = users[rooms[roomNum].UserIds[j]];
                
                // if collision detected
                if (!ball.spect && ball.user != testUser.id && collision(testUser.x, testUser.y, USER_RAD, xNext, yNext, BALL_RAD)) {
                    
                    const xDiff = (testUser.x - ball.x);
                    const yDiff = (testUser.y - ball.y);
                    const dist = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
                    const vel = Math.sqrt(ball.yVel * ball.yVel + ball.xVel * ball.xVel);
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
        let ballNum = scored.pop();
        if (users[rooms[roomNum].Balls[ballNum].user]){
            users[rooms[roomNum].Balls[ballNum].user].points += 1;
            socket.emit('hostUpdateUser', users[rooms[roomNum].Balls[ballNum].user])
        }
        rooms[roomNum].Balls.splice(ballNum, 1);
        console.log(`ball ${ballNum} removed`);
    }
    socket.emit('hostUpdateBalls', rooms[roomNum].Balls);
}
