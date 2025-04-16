const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const os = require('os');
const routeLogger = require('./middleware/routelog');
const errorHandler = require('./middleware/error');
const swaggerUi = require('swagger-ui-express');
const specs = require('./config/swagger');
const path = require('path');
const fs = require('fs');

const Sentence = require('./models/Sentence');

dotenv.config();


const app = express();
app.use(cors());
app.use(routeLogger);
app.use(errorHandler);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));


// Test ruta
app.get('/', (req, res) => {
  res.send('🚀 Express server je pokrenut!');
});

// Rute

app.use("/users/images",express.json(), express.static(path.join(__dirname, "public")));


const uploadRoutes = require('./routes/upload');
app.use('/users/updateProfile', uploadRoutes);

const userRoutes = require('./routes/users');
app.use('/users',express.json(), userRoutes);

//ovde je login samo /auth/login
const authRoutes = require('./routes/auth');
app.use('/auth',express.json(), authRoutes);

//publications
const publicationsRoutes = require("./routes/publications");
app.use('/users/publications',express.json(), publicationsRoutes);

//resources
const resourcesRoutes = require("./routes/resources")
app.use('/users/resources',express.json(), resourcesRoutes);

//sentencesroutes
const sentencesRoutes = require("./routes/sentences")
app.use('/sentences',express.json(), sentencesRoutes);

//blogs
const blogsRoutes = require("./routes/blogs")
app.use('/blogs',express.json(), blogsRoutes);

//studentsWorks
const studentsWorkRoutes = require("./routes/studentsWork")
app.use('/studentsWork',express.json(), studentsWorkRoutes);

//adminroutes
const adminRoutes = require("./routes/admin")
app.use('/admin',express.json(), adminRoutes);

// Kreiranje logs direktorijuma ako ne postoji
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

// Funkcija za čišćenje server.log fajla
const clearServerLog = () => {
    const logPath = path.join(logsDir, 'server.log');
    
    // Proveri da li fajl postoji
    if (fs.existsSync(logPath)) {
        try {
            // Isprazni fajl
            fs.writeFileSync(logPath, '');
            console.log('Server.log fajl je očišćen');
        } catch (error) {
            console.error('Greška pri čišćenju server.log fajla:', error);
        }
    }
};

const checkSentencesTask = async () => {
    try {
        await Sentence.checkSentences();
        console.log('Provera rečenica izvršena:', new Date().toLocaleString('sr-RS'));
    } catch (error) {
        console.error('Greška pri proveri rečenica:', error);
    }
};
// Pokrećemo prvi put odmah
checkSentencesTask();
// Postavljamo interval za izvršavanje svakih 24h
setInterval(checkSentencesTask, 24 * 60 * 60 * 1000);

// Postavi interval za čišćenje na 10 dana (10 * 24 * 60 * 60 * 1000 milisekundi)
setInterval(clearServerLog, 10 * 24 * 60 * 60 * 1000);

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
