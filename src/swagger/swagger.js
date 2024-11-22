const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Jak-Sim:Chat API',
      version: '1.0.0',
      description: 'API documentation for the Chat application',
    },
    servers: [
      {
        url: 'http://210.183.4.67:8080',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        ChatRoom: {
          type: 'object',
          required: ['roomId', 'roomName', 'roomType'],
          properties: {
            roomId: {
              type: 'string',
            },
            roomName: {
              type: 'string',
            },
            roomType: {
              type: 'string',
              enum: ['group', 'challenge'],
            },
          },
        },
        CreateChatRoom: {
          type: 'object',
          required: ['roomName', 'type', 'participants'],
          properties: {
            roomName: {
              type: 'string',
            },
            type: {
              type: 'string',
              enum: ['group', 'challenge'],
            },
            participants: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: '참여자 ID 목록',
            },
          },
        },
        CreateChallengeRoom: {
          type: 'object',
          required: ['roomName', 'type', 'owner'],
          properties: {
            roomName: {
              type: 'string',
            },
            type: {
              type: 'string',
            },
            owner: {
              type: 'string',
              description: "room owner's ID",
            },
          },
        },
        ChatMessage: {
          type: 'object',
          required: ['messageId', 'roomId', 'senderId', 'content', 'type', 'timestamp'],
          properties: {
            messageId: {
              type: 'string',
            },
            roomId: {
              type: 'string',
            },
            senderId: {
              type: 'string',
              description: 'message sender ID',
            },
            content: {
              type: 'string',
            },
            type: {
              type: 'string',
              enum: ['text', 'image'],
              description: "'text' or 'image'",
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        DeleteRoomResponse: {
          type: 'object',
          required: ['success', 'message'],
          properties: {
            message: {
              type: 'string',
            },
          },
        },
        UploadImageResponse: {
            type: 'object',
            required: ['success', 'imageUrl'],
            properties: {
              success: {
                type: 'boolean',
              },
              imageUrl: {
                type: 'string',
              },
              data: {
                type: 'object',
                description: 'optional data',
                additionalProperties: true,
              },
            },
          },
        UpdateImageStatusRequest: {
            type: 'object',
            required: ['imageId', 'status'],
            properties: {
                imageId: {
                type: 'string',
                },
                status: {
                type: 'string',
                enum: ['accepted', 'rejected'],
                description: "'accepted' or 'rejected'",
                },
            },
        },
        UpdateImageStatusResponse: {
            type: 'object',
            required: ['success', 'data'],
            properties: {
                success: {
                type: 'boolean',
                description: 'success flag',
                },
                data: {
                type: 'object',
                description: 'updated data',
                additionalProperties: true,
                },
            },
        },
      },
    },
  },
  apis: ['./src/controllers/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = specs;