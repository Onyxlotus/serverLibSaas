const express = require('express');
const db = require('../db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Middleware для всех маршрутов
router.use(authenticateToken);

// GET /materials — получить все материалы пользователя
router.get('/', async (req, res) => {
  const userId = req.user.userId;
  try {
    const result = await db.query(
      'SELECT * FROM materials WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка получения материалов' });
  }
});

// POST /materials — создать материал
router.post('/', async (req, res) => {
  const userId = req.user.userId;
  const { title, content, tags } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO materials (user_id, title, content, tags) 
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, title, content, tags || []]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка создания материала' });
  }
});

// PUT /materials/:id — обновить материал
router.put('/:id', async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;
  const { title, content, tags } = req.body;

  try {
    const result = await db.query(
      `UPDATE materials 
       SET title = $1, content = $2, tags = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [title, content, tags || [], id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Материал не найден' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка обновления' });
  }
});

// DELETE /materials/:id — удалить материал
router.delete('/:id', async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM materials WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Материал не найден' });
    }

    res.json({ message: 'Удалено', material: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка удаления' });
  }
});

// GET /public/:public_id
router.get('/public/:public_id', async (req, res) => {
  const { public_id } = req.params;
  try {
    const result = await db.query(
      'SELECT id, title, content, tags FROM materials WHERE public_id = $1',
      [public_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Материал не найден' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при получении материала' });
  }
});


module.exports = router;
