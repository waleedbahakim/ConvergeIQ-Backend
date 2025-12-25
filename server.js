require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
connectDB();

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/clients', require('./routes/clientRoutes'));
app.use('/api/ingest', require('./routes/ingestRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/insights', require('./routes/insightRoutes'));
app.use('/api/reasoning', require('./routes/reasoningRoutes'));
app.use('/webhook', require('./routes/webhookRoutes'));

app.get('/', (req, res) => {
    res.send('ConvergeIQ API Running');
});

const initCronJobs = require('./jobs/cronJobs');
initCronJobs();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
