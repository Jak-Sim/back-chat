const express = require('express');
const {
  getChatMessagesController,
  createChatRoomController,
  getChallengeRoomListController,
  getGroupRoomListController,
  createChallengeRoomController,
  deleteRoomController,
} = require('../controllers/chatController');

const router = express.Router();

router.get('/list/group', getGroupRoomListController);
router.get('/list/challenge', getChallengeRoomListController);
router.get('/message/:roomId', getChatMessagesController);
router.post('/create', createChatRoomController);
router.post('/create/challenge/:challengeId', createChallengeRoomController);
router.delete('/:roomId', deleteRoomController);

module.exports = router;