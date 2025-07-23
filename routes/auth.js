const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');

const router = express.Router();

// POST /auth/register
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Проверка: существует ли пользователь
    const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Пользователь уже существует' });
    }

    // Хэшируем пароль
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Сохраняем пользователя
    const newUser = await db.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [email, passwordHash]
    );

    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка регистрации' });
  }
});

const jwt = require('jsonwebtoken');

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Ищем пользователя
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // 2. Проверяем пароль
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // 3. Генерируем JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка авторизации' });
  }
});

module.exports = router;
