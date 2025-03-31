const express = require('express');
const swaggerUi = require('swagger-ui-express');
const specs = require('./config/swagger');

const app = express();

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// ... existing code ... 