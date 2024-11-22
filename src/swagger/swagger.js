const swaggerAutogen = require('swagger-autogen')();

const outputFile = './swagger-output.json';
const endpointsFiles = [
    './src/routes/chatRoute.js',
    './src/routes/defaultRoute.js',
    './src/routes/imageRoute.js'
];

const doc = {
    info: {
        title: 'Jak-Sim:Chat API',
        description: 'API documentation for the Chat application',
    },
    host: '210.183.4.67:8080',
    schemes: ['http'],
    tags: [
        { name: 'Chat Rooms', description: 'Manage chat rooms' },
        { name: 'Image', description: 'Manage image uploads' },
    ],
};

swaggerAutogen(outputFile, endpointsFiles, doc, true).then(() => {
    console.log('Swagger documentation generated successfully.');
}).catch((err) => {
    console.error('Error generating Swagger documentation:', err);
});