const { publish, subscribe } = require('../redis/redisPubSub');
const redisClient = require('../redis/redisClient');
const { saveMessageToDB } = require('../services/chatService');

const MAX_REDIS_MESSAGES = 100;

const socketHandler = (io) => {
    const subscribedRooms = new Set();

    const subscribeToRoom = (roomId) => {
        if (!subscribedRooms.has(roomId)) {
            subscribedRooms.add(roomId);
            const channel = `room:${roomId}`;
            
            subscribe(channel, (err, message) => {
                if (err) {
                    console.error(`Error subscribing to room ${roomId}:`, err);
                    return;
                }
                try {
                    const parsedMessage = JSON.parse(message);
                    io.to(roomId).emit('chat message', parsedMessage);
                    console.log(`Message received and emitted to room ${roomId}:`, parsedMessage);
                } catch (error) {
                    console.error(`Error parsing message for room ${roomId}:`, error);
                }
            });
            
            console.log(`Subscribed to room: ${roomId}`);
        } else {
            console.log(`Already subscribed to room: ${roomId}`);
        }
    };

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        socket.on('joinRoom', (roomId) => {
            socket.join(roomId);
            console.log(`User ${socket.id} joined room: ${roomId}`);
            subscribeToRoom(roomId);
        });

        socket.on('chat message', async (msg) => {
            const { roomId, userId, message } = msg;
            const messageData = { roomId, userId, message, timestamp: Date.now() };

            try {
                console.log(`Saving message to Redis: roomId=${roomId}, message=${JSON.stringify(messageData)}`);

                await redisClient.lpush(`room:${roomId}:messages`, JSON.stringify(messageData));
                await redisClient.ltrim(`room:${roomId}:messages`, 0, MAX_REDIS_MESSAGES - 1);

                await publish(`room:${roomId}`, JSON.stringify(messageData));

                console.log(`Message published to room ${roomId}:`, messageData);

            } catch (error) {
                console.error('Error saving or publishing message:', error);
            }
        });

        socket.on('leaveRoom', (roomId) => {
            socket.leave(roomId);
            console.log(`User ${socket.id} left room: ${roomId}`);
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });
};

module.exports = socketHandler;