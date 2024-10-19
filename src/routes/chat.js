const express = require('express');
const multer = require('multer');
const { uploadImage, sendMessage, getChatListController, sendMessageController } = require('../controllers/chatController');

const router = express.Router();

const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('image'), uploadImage);
router.post('/send', sendMessage);

router.get('/list/:userId', getChatListController);
router.post('/send', sendMessageController);

module.exports = router;