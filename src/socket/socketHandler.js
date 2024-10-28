const { addToStream, readFromStream, createConsumerGroup, readRangeFromStream } = require('../redis/redisStream');
const MAX_STREAM_MESSAGES = 100;

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

    const subscribeToRoom = async (roomId) => {
        const streamKey = `room:${roomId}:stream`;
        const groupName = `group:${roomId}`;

        if (!subscribedRooms.has(roomId)) {
            subscribedRooms.add(roomId);
            
            try {
                await createConsumerGroup(streamKey, groupName);
                const consumer = `consumer-${Date.now()}`;
                
                setInterval(async () => {
                    try {
                        const messages = await readFromStream(streamKey, groupName, consumer);
                        if (messages && messages.length > 0) {
                            messages.forEach(message => {
                                console.log(`New message received from stream for room ${roomId}`);
                            });
                        }
                    } catch (error) {
                        console.error(`Error reading messages from stream for room ${roomId}:`, error);
                    }
                }, 1000);
            } catch (error) {
                console.error(`Error subscribing to room ${roomId}:`, error);
                subscribedRooms.delete(roomId);
            }
        }
    };

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        socket.on('joinRoom', async (roomId) => {
            socket.join(roomId);
            console.log(`User ${socket.id} joined room: ${roomId}`);
            await subscribeToRoom(roomId);

            try {
                const messages = await readRangeFromStream(`room:${roomId}:stream`);
                if (messages && messages.length > 0) {
                    messages.forEach(message => {
                        socket.emit('chat message', message);
                    });
                }
            } catch (error) {
                console.error(`Error fetching past messages for room ${roomId}:`, error);
            }
        });

        socket.on('chat message', async (messageData) => {
            const { roomId, userId, message } = messageData;
            const timestamp = Date.now();
            
            const streamData = {
                roomId: parseInt(roomId),
                userId,
                message,
                timestamp: formatDateTime(timestamp),
                type: 'text'
            };

            try {
                const result = await addToStream(`room:${roomId}:stream`, streamData);
                socket.to(roomId).emit('chat message', result);
                console.log(`Message saved to stream for room ${roomId}:`, result);
            } catch (error) {
                console.error('Error handling chat message:', error);
            }
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
        });

        socket.on('chat image', async (data) => {
            const { roomId, userId, imageUrl } = data;
            const timestamp = Date.now();
            
            const streamData = {
                roomId: parseInt(roomId),
                userId,
                imageUrl,
                timestamp: formatDateTime(timestamp),
                type: 'image'
            };

            try {
                const result = await addToStream(`room:${roomId}:stream`, streamData);
                socket.to(roomId).emit('chat image', result);
                console.log(`Image message saved to stream for room ${roomId}:`, result);
            } catch (error) {
                console.error('Error handling image message:', error);
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