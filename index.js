const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

const PORT = process.env.PORT || 5000;
const authenticateToken = require('./middleware/auth');

app.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: 'Ты авторизован!', user: req.user });
});

app.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.send(`API работает. Время: ${result.rows[0].now}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка подключения к базе данных');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const materialsRoutes = require('./routes/materials');
app.use('/materials', materialsRoutes);

app.use(cors({
  origin: 'https://onyx-jatuvdfun-onyxs-projects-2e02c8c2.vercel.app',
  credentials: true
}));