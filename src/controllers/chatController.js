const redisClient = require('../redis/redisClient');
const { getChatMessages, getChatList, createRoom, createChallengeRoom } = require('../services/chatService');

const createChatRoomController = async (req, res) => {
    const { roomName, type, participants } = req.body;
    const createUserId = req.headers['user-id'];

    if (!createUserId) {
        console.log('User ID is missing in the request headers.');
        return res.status(400).json({ message: 'User ID is required in the header' });
    }

    try {
        const result = await createRoom(roomName, type, participants, createUserId);
        res.status(201).json(result);
    } catch (error) {
        console.error('Failed to create room:', error);
        res.status(500).json({ message: 'Failed to create room' });
    }
};

const deleteRoomController = async (req, res) => {
    const { roomId } = req.params;
    try {
        await redisClient.del(`room:${roomId}`);
        res.status(200).json({ message: 'Room deleted successfully' });
    } catch (error) {
        console.error('Failed to delete room:', error);
        res.status(500).json({ message: 'Failed to delete room' });
    }
};

const getGroupRoomListController = async (req, res) => {
    const userId = req.headers['user-id'];
    const roomType = 'group';
    try {
        const chatList = await getChatList(userId, roomType);
        res.status(200).json(chatList);
    } catch (error) {
        console.error('Failed to get chat list:', error);
        res.status(500).json({ message: 'Failed to get chat list' });
    }
};

const getChallengeRoomListController = async (req, res) => {
    const userId = req.headers['user-id'];
    const roomType = 'challenge';
    try {
        const chatList = await getChatList(userId, roomType);
        res.status(200).json(chatList);
    } catch (error) {
        console.error('Failed to get chat list:', error);
        res.status(500).json({ message: 'Failed to get chat list' });
    }
};

const getChatMessagesController = async (req, res) => {
    const { roomId } = req.params;
    try {
        const messages = await getChatMessages(roomId);
        res.status(200).json(messages);
    } catch (error) {
        console.error(`Error in getChatMessagesController:`, error);
        res.status(500).json({ message: 'Failed to fetch chat messages' });
    }
};

const createChallengeRoomController = async (req, res) => {
    const { challengeId } = req.params;
    const { roomName, type, owner } = req.body;

    if (!roomName || !type || !owner || !challengeId) {
        return res.status(400).json({ message: 'Invalid request: missing required fields.' });
    }

    try {
        const result = await createChallengeRoom(challengeId, roomName, type, owner);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating challenge chat room:', error);
        res.status(500).json({ message: 'Failed to create challenge chat room' });
    }
};


module.exports = { 
    createChatRoomController, 
    deleteRoomController, 
    getGroupRoomListController,
    getChallengeRoomListController,
    getChatMessagesController,
    createChallengeRoomController,
};