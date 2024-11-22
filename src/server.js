const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { ipFilterMiddleware, ipFilterErrorHandler } = require('./middlewares/ipFilter'); // IP 화이트리스트 미들웨어
const chatRoutes = require('./routes/chatRoute');
const imageRoutes = require('./routes/imageRoute');
const defaultRoutes = require('./routes/defaultRoute');
const socketHandler = require('./socket/socketHandler');
const swaggerUi = require('swagger-ui-express');
const {sendDiscordShutdownNotification, sendDiscordNotification} = require('./discordNoti');
const swaggerFile = require('./swagger/swagger-output.json');
const path = require('path');
const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/swagger/swagger-output.json', express.static(path.join(__dirname, 'swagger', 'swagger-output.json')));

app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://210.183.4.67:8081', 'http://210.183.4.67:8080' , 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'user-id'],
    credentials: true 
}));

app.use(ipFilterMiddleware);
app.use(ipFilterErrorHandler);

app.use('', defaultRoutes);
app.use('/chat', chatRoutes);
app.use('/chat/image', imageRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile, {
  swaggerOptions: {
      url: '/swagger/swagger-output.json',
  },
}));

const io = new Server(server, {
    cors: {
        origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://210.183.4.67:8081', 'http://210.183.4.67:8080', 'http://localhost:3001'],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

app.set('io', io);
socketHandler(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    // sendDiscordNotification();
});

let isNotified = false;

const handleShutdown = async () => {
  if (isNotified) return;
  isNotified = true;
  console.log('Server is shutting down...');
//   await sendDiscordShutdownNotification();
  process.exit();
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);