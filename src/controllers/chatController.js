const redisClient = require('../redis/redisClient');
const {
  getChatMessages,
  getChatList,
  createRoom,
  createChallengeRoom,
  addParticipants,
} = require('../services/chatService');

const CreateChatRoomDTO = require('../dto/CreateChatRoom.dto');
const CreateChallengeRoomDTO = require('../dto/CreateChallengeRoom.dto');
const ChatRoomDTO = require('../dto/ChatRoom.dto');
const ChatMessageDTO = require('../dto/ChatMessage.dto');
const AddParticipantsDTO = require('../dto/AddParticipants.dto');

/**
 * @swagger
 * /chat/create:
 *   post:
 *     summary: 채팅방을 생성합니다.
 *     tags:
 *       - Chat
 *     parameters:
 *       - in: header
 *         name: user-id
 *         required: true
 *         schema:
 *           type: string
 *         description: 사용자 ID
 *     requestBody:
 *       description: 채팅방 생성 정보
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateChatRoom'
 *     responses:
 *       '201':
 *         description: 생성된 채팅방 정보
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatRoom'
 *       '400':
 *         description: 잘못된 요청 (헤더에 사용자 ID가 없거나 요청 본문이 유효하지 않을 경우)
 *       '500':
 *         description: 서버 오류 (채팅방 생성 실패 시)
 */
const createChatRoomController = async (req, res) => {
  const createUserId = req.headers['user-id'];

  if (!createUserId) {
    return res.status(400).json({ message: 'User ID is required in the header' });
  }

  const { roomName, type, participants } = req.body;

  if (!roomName || !type || !Array.isArray(participants)) {
    return res.status(400).json({ message: 'Invalid request body: roomName, type, and participants are required' });
  }

  if (participants.length < 2) {
    return res.status(400).json({ message: 'Failed to create room: must select at least 2 participants' });
  }

  try {
    const createChatRoomDTO = new CreateChatRoomDTO(roomName, type, participants);
    const result = await createRoom(createChatRoomDTO);
    return res.status(201).json(new ChatRoomDTO(result.roomId, result.roomName, result.roomType));
  } catch (error) {
    console.error('Failed to create room:', error);
    return res.status(500).json({ message: 'Failed to create room' });
  }
};

/**
 * @swagger
 * /chat/add:
 *   post:
 *     summary: 채팅방에 인원을 추가합니다.
 *     tags:
 *       - Chat
 *     parameters:
 *       - in: header
 *         name: user-id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       description: 추가할 인원과 방 ID
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roomId:
 *                 type: string
 *                 description: 추가할 채팅방 ID
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 추가할 사용자 ID 목록
 *     responses:
 *       '200':
 *         description: 인원 추가 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Participants added successfully
 *       '400':
 *         description: 잘못된 요청 (요청 데이터가 유효하지 않을 경우)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid request data
 *       '500':
 *         description: 서버 오류 (추가 실패 시)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Failed to add participants
 */
