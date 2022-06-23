const WebSocket = require('ws');
const fs = require('fs');

const username = "ID_0001";
const BasicAuthPassword = "pa$$word";
const URL = "ws://127.0.0.1:5000/ocpp";
var reconn = null;

function startWebsocket() {
    var ws = new WebSocket(URL + "" + username, {
        perMessageDeflate: false,
        headers: {
            Authorization: 'Basic ' + Buffer.from(username + ':' + BasicAuthPassword).toString('base64'),
        },
    });

    ws.on('open', function() {
        clearInterval(reconn);
        ws.send("Hello from client");
    });

    ws.on('message', function(msg) {
        console.log("From server: " + msg);
    });

    ws.on('error', function (err) {
        console.log(err.message);
    });

    ws.on('close', function() {
        ws = null;
        reconn = setTimeout(startWebsocket, 5000);
    });
}

startWebsocket();