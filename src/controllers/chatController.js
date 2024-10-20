const redisClient = require('../redis/redisClient');
const { getChatMessages, getChatList, createRoom, createChallengeRoom, savePhoto, saveFile } = require('../services/chatService');

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

const getChatRoomListController = async (req, res) => {
    const { userId } = req.params;
    try {
        const chatList = await getChatList(userId);
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

const uploadPhotoController = async (req, res) => {
    const { roomId, userId, type } = req.body;  // type: 'normal' or 'challenge'
    const file = req.file;

    if (!file || !roomId || !userId || !type) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const imageUrl = saveFile(file);
        const result = await savePhoto(roomId, userId, type, imageUrl);        
        
        return res.status(200).json(result);

    } catch (error) {
        console.error('Error uploading photo:', error);
        return res.status(500).json({ message: 'Failed to upload photo' });
    }
};

module.exports = { 
    createChatRoomController, 
    deleteRoomController, 
    getChatRoomListController,
    getChatMessagesController,
    createChallengeRoomController,
};