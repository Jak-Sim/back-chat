const express = require('express');
const {
    getChatMessagesController, 
    createChatRoomController,
    getChallengeRoomListController,
    getGroupRoomListController,
    createChallengeRoomController
 } = require('../controllers/chatController');

const router = express.Router();

router.get('/list/group', (req, res) => {
    // #swagger.tags = ['Chat Rooms']
    // #swagger.description = 'Fetch the list of group chat rooms.'
    getGroupRoomListController(req, res);
});

router.get('/list/challenge', (req, res) => {
    // #swagger.tags = ['Chat Rooms']
    // #swagger.description = 'Fetch the list of challenge chat rooms.'
    getChallengeRoomListController(req, res);
});

router.get('/message/:roomId', (req, res) => {
    // #swagger.tags = ['Chat Rooms']
    // #swagger.description = 'Fetch messages for a specific chat room.'
    getChatMessagesController(req, res);
});

router.post('/create', (req, res) => {
    // #swagger.tags = ['Chat Rooms']
    // #swagger.description = 'Create a new chat room.'
    createChatRoomController(req, res);
});

router.post('/create/challenge/:challengeId', (req, res) => {
    // #swagger.tags = ['Chat Rooms']
    // #swagger.description = 'Create a new challenge chat room.'
    createChallengeRoomController(req, res);
});

module.exports = router;