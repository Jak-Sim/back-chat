const redisClient = require('../redis/redisClient');
const db = require('../config/dbConfig');
const { publish } = require('../redis/redisPubSub');

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

//TODO: Implement the saveMessage function > save the message to Redis and MySQL (로직 생각하기)
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
    const roomList = [];
    const connection = await db.getConnection();
    try {
        const [rooms] = await connection.query(
            `SELECT r.room_id, r.room_name, r.room_type
             FROM chat_rooms r
             JOIN chat_participants p ON r.room_id = p.room_id
             WHERE p.user_id = ?`, [userId]
        );

        for (const room of rooms) {
            const roomInfo = await redisClient.hgetall(`room:${room.room_id}`);
            const hasNewMessages = !!(roomInfo && roomInfo.newMessages);

            roomList.push({
                roomId: room.room_id,
                roomName: room.room_name,
                roomType: room.room_type,
                lastMessage: roomInfo ? roomInfo.lastMessage : null,
                lastTimestamp: roomInfo ? roomInfo.lastTimestamp : null,
                hasNewMessages,
            });
        }
    } finally {
        connection.release();
    }

    return roomList;
};

const getChatMessages = async (roomId) => {
    try {
        const messages = await redisClient.lrange(`room:${roomId}:messages`, 0, -1);
        const parsedMessages = messages.map(msg => JSON.parse(msg));

        return parsedMessages;
    } catch (error) {
        console.error(`Error fetching messages for room ${roomId}:`, error);
        throw new Error('Failed to fetch messages');
    }
};

const createChallengeRoom = async (challengeId, roomName, type, owner) => {
    const connection = await db.getConnection();
    
    try {
        const [result] = await connection.query(
            'INSERT INTO chat_rooms (room_type, room_name, create_user_id, challenge_id) VALUES (?, ?, ?, ?)',
            [type, roomName, owner, challengeId]
        );
        const roomId = result.insertId;

        await connection.query('INSERT INTO chat_participants (room_id, user_id) VALUES (?, ?)', [roomId, owner]);
        await redisClient.lpush(`user:${owner}:rooms`, roomId.toString());

        return { message: 'Challenge chat room created successfully', roomId };
    } catch (error) {
        console.error('Error creating challenge chat room:', error);
        throw new Error('Failed to create challenge chat room');
    } finally {
        connection.release();
    }
};

module.exports = { 
    createRoom,
    saveMessage, 
    getChatList,
    getChatMessages,
    createChallengeRoom,
};