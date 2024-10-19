const redisClient = require('../redis/redisClient');
const db = require('../config/dbConfig');

const saveMessage = async (roomId, userId, message) => {
    const timestamp = Date.now();
    const messageData = JSON.stringify({ userId, message, timestamp });

    // Redis에 메시지 저장
    await redisClient.lpush(`room:${roomId}:messages`, messageData);

    // 메시지 개수 제한 (100개)
    await redisClient.ltrim(`room:${roomId}:messages`, 0, 99);

    // Redis에 100개가 넘는 메시지가 있는지 확인
    const messageCount = await redisClient.lrange(`room:${roomId}:messages`, 100, -1);
    if (messageCount.length > 0) {
        // MySQL에 오래된 메시지 저장
        const connection = await db.getConnection();
        try {
            for (const oldMessage of messageCount) {
                const parsedMessage = JSON.parse(oldMessage);
                await connection.query(
                    'INSERT INTO chat_messages (room_id, user_id, message, timestamp) VALUES (?, ?, ?, ?)',
                    [roomId, parsedMessage.userId, parsedMessage.message, parsedMessage.timestamp]
                );
            }
            // Redis에서 저장된 메시지 삭제
            await redisClient.ltrim(`room:${roomId}:messages`, 0, 99);
        } finally {
            connection.release();
        }
    }

    // Redis에 최근 메시지 업데이트
    await redisClient.hset(`room:${roomId}`, 'lastMessage', message, 'lastTimestamp', timestamp);
};

const getChatList = async (userId) => {
    const roomList = []; // 유저가 참여한 방 목록

    // Redis에서 유저가 참여한 채팅방 목록을 불러오기
    const rooms = await redisClient.lrange(`user:${userId}:rooms`, 0, -1);

    for (const roomId of rooms) {
        const roomInfo = await redisClient.hgetall(`room:${roomId}`);

        // 새로운 메시지 여부 확인
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

module.exports = { saveMessage, getChatList };