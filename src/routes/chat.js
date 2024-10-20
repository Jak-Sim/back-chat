const express = require('express');
const {
    getChatMessagesController, 
    createChatRoomController, 
    getChatRoomListController,
    createChallengeRoomController
 } = require('../controllers/chatController');

const router = express.Router();


router.get('/list/:userId', getChatRoomListController);
router.get('/message/:roomId', getChatMessagesController);

router.post('/create', createChatRoomController);
router.post('/create/challenge/:challengeId', createChallengeRoomController);



module.exports = router;