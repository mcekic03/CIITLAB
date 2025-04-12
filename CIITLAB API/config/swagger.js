const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CIITLAB API Documentation',
      version: '1.0.0',
      description: 'API документација за CIITLAB систем',
    },
    servers: [
      {
        url: 'http://160.99.40.221:3500',
        description: 'Production server',
      },
      {
        url: 'http://localhost:3500',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['student', 'researcher', 'admin'] },
            bio: { type: 'string' },
            imageUrl: { type: 'string' },
          },
        },
        Publication: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            description: { type: 'string' },
            userId: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Resource: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            description: { type: 'string' },
            url: { type: 'string' },
            userId: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        StudentWork: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            description: { type: 'string' },
            studentId: { type: 'integer' },
            status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Sentence: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            text: { type: 'string' },
            userId: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [{
      bearerAuth: [],
    }],
  },
  apis: ['./routes/*.js'], // putanja do vaših ruta
};

const specs = swaggerJsdoc(options);
module.exports = specs; 