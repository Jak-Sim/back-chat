const express = require('express');
const { uploadImage, createChatRoomController, getChatRoomListController, sendMessageController } = require('../controllers/chatController');
// const multer = require('multer');

const router = express.Router();

// const upload = multer({ dest: 'uploads/' });
// router.post('/upload', upload.single('image'), uploadImage);

router.post('/send', sendMessageController);
router.get('/list/:userId', getChatRoomListController);
router.post('/create', createChatRoomController);


module.exports = router;