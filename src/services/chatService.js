const redisClient = require('../redis/redisClient');
const redisStream = require('../redis/redisStream');
const db = require('../db/dbConfig');

// redis keys 생성
const generateKeys = {
    roomStream: (roomId) => `room:${roomId}:stream`,
    roomInfo: (roomId) => `room:${roomId}:info`
};

const createRoom = async (roomName, type, participants, createUserId) => {
    console.log(`[ChatService] Creating new room: ${roomName}, type: ${type}`);
    const connection = await db.getConnection();

    const [existingRooms] = await connection.query(
        `
        SELECT cr.room_id
        FROM chat_rooms cr
        JOIN chat_participants cp ON cr.room_id = cp.room_id
        WHERE cr.room_type = ? 
        GROUP BY cr.room_id
        HAVING COUNT(*) = ? 
        AND SUM(cp.user_id IN (?)) = ?;
        `,
        [type, participants.length, participants, participants.length]
    );

    if (existingRooms.length > 0) {
        const existingRoomId = existingRooms[0].room_id;
        console.log(`[ChatService] Found existing room: ${existingRoomId}`);
        return { 
            message: 'Room already exists', 
            roomId: existingRoomId 
        };
    }
    
    try {
        const [result] = await connection.query(
            'INSERT INTO chat_rooms (room_name, room_type, create_user_id) VALUES (?, ?, ?)',
            [roomName, type, createUserId]
        );

        const roomId = result.insertId;

        for (const userId of participants) {
            await connection.query(
                'INSERT INTO chat_participants (room_id, user_id, is_active) VALUES (?, ?, 1)', // 1: is_active
                [roomId, userId]
            );
        }

        const roomInfoKey = generateKeys.roomInfo(roomId);
        
        await redisClient.hset(roomInfoKey, {
            roomName,
            roomType: type,
            createUserId,
            lastMessage: '',
            lastTimestamp: Date.now().toString()
        });

        console.log(`[ChatService] Successfully created room ${roomId}`);
        return { 
            message: 'Room created successfully', 
            roomId,
            roomName,
            roomType: type,
            participants 
        };
    } catch (error) {
        console.error('[ChatService] Error creating room:', error);
        throw new Error('Failed to create room');
    } finally {
        connection.release();
    }
};

const addParticipants = async (roomId, participants) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        // check if room exists
        const [rooms] = await connection.query('SELECT room_id FROM chat_rooms WHERE room_id = ?', [roomId]);
        if (rooms.length === 0) {
            throw new Error(`Room with id ${roomId} does not exist.`);
        }
        // check if participants are already in the room
        const [existingParticipants] = await connection.query(
            'SELECT user_id FROM chat_participants WHERE room_id = ? AND user_id IN (?)',
            [roomId, participants]
        );

        if (existingParticipants.length > 0) {
            const existingUserIds = existingParticipants.map(row => row.user_id);
            throw new Error(`Users with IDs [${existingUserIds.join(', ')}] are already in the room.`);
        }

        for (const userId of participants) {
            await connection.query(
                'INSERT INTO chat_participants (room_id, user_id, is_active) VALUES (?, ?, 1)',
                [roomId, userId]
            );
        }

        await connection.commit();
    } catch (error) {
        console.error('Error adding participants:', error.message);
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const saveMessage = async (roomId, userId, message) => {
    console.log(`[ChatService] Saving message for room ${roomId} from user ${userId}`);
    const timestamp = Date.now();
    const streamKey = generateKeys.roomStream(roomId);
    const infoKey = generateKeys.roomInfo(roomId);

    const messageData = {
        roomId,
        userId,
        message,
        timestamp,
        type: 'text'
    };

    try {
        const result = await addToStream(streamKey, messageData);
        
        await redisClient.hset(infoKey, {
            lastMessage: message,
            lastTimestamp: timestamp.toString(),
            lastUser: userId
        });

        return result;
    } catch (error) {
        console.error(`[ChatService] Error saving message:`, error);
        throw error;
    }
};

const getChatList = async (userId, roomType) => {
    const roomList = [];
    const connection = await db.getConnection();
    
    try {
        const [rooms] = await connection.query(
            `SELECT r.room_id, r.room_name, r.room_type, p.user_id
            FROM chat_rooms r
            JOIN chat_participants p ON r.room_id = p.room_id
            WHERE r.room_type = ?
            AND p.user_id = ?;`, 
            [roomType, userId]
        );

        for (const room of rooms) {
            const roomInfoKey = generateKeys.roomInfo(room.room_id);
            try {
                const roomInfo = await redisClient.hgetall(roomInfoKey);
                
                roomList.push({
                    roomId: room.room_id,
                    roomName: room.room_name,
                    roomType: room.room_type,
                    lastMessage: roomInfo?.lastMessage || null,
                    lastTimestamp: roomInfo?.lastTimestamp ? parseInt(roomInfo.lastTimestamp) : null
                });
                console.log(`[ChatService] Fetch chat list for user ${userId}, type ${roomType}`);
            } catch (redisError) {
                console.error(`[ChatService] Error fetching Redis info for room ${room.room_id}:`, redisError);
                roomList.push({
                    roomId: room.room_id,
                    roomName: room.room_name,
                    roomType: room.room_type,
                    lastMessage: null,
                    lastTimestamp: null
                });
            }
        }

        return roomList;
    } catch (error) {
        console.error('[ChatService] Error fetching chat list:', error);
        throw new Error('Failed to fetch chat list');
    } finally {
        connection.release();
    }
};

const getChatMessages = async (roomId) => {
    const streamKey = generateKeys.roomStream(roomId);
    try {
        const messages = await redisStream.readRangeFromStream(streamKey);
        console.log(`[ChatService] Retrieved ${messages?.length || 0} messages for room ${roomId}`);
        return messages || [];
    } catch (error) {
        console.error(`[ChatService] Error getting messages from room ${roomId}:`, error);
        return [];
    }
};

const createChallengeRoom = async (challengeId, roomName, type, owner) => {
    console.log(`[ChatService] Creating challenge room for challenge ${challengeId}`);
    const connection = await db.getConnection();
    
    try {
        const [result] = await connection.query(
            'INSERT INTO chat_rooms (room_type, room_name, create_user_id, challenge_id) VALUES (?, ?, ?, ?)',
            [type, roomName, owner, challengeId]
        );
        const roomId = result.insertId;

        await connection.query(
            'INSERT INTO chat_participants (room_id, user_id) VALUES (?, ?)',
            [roomId, owner]
        );

        const userRoomsKey = generateKeys.userRooms(owner);
        await redisClient.lpush(userRoomsKey, roomId.toString());

        console.log(`[ChatService] Successfully created challenge room ${roomId}`);
        return { message: 'Challenge chat room created successfully', roomId };
    } catch (error) {
        console.error('[ChatService] Error creating challenge chat room:', error);
        throw new Error('Failed to create challenge chat room');
    } finally {
        connection.release();
    }
};

module.exports = { 
    createRoom,
    saveMessage, 
    getChatList,
    getChatMessages,
    createChallengeRoom,
    addParticipants
};