const express = require('express');
const { ipFilterMiddleware, ipFilterErrorHandler } = require('./middlewares/ipFilter');
const authRoutes = require('./routes/authRoutes');

const chatRoutes = require('./routes/chat');
const redisClient = require('./redis/redisClient');

const server = http.createServer(app);
const io = new Server(server);

const app = express();

app.use(ipFilterMiddleware);
app.use(ipFilterErrorHandler);
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/chat', chatRoutes);

const PORT = process.env.PORT || 3000;


socketHandler(io);

subClient.subscribe('room:*');
subClient.on('message', (channel, message) => {
    const roomId = channel.split(':')[1];
    io.to(roomId).emit('newMessage', JSON.parse(message));
});

// 정적 파일 제공 (이미지 접근을 위해)
app.use('/uploads', express.static('uploads'));
server.listen(PORT, () => console.log(`Chat Service running on port ${PORT}`));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});








