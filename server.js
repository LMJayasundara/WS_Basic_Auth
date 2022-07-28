const WebSocket = require('ws');
const fs = require('fs');
const PORT = 8080;
var path = require('path');
const crypto = require('crypto');

var http = require('http');
var bodyparser = require('body-parser');
var express = require('express');
var app = express();

app.use(bodyparser.json());
const DB_FILE_PATH = path.join('db', 'user.db');

var server = new http.createServer({
}, app);

const checkUser = function(id) {
    return new Promise(function(resolve, reject) {
        fs.readFile(DB_FILE_PATH, 'utf8', function(err, passFile) {
            if (err) {
                console.log(err);
                resolve(false);
            } else {
                const lines = passFile.split('\n');

                lines.forEach(function(line) {
                    if (line.split(':')[0] === id) {
                        resolve(line.split(':')[1]);
                    }
                });
            }
            resolve(false);
        });
    });
};

var wss = new WebSocket.Server({
    server,
    // rejectUnauthorized: false,
    verifyClient: function (info, cb) {
        var success = !!info.req.client.authorized;
        console.log(success);

        var authentication = Buffer.from(info.req.headers.authorization,'base64').toString('utf-8');
        var loginInfo = authentication.trim().split(':');
        if (!authentication)
            cb(false, 401, 'Authorization Required');
        else {
            checkUser(loginInfo[0]).then(function(hash) {

                if(hash == false){
                    console.log("ERROR Username NOT matched");
                    cb(false, 401, 'Authorization Required');
                }
                else if(hash == loginInfo[1]){
                    console.log("Username and Password matched");
                    info.req.identity = loginInfo[0];
                    info.req.hash = loginInfo[1];
                    cb(true, 200, 'Authorized');
                }
                else{
                    console.log("ERROR Password NOT matched");
                    cb(false, 401, 'Authorization Required');
                }
            });
        }
    }
});

wss.on('connection', function (ws, request) {
    ws.id = request.identity;
    ws.pass = request.hash;

    console.log("Connected Charger ID: "  + ws.id);

    ws.on('message', function (msg) {
        wss.clients.forEach(function (client) {
            if(client.id == request.identity){
                console.log("From client",ws.id,": ", msg.toString());
                client.send(JSON.stringify("Hello from server"));
            };
        });
    });

    ws.on('close', function () {
        console.log(ws.id + ' Client disconnected');
    });

});

var check = function(clients, id, newhash){
    return new Promise(function(resolve, rejects){
        if(clients.size != 0){
            clients.forEach(function (client) {
                if(client.id == id){
                    client.send(
                        JSON.stringify({
                            topic: "updatepass",
                            id: client.id,
                            newhash: newhash
                        })
                    );
                    resolve(true);
                }
                else{
                    resolve(false);
                }
            });
        }
        else{
            resolve(false);
        }
    });
};

server.listen(PORT, ()=>{
    app.post('/test/', function(req, res) {
        var newhash = crypto.createHash('sha256').update(req.body.username + ':' + req.body.newpasswd).digest('hex');

        check(wss.clients, req.body.username, newhash).then(function(ack) {
            if(ack){
                res.json({
                    success: "true",
                    result: req.body.username + " Client update password"
                });
            }
            else{
                res.json({
                    success: "fasle",
                    result: req.body.username + " Client can not update password"
                });
            }
        });
    });

    console.log( (new Date()) + " Server is listening on port " + PORT);
});