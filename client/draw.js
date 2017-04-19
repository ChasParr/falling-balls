const draw = () => {
    ctx.fillStyle = "rgb(250,250,250)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    //console.log("clear");

    // draw falling balls
    if (draws.length > 0){
        //console.log(draws);
        for (let i = 0; i < draws.length; i++) {
            const drawCall = draws[i];
            ctx.fillStyle = drawCall.color;
            ctx.beginPath();
            ctx.arc(drawCall.x, drawCall.y, BALL_RAD, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    // draw players
    for (let i = 0; i < rooms[roomNum].UserIds.length; i++) {
        const drawCall = users[rooms[roomNum].UserIds[i]];
        //console.log(drawCall);
        if (!drawCall.spect) {
            ctx.fillStyle = drawCall.color;
            ctx.beginPath();
            ctx.arc(drawCall.x, drawCall.y, USER_RAD, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
        }
    }

};

const displayUsers = () => {
    const userList = document.querySelector("#userList");
    // clear box
    userList.innerHTML = "";

    for (let i = 0; i < rooms[roomNum].UserIds.length; i++) {
        let user = document.createElement("LI");
        user.style.color = users[rooms[roomNum].UserIds[i]].color;
        if (id === rooms[roomNum].UserIds[i]) {
            user.style.listStyleType = "disc";
        }
        user.innerHTML += (users[rooms[roomNum].UserIds[i]].name + " - " + Math.round(users[rooms[roomNum].UserIds[i]].points) + " points");
        if (rooms[roomNum].host === rooms[roomNum].UserIds[i]) {
            user.innerHTML += (" (host)");
        }
        if (users[rooms[roomNum].UserIds[i]].spect) {
            user.innerHTML += (" (spectator)");
        }
        userList.appendChild(user);
    }
};

const displayMessages = () => {
    const chatBox = document.querySelector("#chatBox");
    chatBox.innerHTML = "";
    for (let i = 0; i < messages.length; i++) {
        let message = document.createElement("LI");
        message.style.color = messages[i].color;
        message.innerHTML += messages[i].message;
        chatBox.appendChild(message);
    }
};
