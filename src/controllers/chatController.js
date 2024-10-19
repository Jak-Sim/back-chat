const redisClient = require('../redis/redisClient');
const { saveMessage, getChatList } = require('../services/chatService');


// 채팅방 생성 (단체 채팅방, 1:1 채팅방)
const createRoom = async (req, res) => {
    const { roomId, type, participants } = req.body;  // type: 'group' or 'one-on-one'
    try {
        await redisClient.hset(`room:${roomId}`, 'type', type, 'participants', JSON.stringify(participants));
        res.status(200).json({ message: 'Room created successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create room' });
    }
};

// 채팅방 삭제
const deleteRoom = async (req, res) => {
    const { roomId } = req.params;
    try {
        await redisClient.del(`room:${roomId}`);
        res.status(200).json({ message: 'Room deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete room' });
    }
};

// 채팅방 목록 반환
const getChatListController = async (req, res) => {
    const { userId } = req.params;
    try {
        const chatList = await getChatList(userId);
        res.status(200).json(chatList);
    } catch (error) {
        console.error('Failed to get chat list:', error);
        res.status(500).json({ message: 'Failed to get chat list' });
    }
};

// 메시지 전송 (Socket.IO로 메시지 처리)
const sendMessage = async (roomId, userId, message) => {
    const timestamp = Date.now();
    const messageData = JSON.stringify({ userId, message, timestamp });

    // Redis에 메시지 저장
    await redisClient.lpush(`room:${roomId}:messages`, messageData);
};

// 채팅 메시지 처리
const sendMessageController = async (req, res) => {
    const { roomId, userId, message } = req.body;
    try {
        await saveMessage(roomId, userId, message);
        res.status(200).json({ message: 'Message sent' });
    } catch (error) {
        console.error('Failed to send message:', error);
        res.status(500).json({ message: 'Failed to send message' });
    }
};

module.exports = { getChatListController, sendMessageController };
module.exports = { createRoom, deleteRoom, sendMessage };



