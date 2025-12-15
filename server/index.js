const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
// Render and other platforms set PORT automatically
const PORT = process.env.PORT || 9999;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from media directory
app.use('/api/media/static', express.static(path.join(__dirname, 'media')));

// Serve uploaded videos
app.use('/api/videos/stream', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/content', require('./routes/content'));
app.use('/api/videos', require('./routes/videos'));
app.use('/api/publish', require('./routes/publish'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/media', require('./routes/media'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

