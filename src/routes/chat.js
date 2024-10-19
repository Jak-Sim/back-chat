const express = require('express');
const { uploadImage, getChatMessagesController, createChatRoomController, getChatRoomListController } = require('../controllers/chatController');
// const multer = require('multer');

const router = express.Router();

// const upload = multer({ dest: 'uploads/' });
// router.post('/upload', upload.single('image'), uploadImage);

router.get('/list/:userId', getChatRoomListController);
router.post('/create', createChatRoomController);
router.get('/message/:roomId', getChatMessagesController);


module.exports = router;