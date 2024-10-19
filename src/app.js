const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { ipFilterMiddleware, ipFilterErrorHandler } = require('./middlewares/ipFilter');
const chatRoutes = require('./routes/chat');
const redisClient = require('./redis/redisClient');
const socketHandler = require('./socket/socketHandler');

const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(ipFilterMiddleware);
app.use(ipFilterErrorHandler);

app.use('/uploads', express.static('uploads'));
app.use('/chat', chatRoutes);

const server = http.createServer(app);
const io = new Server(server);

socketHandler(io);

const subClient = redisClient.duplicate();
subClient.subscribe('room:*');
subClient.on('message', (channel, message) => {
    const roomId = channel.split(':')[1];
    io.to(roomId).emit('newMessage', JSON.parse(message));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));