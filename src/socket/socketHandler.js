const { publish, subscribe } = require('../redis/redisPubSub');
const redisClient = require('../redis/redisClient');
const { saveMessageToDB } = require('../services/chatService');
const path = require('path');
const fs = require('fs');

const MAX_REDIS_MESSAGES = 100;

// yyyy-mm-dd hh:mm:ss
const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;  
};

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
                    
                    if (parsedMessage.type === 'image') {
                        io.to(roomId).emit('chat image', parsedMessage);
                    } else {
                        io.to(roomId).emit('chat message', parsedMessage);
                    }
                    
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
            
            const timestamp = Date.now();
            const formattedDate = formatDateTime(timestamp);
            const messageData = { 
                roomId, // int
                userId, // string
                message, // string
                timestamp: formattedDate, // string
                type: 'text' // string, 'text' or 'image'
            };

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

        socket.on('chat image', async (data) => {
            const { roomId, userId, imageUrl } = data;
            
            const timestamp = Date.now();
            const formattedDate = formatDateTime(timestamp);
            const messageData = {
                roomId,
                userId,
                imageUrl,
                timestamp: formattedDate,
                type: 'image'
            };

            try {
                console.log(`Saving image message to Redis: roomId=${roomId}, message=${JSON.stringify(messageData)}`);

                await redisClient.lpush(`room:${roomId}:messages`, JSON.stringify(messageData));
                await redisClient.ltrim(`room:${roomId}:messages`, 0, MAX_REDIS_MESSAGES - 1);

                await publish(`room:${roomId}`, JSON.stringify(messageData));

                console.log(`Image message published to room ${roomId}:`, messageData);

            } catch (error) {
                console.error('Error saving or publishing image message:', error);
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