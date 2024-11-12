const multer = require('multer');
const { saveChallengeImage, saveNormalImage, updateImageStatus } = require('../services/imageService');

const uploadNormalImageController = async (req, res) => {
    const { roomId } = req.body;
    const userId = req.headers['user-id'];
    const file = req.file;

    if (!file || !roomId || !userId) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const imageUrl = saveFile(file);
        const result = await saveNormalImage(roomId, userId, imageUrl);
        
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error uploading normal photo:', error);
        return res.status(500).json({ message: 'Failed to upload photo' });
    }
};

const uploadChallengeImageController = async (req, res) => {
    const { roomId, challengeId } = req.body;
    const userId = req.headers['user-id'];
    const file = req.file;

    if (!file || !roomId || !userId || !challengeId) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const imageUrl = saveFile(file);
        const result = await saveChallengeImage(roomId, userId, challengeId, imageUrl);
        
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error uploading challenge photo:', error);
        return res.status(500).json({ message: 'Failed to upload challenge photo' });
    }
};

const updateChallengeImageStatus = async (req, res) => {
    const { imageId, status } = req.body;
    const userId = req.headers['user-id'];

    if (!imageId || !status || !['accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid request' });
    }

    try {
        const result = await updateImageStatus(imageId, status, userId);
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error updating challenge photo status:', error);
        return res.status(500).json({ message: 'Failed to update photo status' });
    }
};

module.exports = { 
    uploadNormalImageController,
    uploadChallengeImageController,
    updateChallengeImageStatus
 };