require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const cronJobs = require('./jobs/cronJobs');
const aiRouter = require('./services/ai/aiRouter');
const funnelService = require('./services/funnelService');
const eventLogger = require('./services/eventLogger');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect Database
connectDB();

// Init System Services
cronJobs.init();
aiRouter.init();
funnelService.init();
eventLogger.init();

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/clients', require('./routes/clientRoutes'));
app.use('/api/ingest', require('./routes/ingestRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/insights', require('./routes/insightRoutes'));
app.use('/webhook', require('./routes/webhookRoutes'));

app.get('/', (req, res) => {
    res.send('ConvergeIQ API Running');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
