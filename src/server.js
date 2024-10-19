const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { ipFilterMiddleware, ipFilterErrorHandler } = require('./middlewares/ipFilter'); // IP 화이트리스트 미들웨어

const app = express();
const server = http.createServer(app);

// CORS 설정 (서버에 추가)
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:5500'],  // 허용할 클라이언트 도메인 추가
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true  // 인증 정보 허용 (쿠키, 인증 헤더 등)
}));

// IP 화이트리스트 미들웨어 적용
app.use(ipFilterMiddleware);
app.use(ipFilterErrorHandler);

// Socket.IO 설정
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:3000', 'http://127.0.0.1:5500'],  // 허용할 클라이언트 도메인 추가
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Socket.IO 연결 및 이벤트 처리
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // 메시지 수신
    socket.on('chat message', (msg) => {
        console.log('message:', msg);
        io.emit('chat message', msg);  // 모든 클라이언트에 메시지 브로드캐스트
    });

    // 연결 해제
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});