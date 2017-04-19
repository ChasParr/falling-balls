const updateRoom = (data) => {
    rooms[roomNum] = data.room;
    //console.log(data.room);
    // check if client is now the host
    draws = data.room.Balls;
    displayUsers();
}

const updateUsers = (data) => {
    users[data.user.id] = data.user;
    console.log(data.user);

    displayUsers();
}

const updateUserPosition = (data) => {
    users[data.id].x = data.newX;
}

const removeUser = (data) => {
    delete users[data.id];
    rooms[roomNum].UserIds.splice(rooms[roomNum].UserIds.indexOf(data.id), 1);
    displayUsers();
}

const updateBalls = (data) => {
    draws = data;
    //draw();
}

const syncAll = (data) => {
    draws = data.Balls;
    users = data.Users;
    //draw();
    displayUsers();
}

const syncName = () => {
    document.querySelector("#nameField").value = users[id].name;
}

const endGame = (data) => {
    document.querySelector("#readyButton").disabled = false;
    console.log(users[data.winner] + ' won');
    if (messages.push({
            message: `${users[data.winner].name} won`,
            color: "black"
        }) > 20) {
        messages.shift();
    }
    displayMessages();
}

const newMessage = (data) => {
    if (messages.push(data) > 20) {
        messages.shift();
    }
    displayMessages();
}

const denied = (data) => {
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
}
