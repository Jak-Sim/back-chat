const { addToStream } = require('../redis/redisStream');
const redisClient = require('../redis/redisClient');
const path = require('path');
const db = require('../db/dbConfig');
const fs = require('fs');

const saveNormalImage = async (roomId, userId, imageUrl) => {
    const connection = await db.getConnection();
    
    try {
        // DB에 이미지 정보 저장
        const [result] = await connection.query(
            'INSERT INTO chat_images (room_id, user_id, image_url, type) VALUES (?, ?, ?, ?)',
            [roomId, userId, imageUrl, 'normal']
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
            timestamp: Date.now()
        };

        await addToStream(`room:${roomId}:stream`, messageData);

        return { imageId, imageUrl, messageData };
    } finally {
        connection.release();
    }
};

const saveChallengeImage = async (roomId, userId, challengeId, imageUrl) => {
    const connection = await db.getConnection();
    
    try {
        // DB에 인증 사진 정보 저장
        const [result] = await connection.query(
            `INSERT INTO challenge_photos 
            (room_id, user_id, challenge_id, image_url, status) 
            VALUES (?, ?, ?, ?, 'pending')`,
            [roomId, userId, challengeId, imageUrl]
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
            challengeId,
            timestamp: Date.now()
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
    updateImageStatus
};