const { publish } = require('../../redis/redisPubSub');
const redisClient = require('../redis/redisClient');

const socketHandler = (io) => {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        socket.on('joinRoom', async (roomId) => {
            socket.join(roomId);
            const messages = await redisClient.lrange(`room:${roomId}:messages`, 0, -1);
            socket.emit('previousMessages', messages.map(JSON.parse));
        });

        socket.on('sendMessage', async ({ roomId, userId, message }) => {
            const timestamp = Date.now();
            const messageData = JSON.stringify({ userId, message, timestamp });

            await redisClient.lpush(`room:${roomId}:messages`, messageData);
            await redisClient.hset(`user:${userId}:chatlist`, roomId, messageData);

            io.to(roomId).emit('newMessage', messageData);

            // broadcasting chat message 
            publish(`room:${roomId}`, messageData);
        });
    });
};

module.exports = socketHandler;