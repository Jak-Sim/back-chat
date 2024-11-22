const { addToStream } = require('../redis/redisStream');
const path = require('path');
const db = require('../db/dbConfig');
const AWS = require('aws-sdk');

// AWS S3 클라이언트 초기화
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

const uploadToS3 = async (file) => {
    const fileExtension = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;

    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `uploads/${fileName}`,
        Body: file.buffer,
        ContentType: file.mimetype,
    };

    try {
        const data = await s3.upload(params).promise();
        return data.Location;
    } catch (error) {
        console.error('Error uploading file to S3:', error);
        throw new Error('Failed to upload file to S3');
    }
};

const saveNormalImage = async (roomId, userId, imageUrl, io) => {
    const connection = await db.getConnection();
    const timestamp = Date.now();
    
    try {
        const [result] = await connection.query(
            `INSERT INTO chat_images 
            (user_id, room_id, image_url, upload_type, status, uploaded_at) 
            VALUES (?, ?, ?, 'normal', 0, NOW())`,
            [userId, roomId, imageUrl]
        );

        const imageId = result.insertId;

        // Redis Stream에 메시지 추가
        const messageData = {
            roomId: parseInt(roomId),
            userId,
            type: 'image',
            imageType: 'normal',
            imageUrl,
            imageId,
            timestamp
        };

        await addToStream(`room:${roomId}:stream`, messageData);

        return { imageId, imageUrl, messageData };
    } finally {
        connection.release();
    }
};

const saveChallengeImage = async (roomId, userId, imageUrl, io) => {
    const connection = await db.getConnection();
    const timestamp = Date.now();

    try {
        const [result] = await connection.query(
            `INSERT INTO chat_images 
            (user_id, room_id, image_url, upload_type, status, uploaded_at) 
            VALUES (?, ?, ?, 'challenge', 0, NOW())`,
            [userId, roomId, imageUrl]
        );

        const imageId = result.insertId;

        // Redis Stream에 메시지 추가
        const messageData = {
            roomId: parseInt(roomId),
            userId,
            type: 'image',
            imageType: 'challenge',
            imageUrl,
            imageId,
            timestamp
        };

        await addToStream(`room:${roomId}:stream`, messageData);

        return { imageId, imageUrl, messageData };
    } finally {
        connection.release();
    }
};

const updateImageStatus = async (photoId, status, reviewerId) => {
    const connection = await db.getConnection();
    
    try {
        const [result] = await connection.query(
            `UPDATE challenge_photos 
             SET status = ?, reviewer_id = ?, reviewed_at = NOW() 
             WHERE id = ?`,
            [status, reviewerId, photoId]
        );

        if (result.affectedRows === 0) {
            throw new Error('Photo not found or already reviewed');
        }

        // 상태 업데이트 후 방 참여자들에게 알림을 위한 정보 조회
        const [photoInfo] = await connection.query(
            'SELECT room_id, user_id, challenge_id FROM challenge_photos WHERE id = ?',
            [photoId]
        );

        // Redis Stream에 상태 업데이트 메시지 추가
        const messageData = {
            type: 'challenge_review',
            photoId,
            status,
            reviewerId,
            roomId: photoInfo[0].room_id,
            userId: photoInfo[0].user_id,
            challengeId: photoInfo[0].challenge_id,
            timestamp: Date.now()
        };

        await addToStream(`room:${photoInfo[0].room_id}:stream`, messageData);

        return { status, photoId, messageData };
    } finally {
        connection.release();
    }
};

module.exports = {
    saveNormalImage,
    saveChallengeImage,
    updateImageStatus,
    uploadToS3
};