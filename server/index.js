const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { swaggerUi, swaggerSpec } = require('./config/swagger');

dotenv.config();

// Setup YouTube OAuth configuration if not already present
if (!process.env.YOUTUBE_CLIENT_ID || !process.env.YOUTUBE_CLIENT_SECRET) {
  console.warn('YouTube OAuth is not configured. Set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET in .env');
}
if (!process.env.YOUTUBE_REDIRECT_URI) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  process.env.YOUTUBE_REDIRECT_URI = `${frontendUrl}/youtube-callback`;
  console.log(`Setting default YouTube redirect URI to: ${process.env.YOUTUBE_REDIRECT_URI}`);
}

console.log(process.env.NODE_ENV);

const app = express();
const PORT = process.env.PORT || 9999;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'AI Content Platform API Documentation'
}));

app.use('/api/media/static', express.static(path.join(__dirname, 'media')));

app.use('/api/videos/stream', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/content', require('./routes/content'));
app.use('/api/videos', require('./routes/videos'));
app.use('/api/publish', require('./routes/publish'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/media', require('./routes/media'));
app.use('/api/tiktok', require('./routes/tiktok'));
app.use('/api/backgrounds', require('./routes/backgrounds'));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 message:
 *                   type: string
 *                   example: "Server is running"
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
