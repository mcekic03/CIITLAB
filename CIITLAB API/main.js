const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const db = require('./config/db');
const os = require('os');
const routeLogger = require('./middleware/routelog');
const errorHandler = require('./middleware/error');
const swaggerUi = require('swagger-ui-express');
const specs = require('./config/swagger');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(routeLogger);
app.use(errorHandler);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));


// Test ruta
app.get('/', (req, res) => {
  res.send('🚀 Express server je pokrenut!');
});

// Rute

const userRoutes = require('./routes/users');
app.use('/users', userRoutes);

//ovde je login samo /auth/login
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

//publications
const publicationsRoutes = require("./routes/publications");
app.use('/users/publications', publicationsRoutes);

//resources
const resourcesRoutes = require("./routes/resources")
app.use('/users/resources', resourcesRoutes);

//sentencesroutes
const sentencesRoutes = require("./routes/sentences")
app.use('/sentences', sentencesRoutes);

//studentsWorks
const studentsWorkRoutes = require("./routes/studentsWork")
app.use('/studentsWork', studentsWorkRoutes);

//adminroutes
const adminRoutes = require("./routes/admin")
app.use('/admin', adminRoutes);




// Dobijanje lokalne IP adrese
const getLocalIp = () => {
    const interfaces = os.networkInterfaces();
    for (const interfaceName in interfaces) {
        for (const iface of interfaces[interfaceName]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address; // Vraća prvu dostupnu IPv4 adresu
            }
        }
    }
    return '127.0.0.1'; // Ako ne pronađe, vraća localhost
};

// Pokretanje servera
const PORT = process.env.APP_PORT || 2000;
const LOCAL_IP = getLocalIp();

app.listen(PORT, () => {
  console.log(`✅ Server radi na:`);
  console.log(`   🔹 Lokalno:   http://localhost:${PORT}`);
  console.log(`   🔹 Mrežna IP: http://${LOCAL_IP}:${PORT}`);
});
