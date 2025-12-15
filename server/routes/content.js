const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const { generateStory, generateVoiceoverScript } = require('../services/gemini');
const pool = require('../config/database');

/**
 * @swagger
 * /content/generate:
 *   post:
 *     summary: Generate AI story content using Gemini
 *     tags: [Content]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *                 example: "Generate me a reddit like story post where a student is trying to get into a large company"
 *     responses:
 *       200:
 *         description: Content generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 prompt:
 *                   type: string
 *                 generatedText:
 *                   type: string
 *                 voiceoverScript:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Missing prompt
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { prompt } = req.body;
    const userId = req.user.userId;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const generatedText = await generateStory(prompt);
    const voiceoverScript = generateVoiceoverScript(generatedText);

    const result = await pool.query(
      `INSERT INTO content_generations (user_id, prompt, generated_text, status)
       VALUES ($1, $2, $3, 'generated')
       RETURNING id, prompt, generated_text, created_at`,
      [userId, prompt, generatedText]
    );

    const content = result.rows[0];

    res.json({
      id: content.id,
      prompt: content.prompt,
      generatedText: content.generated_text,
      voiceoverScript: voiceoverScript,
      createdAt: content.created_at
    });
  } catch (error) {
    console.error('Content generation error:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

router.get('/my-content', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT id, prompt, generated_text, background_music, background_video,
              status, created_at
       FROM content_generations
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT * FROM content_generations
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { generated_text } = req.body;

    if (!generated_text) {
      return res.status(400).json({ error: 'Generated text is required' });
    }

    const result = await pool.query(
      `UPDATE content_generations 
       SET generated_text = $1
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [generated_text, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({ error: 'Failed to update content' });
  }
});

module.exports = router;
