const { publish } = require('../redis/redisPubSub');
const redisClient = require('../redis/redisClient');
const path = require('path');
const db = require('../config/dbConfig');

const fs = require('fs');

const saveImageInfoToDB = async (userId, roomId, imageUrl, uploadType) => {
    const query = `
        INSERT INTO chat_images (user_id, room_id, image_url, upload_type) 
        VALUES (?, ?, ?, ?)
    `;
    const values = [userId, roomId, imageUrl, uploadType];

    try {
        const [result] = await db.execute(query, values);
        return result.insertId;
    } catch (error) {
        console.error('Error saving image info to database:', error);
        throw new Error('Failed to save image info to database');
    }
};

const savePhoto = async (roomId, userId, photoType, imageUrl) => {
    const messageData = {
        roomId,
        userId,
        type: photoType,
        imageUrl,
        timestamp: Date.now()
    };

    try {

        await redisClient.lpush(`room:${roomId}:messages`, JSON.stringify(messageData));
        await redisClient.ltrim(`room:${roomId}:messages`, 0, 99);
        await saveImageInfoToDB(userId, roomId, imageUrl, photoType);

        publish(`room:${roomId}`, JSON.stringify(messageData));

        return { message: 'Photo uploaded successfully', messageData };
    } catch (error) {
        console.error('Error saving photo:', error);
        throw new Error('Failed to save photo');
    }
};

const saveFile = (file) => {
    const imageUrl = `/uploads/${Date.now()}-${file.originalname}`;
    return imageUrl;
};

module.exports = { savePhoto, saveFile };