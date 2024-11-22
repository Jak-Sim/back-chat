const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
    // #swagger.tags = ['Default']
    res.send('동네 구멍가게 채팅 서버');
});

router.get('/health', (req, res) => {
    // #swagger.tags = ['Default']
    res.send('Health check OK');
});

module.exports = router;