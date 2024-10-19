const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const socketHandler = require('./socket/socketHandler');
const { subClient } = require('../redis/redisPubSub');

const chatRoutes = require('./routes/chat');
const redisClient = require('./redis/redisClient');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 5000;

app.use(express.json());
socketHandler(io);


subClient.subscribe('room:*');
subClient.on('message', (channel, message) => {
    const roomId = channel.split(':')[1];
    io.to(roomId).emit('newMessage', JSON.parse(message));
});

// 정적 파일 제공 (이미지 접근을 위해)
app.use('/uploads', express.static('uploads'));
server.listen(PORT, () => console.log(`Chat Service running on port ${PORT}`));


