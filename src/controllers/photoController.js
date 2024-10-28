const { savePhoto, saveFile } = require('../services/photoService');

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

module.exports = { uploadPhotoController };