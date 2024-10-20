const express = require('express');
const { 
    uploadImage, 
    getChatMessagesController, 
    createChatRoomController, 
    getChatRoomListController,
    createChallengeRoomController
 } = require('../controllers/chatController');
// const multer = require('multer');

const router = express.Router();

// const upload = multer({ dest: 'uploads/' });
// router.post('/upload', upload.single('image'), uploadImage);

router.get('/list/:userId', getChatRoomListController);
router.get('/message/:roomId', getChatMessagesController);

router.post('/create', createChatRoomController);
router.post('/create/challenge/:challengeId', createChallengeRoomController);



module.exports = router;