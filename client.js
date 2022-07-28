const WebSocket = require('ws');
const fs = require('fs-extra');
const path = require('path');

const username = "ID001";
const URL = "ws://127.0.0.1:8080/";
const DB_FILE_PATH = path.join('user.db');

var reconn = null;

const gethash = function(id) {
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

const addUser = function(username, passhash) {
    return new Promise(function(resolve, reject) {
        fs.unlinkSync(DB_FILE_PATH);
        fs.ensureFileSync(DB_FILE_PATH);
        passfile = username + ':' + passhash +'\n';
        fs.writeFileSync(DB_FILE_PATH, passfile, 'utf8');
        resolve(true);
    });
};


function startWebsocket() {
    gethash(username).then(function(hash) {
        if(hash != false){
            var ws = new WebSocket(URL + "" + username, {
                perMessageDeflate: false,
                headers: {
                    Authorization: Buffer.from(username + ':' + hash).toString('base64'),
                },
            });
    
            ws.on('open', function() {
                clearInterval(reconn);
                ws.send("Hello from client");
            });
    
            ws.on('message', function(msg) {
                var data = JSON.parse(msg);

                if(data.topic == "updatepass"){
                    console.log(data.id, data.newhash);
                    addUser(data.id, data.newhash).then(function(ack) {
                        if(ack) ws.close();
                        else console.log("Password not updated"); 
                    });
                }
                else{
                    console.log(data);
                }
            });
    
            ws.on('error', function (err) {
                console.log(err.message);
            });
    
            ws.on('close', function() {
                ws = null;
                reconn = setTimeout(startWebsocket, 5000);
            });
        }
        else{
            console.log("Id not include in data base");
            setTimeout(() => {
                startWebsocket();
            }, 5000);
        }
    });
};

startWebsocket();