const multer = require('multer');
const { saveChallengeImage, saveNormalImage, updateImageStatus, uploadToS3 } = require('../services/imageService');

const uploadNormalImageController = async (req, res) => {
    const { roomId } = req.body;
    const userId = req.headers['user-id'];
    const file = req.file;

    if (!file || !roomId || !userId) {
        console.error('Missing required fields:', { roomId, userId, file });
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const s3Url = await uploadToS3(req.file);
        req.file.s3Url = s3Url;
        const io = req.app.get('io');
        const result = await saveNormalImage(roomId, userId, s3Url, io);
        
        return res.status(200).json({
            success: true,
            imageUrl: s3Url,
            data: result
        });
    } catch (error) {
        console.error('Error uploading normal photo:', error);
        return res.status(500).json({ message: 'Failed to upload photo' });
    }   
};

const uploadChallengeImageController = async (req, res) => {
    const { roomId } = req.body;
    const userId = req.headers['user-id'];
    const file = req.file;

    if (!file || !roomId || !userId) {
        console.error('Missing required fields:', { roomId, userId, file });
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const s3Url = await uploadToS3(req.file);
        req.file.s3Url = s3Url;
        console.log('s3Url:', s3Url);
        const io = req.app.get('io');
        const result = await saveChallengeImage(roomId, userId, s3Url, io);

        return res.status(200).json({
            success: true,
            imageUrl: s3Url,
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