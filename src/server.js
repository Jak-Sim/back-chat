const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const chatRoutes = require('./routes/chatRoute');
const imageRoutes = require('./routes/imageRoute');
const defaultRoutes = require('./routes/defaultRoute');
const socketHandler = require('./socket/socketHandler');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const app = express();
const server = http.createServer(app);
const swaggerSpecs = require('./swagger/swagger');
const basicAuth = require('express-basic-auth');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/swagger/swagger-output.json', express.static(path.join(__dirname, 'swagger', 'swagger-output.json')));
app.use('/swagger/swagger-output.yaml', express.static(path.join(__dirname, 'swagger', 'swagger-output.yaml')));

app.use(basicAuth({
  users: { [process.env.BASIC_AUTH_USER]: process.env.BASIC_AUTH_PASSWORD },
  challenge: true
}));

app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://210.183.4.67:8081', 'http://210.183.4.67:8080' , 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'user-id'],
    credentials: true 
}));

app.use('', defaultRoutes);
app.use('/chat', chatRoutes);
app.use('/chat/image', imageRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

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
});

let isNotified = false;

const handleShutdown = async () => {
  if (isNotified) return;
  isNotified = true;
  console.log('Server is shutting down...');
  process.exit();
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);