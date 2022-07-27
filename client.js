const WebSocket = require('ws');
const fs = require('fs');

const username = "ID_0001";
const BasicAuthPassword = "pa$$word";
const URL = "ws://127.0.0.1:8080/ocpp";
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

////////////////////////////////////////////////////////

// var WebSocket = require('ws-reconnect');

// var wsclient = new WebSocket(URL + "" + username,{
//     retryCount: null, // default is 2
//     reconnectInterval: 5, // default is 5
//     perMessageDeflate: false,
//     headers: {
//         Authorization: 'Basic ' + Buffer.from(username + ':' + BasicAuthPassword).toString('base64'),
//     },
// });

// wsclient.start();

// wsclient.on("message",function(data){
//     console.log(data);
// });

// wsclient.on("reconnect",function(){
//     console.log("reconnecting");
// });

// wsclient.on("connect",function(){
//     console.log("connected");
// });

// wsclient.on("destroyed",function(){
//     console.log("destroyed");
// });