const addParticipantsController = async (req, res) => {
  try {
    const createUserId = req.headers['user-id'];

    if (!createUserId) {
      return res.status(400).json({ message: 'User ID is required in the header' });
    }

    const { roomId, participants } = req.body;
    const addParticipantsDTO = new AddParticipantsDTO(roomId, participants);

    await addParticipants(addParticipantsDTO.roomId, addParticipantsDTO.participants);

    res.status(200).json({ message: 'Participants added successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * @swagger
 * /chat/{roomId}:
 *   delete:
 *     summary: 채팅방을 삭제합니다.
 *     tags:
 *       - Chat
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: 삭제할 방 ID
 *     responses:
 *       '200':
 *         description: 삭제 성공 메시지
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeleteRoomResponse'
 *       '500':
 *         description: 서버 오류 (채팅방 삭제 실패 시)
 */
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

/**
 * @swagger
 * /chat/list/group:
 *   get:
 *     summary: 그룹 채팅방 목록을 가져옵니다.
 *     tags:
 *       - Chat
 *     parameters:
 *       - in: header
 *         name: user-id
 *         required: true
 *         schema:
 *           type: string
 *         description: 사용자 ID
 *     responses:
 *       '200':
 *         description: 채팅방 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ChatRoom'
 *       '400':
 *         description: 잘못된 요청 (헤더에 사용자 ID가 없을 경우)
 *       '500':
 *         description: 서버 오류 (채팅방 목록 조회 실패 시)
 */
const getGroupRoomListController = async (req, res) => {
  const userId = req.headers['user-id'];
  const roomType = 'group';

  if (!userId) {
    console.log('User ID is missing in the request headers.');
    return res.status(400).json({ message: 'User ID is required in the header' });
  }

  try {
    const chatListData = await getChatList(userId, roomType);
    const chatList = chatListData.map(
      (room) => new ChatRoomDTO(room.roomId, room.roomName, room.roomType)
    );
    res.status(200).json(chatList);
  } catch (error) {
    console.error('Failed to get chat list:', error);
    res.status(500).json({ message: 'Failed to get chat list' });
  }
};

/**
 * @swagger
 * /chat/list/challenge:
 *   get:
 *     summary: 챌린지 채팅방 목록을 가져옵니다.
 *     tags:
 *       - Chat
 *     parameters:
 *       - in: header
 *         name: user-id
 *         required: true
 *         schema:
 *           type: string
 *         description: 사용자 ID
 *     responses:
 *       '200':
 *         description: 채팅방 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ChatRoom'
 *       '400':
 *         description: 잘못된 요청 (헤더에 사용자 ID가 없을 경우)
 *       '500':
 *         description: 서버 오류 (채팅방 목록 조회 실패 시)
 */
const getChallengeRoomListController = async (req, res) => {
  const userId = req.headers['user-id'];
  const roomType = 'challenge';

  if (!userId) {
    console.log('User ID is missing in the request headers.');
    return res.status(400).json({ message: 'User ID is required in the header' });
  }

  try {
    const chatListData = await getChatList(userId, roomType);
    const chatList = chatListData.map(
      (room) => new ChatRoomDTO(room.roomId, room.roomName, room.roomType)
    );
    res.status(200).json(chatList);
  } catch (error) {
    console.error('Failed to get chat list:', error);
    res.status(500).json({ message: 'Failed to get chat list' });
  }
};

/**
 * @swagger
 * /chat/message/{roomId}:
 *   get:
 *     summary: 채팅방의 메시지를 가져옵니다.
 *     tags:
 *       - Chat
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: 방 ID
 *     responses:
 *       '200':
 *         description: 채팅 메시지 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ChatMessage'
 *       '500':
 *         description: 서버 오류 (메시지 조회 실패 시)
 */
const getChatMessagesController = async (req, res) => {
  const { roomId } = req.params;

  try {
    const messagesData = await getChatMessages(roomId);
    const messages = messagesData.map(
      (msg) =>
        new ChatMessageDTO(
          msg.messageId,
          msg.roomId,
          msg.senderId,
          msg.content,
          msg.type,
          msg.timestamp
        )
    );
    res.status(200).json(messages);
  } catch (error) {
    console.error(`Error in getChatMessagesController:`, error);
    res.status(500).json({ message: 'Failed to fetch chat messages' });
  }
};

/**
 * @swagger
 * /chat/create/challenge/{challengeId}:
 *   post:
 *     summary: 챌린지 채팅방을 생성합니다.
 *     tags:
 *       - Chat
 *     parameters:
 *       - in: path
 *         name: challengeId
 *         required: true
 *         schema:
 *           type: string
 *         description: 챌린지 ID
 *     requestBody:
 *       description: 챌린지 채팅방 생성 정보
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateChallengeRoom'
 *     responses:
 *       '201':
 *         description: 생성된 챌린지 채팅방 정보
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatRoom'
 *       '400':
 *         description: 잘못된 요청 (필수 필드 누락 시)
 *       '500':
 *         description: 서버 오류 (챌린지 채팅방 생성 실패 시)
 */
const createChallengeRoomController = async (req, res) => {
  const { challengeId } = req.params;
  const { roomName, type, owner } = req.body;

  if (!challengeId) {
    return res.status(400).json({ message: 'Invalid request: missing challenge ID.' });
  }

  try {
    const createChallengeRoomDTO = new CreateChallengeRoomDTO(roomName, type, owner);
    const result = await createChallengeRoom(challengeId, createChallengeRoomDTO);
    res.status(201).json(new ChatRoomDTO(result.roomId, result.roomName, result.roomType));
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
  addParticipantsController,
};