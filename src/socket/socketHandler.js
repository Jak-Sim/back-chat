const { addToStream, readFromStream, createConsumerGroup, readRangeFromStream } = require('../redis/redisStream');
const MAX_STREAM_MESSAGES = 100; // 최대 메시지 수

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
    // Map으로 변경하여 room별 상태 관리
    const subscribedRooms = new Map();

    const subscribeToRoom = async (roomId) => {
        const streamKey = `room:${roomId}:stream`;
        const groupName = `group:${roomId}`;

        if (!subscribedRooms.has(roomId)) {
            try {
                // Consumer Group 생성
                await createConsumerGroup(streamKey, groupName);
                const consumer = `consumer-${Date.now()}`;

                // 상태 저장
                subscribedRooms.set(roomId, {
                    consumer,
                    streamKey,
                    groupName,
                    lastRead: Date.now()
                });

                // 메시지 모니터링 인터벌 설정
                const interval = setInterval(async () => {
                    try {
                        const messages = await readFromStream(streamKey, groupName, consumer);
                        if (messages && messages.length > 0) {
                            messages.forEach(message => {
                                if (message && message.data) {
                                    const parsedMessage = typeof message.data === 'string' ? 
                                        JSON.parse(message.data) : message.data;
                                    io.to(roomId).emit('chat message', parsedMessage);
                                }
                            });
                        }
                    } catch (error) {
                        console.error(`Error reading messages for room ${roomId}:`, error);
                    }
                }, 100); // 100ms로 설정하여 반응 개선

                // 인터벌 저장
                subscribedRooms.get(roomId).interval = interval;
            } catch (error) {
                console.error(`Error subscribing to room ${roomId}:`, error);
                subscribedRooms.delete(roomId);
                throw error;
            }
        }
    };

    const unsubscribeFromRoom = (roomId) => {
        const subscription = subscribedRooms.get(roomId);
        if (subscription?.interval) {
            clearInterval(subscription.interval);
        }
        subscribedRooms.delete(roomId);
    };

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        socket.on('joinRoom', async (roomId) => {
            try {
                socket.join(roomId);
                console.log(`User ${socket.id} joined room: ${roomId}`);
                
                // 구독
                await subscribeToRoom(roomId);

                // 이전 메시지 로드
                const messages = await readRangeFromStream(`room:${roomId}:stream`);
                if (messages && messages.length > 0) {
                    messages.forEach(message => {
                        if (message && message.data) {
                            const parsedMessage = typeof message.data === 'string' ?
                                JSON.parse(message.data) : message.data;
                            socket.emit('chat message', parsedMessage);
                        }
                    });
                }
            } catch (error) {
                console.error(`Error handling room join for room ${roomId}:`, error);
                socket.emit('error', { message: 'Failed to join room' });
            }
        });

        socket.on('chat message', async (messageData) => {
            const { roomId, userId, message } = messageData;
            const streamKey = `room:${roomId}:stream`;
            
            const streamData = {
                roomId: parseInt(roomId),
                userId,
                message,
                timestamp: formatDateTime(Date.now()),
                type: 'text'
            };

            try {
                // Redis Stream에 메시지 추가
                const result = await addToStream(streamKey, streamData);
                
                io.to(roomId).emit('chat message', {
                    ...streamData,
                    id: result.id
                });
            } catch (error) {
                console.error('Error handling chat message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        socket.on('chat image', async (data) => {
            const { roomId, userId, imageUrl } = data;
            const streamKey = `room:${roomId}:stream`;
            
            const streamData = {
                roomId: parseInt(roomId),
                userId,
                imageUrl,
                timestamp: formatDateTime(Date.now()),
                type: 'image'
            };

            try {
                const result = await addToStream(streamKey, streamData);
                io.to(roomId).emit('chat image', {
                    ...streamData,
                    id: result.id
                });
            } catch (error) {
                console.error('Error handling image message:', error);
                socket.emit('error', { message: 'Failed to send image' });
            }
        });

        socket.on('leaveRoom', (roomId) => {
            socket.leave(roomId);
            // 방에 남은 참여자가 없으면 구독 해제
            const room = io.sockets.adapter.rooms.get(roomId);
            if (!room || room.size === 0) {
                unsubscribeFromRoom(roomId);
            }
            console.log(`User ${socket.id} left room: ${roomId}`);
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
            // 연결이 끊긴 참여자가 속한 방들의 구독 상태 확인
            socket.rooms.forEach(roomId => {
                if (roomId !== socket.id) {
                    const room = io.sockets.adapter.rooms.get(roomId);
                    if (!room || room.size === 0) {
                        unsubscribeFromRoom(roomId);
                    }
                }
            });
        });
    });
};

module.exports = socketHandler;