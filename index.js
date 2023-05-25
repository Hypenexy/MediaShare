const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const fs = require('fs');

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/client/index.html');
});

app.get('/style', (req, res) => {
	res.sendFile(__dirname + '/client/style.css');
});

app.get('/videoplayer', (req, res) => {
	const range = req.headers.range;
	const videoPath = 'C:/Users/Hypenexy/Videos/2022-09-10 02-55-01.mp4';
	const videoSize = fs.statSync(videoPath).size;
	const chunkSize = 1 * 1e6;
	const start = Number(range.replace(/\D/g, ""));
	const end = Math.min(start + chunkSize, videoSize - 1);
	const contentLength = end - start + 1;
	const headers = {
		"Content-Range": `bytes ${start}-${end}/${videoSize}`,
		"Accept-Ranges": "bytes",
		"Content-Length": contentLength,
		"Content-Type": "video/mp4"
	};
	res.writeHead(206, headers);
	const stream = fs.createReadStream(videoPath, {
		start,
		end
	});
	stream.pipe(res);
});

const clients = []; // A better aproach would be to make this a JSON, that way dynamic data can be stored on server. 

io.on('connection', (socket) => {
    var ownership = false;
    if(socket.handshake.headers.host == "localhost:3000"){
        ownership = true;
        socket.emit("data", ["ownership", true]);
    }
    console.log('a user connected');
    const userInfo = {id: socket.id, ip: socket.handshake.address};
    clients.push(userInfo);
    socket.broadcast.emit("info", ["join", userInfo]);
    socket.emit("info", ["clients", clients]);
    
    socket.on('disconnect', () => {
        socket.broadcast.emit("info", ["leave", userInfo]);
        var index = clients.indexOf(userInfo);
        if(index > -1){
            clients.splice(index, 1);
        }
        console.log(userInfo);
        console.log(index)
        console.log('user disconnected');
    });

    socket.on("data", (value) => {
        if(ownership==true){
            socket.broadcast.emit("data", value);
        }
    });
    
    socket.on("info", (value) => {
        socket.broadcast.emit("info", [value, {id: socket.id}]);
    });
});

server.listen(3000, () => {
    console.log('Listening on *:3000');
});