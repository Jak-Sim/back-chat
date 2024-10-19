const redisClient = require('../redis/redisClient');
const db = require('../config/dbConfig');

const createRoom = async (roomName, type, participants, createUserId) => {
    const connection = await db.getConnection();
    try {
        const [result] = await connection.query(
            'INSERT INTO chat_rooms (room_name, room_type, create_user_id) VALUES (?, ?, ?)',
            [roomName, type, createUserId]
        );

        const roomId = result.insertId;

        for (const userId of participants) {
            await connection.query(
                'INSERT INTO chat_participants (room_id, user_id) VALUES (?, ?)',
                [roomId, userId]
            );
        }

        return { message: 'Room created successfully', roomId };
    } finally {
        connection.release();
    }
};

const saveMessage = async (roomId, userId, message) => {
    const timestamp = Date.now();
    const messageData = JSON.stringify({ userId, message, timestamp });

    await redisClient.lpush(`room:${roomId}:messages`, messageData);
    await redisClient.ltrim(`room:${roomId}:messages`, 0, 99);

    const messageCount = await redisClient.lrange(`room:${roomId}:messages`, 100, -1);
    if (messageCount.length > 0) {
        const connection = await db.getConnection();
        try {
            for (const oldMessage of messageCount) {
                const parsedMessage = JSON.parse(oldMessage);
                await connection.query(
                    'INSERT INTO chat_messages (room_id, user_id, message, timestamp) VALUES (?, ?, ?, ?)',
                    [roomId, parsedMessage.userId, parsedMessage.message, parsedMessage.timestamp]
                );
            }
            await redisClient.ltrim(`room:${roomId}:messages`, 0, 99);
        } finally {
            connection.release();
        }
    }

    await redisClient.hset(`room:${roomId}`, 'lastMessage', message, 'lastTimestamp', timestamp);
};

const getChatList = async (userId) => {
    const roomList = []; // 유저가 참여한 방 목록

    const rooms = await redisClient.lrange(`user:${userId}:rooms`, 0, -1);

    for (const roomId of rooms) {
        const roomInfo = await redisClient.hgetall(`room:${roomId}`);
        const hasNewMessages = !!(roomInfo && roomInfo.newMessages);

        roomList.push({
            roomId,
            lastMessage: roomInfo.lastMessage,
            lastTimestamp: roomInfo.lastTimestamp,
            hasNewMessages,
        });
    }

    return roomList;
};

module.exports = { 
    createRoom,
    saveMessage, 
    getChatList,
};