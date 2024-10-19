const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { ipFilterMiddleware, ipFilterErrorHandler } = require('./middlewares/ipFilter'); // IP 화이트리스트 미들웨어
const chatRoutes = require('./routes/chat');
const socketHandler = require('./socket/socketHandler');

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS 설정 (서버에 추가)
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:5500'],
    allowedHeaders: ['Content-Type', 'Authorization', 'user-id'],
    credentials: true  // 인증 정보 허용
}));

// IP 화이트리스트 미들웨어 적용
app.use(ipFilterMiddleware);
app.use(ipFilterErrorHandler);

app.use('/uploads', express.static('uploads'));
app.use('/chat', chatRoutes);

// Socket.IO 설정
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:3000', 'http://127.0.0.1:5500'],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

socketHandler(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});