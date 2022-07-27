const WebSocketServer = require('ws').Server;
const fs = require('fs');
const PORT = 8080;
var passwd = 'pa$$word' // should be get form db

var http = require('http');
var bodyparser = require('body-parser');
var express = require('express');
const { resolve } = require('path');
const { rejects } = require('assert');
var app = express();

app.use(bodyparser.json());

var server = new http.createServer({
}, app);

var wss = new WebSocketServer({
    server,
    // verifyClient: (info, cb) => {
    //     // console.log(info.req.client);
    //     var success = !!info.req.client.authorized;
    //     console.log(success);
    //     return success;
    // }

    verifyClient: function (info, cb) {
        var success = !!info.req.client.authorized;
        console.log(success);

        var authentication = Buffer.from(info.req.headers.authorization.replace(/Basic/, '').trim(),'base64').toString('utf-8');
        if (!authentication)
            cb(false, 401, 'Authorization Required');
        else {
            var loginInfo = authentication.trim().split(':');
            if (loginInfo[1] != passwd) {
                console.log("ERROR Username / Password NOT matched");
                cb(false, 401, 'Authorization Required');
            } else {
                console.log("Username / Password matched");
                info.req.identity = loginInfo[0];
                cb(true, 200, 'Authorized');
            }
        }
    }
});

// const wss = new WebSocketServer({
//     port: PORT,
//     verifyClient: function (info, cb) {
//         var authentication = Buffer.from(info.req.headers.authorization.replace(/Basic/, '').trim(),'base64').toString('utf-8');
//         if (!authentication)
//             cb(false, 401, 'Authorization Required');
//         else {
//             var loginInfo = authentication.trim().split(':');
//             if (loginInfo[1] != passwd) {
//                 console.log("ERROR Username / Password NOT matched");
//                 cb(false, 401, 'Authorization Required');
//             } else {
//                 console.log("Username / Password matched");
//                 info.req.identity = loginInfo[0];
//                 cb(true, 200, 'Authorized');
//             }
//         }
//     },
//     rejectUnauthorized: false
// });

wss.on('connection', function (ws, request) {
    ws.id = request.identity;
    console.log("Connected Charger ID: "  + ws.id);

    ws.on('message', function (msg) {
        // Broadcast message to all connected clients
        wss.clients.forEach(function (client) {
            if(client.id == request.identity){
                console.log("From client",ws.id,": ", msg.toString());
                client.send("Hello from server");
            };
        });
    });

    ws.on('close', function () {
        console.log('Client disconnected '+ ws.id);
    });

});

var check = function(clients, id){
    return new Promise(function(resolve, rejects){
        if(clients.size != 0){
            clients.forEach(function (client) {
                if(client.id == id){
                    client.send(id + " Disconnected");
                    client.close();
                    resolve(true);
                }
                else{
                    resolve(false);
                }
            });
        }
        else{
            resolve(false)
        }
    });
};

server.listen(PORT, ()=>{

    app.post('/test/', function(req, res) {
        check(wss.clients, req.body.name).then(function(ack) {
            if(ack){
                res.json({
                    success: "true",
                    result: req.body.name + " Client disconnected"
                });
            }
            else{
                res.json({
                    success: "fasle",
                    result: req.body.name + " Client can not disconnect"
                });
            }
        });
    });

    console.log( (new Date()) + " Server is listening on port " + PORT);
});