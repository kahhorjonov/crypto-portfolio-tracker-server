const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { db } = require("../db");
const { JWT_SECRET } = require("../config");

const router = express.Router();

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Foydalanuvchi tizimga kirishi
 *     description: Foydalanuvchi login va parol orqali tizimga kiradi va token oladi.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Muvaffaqiyatli kirish, token qaytarildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: Noto'g'ri login yoki parol
 */
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  db.get(
    `SELECT * FROM users WHERE username = ?`,
    [username],
    async (err, user) => {
      if (err || !user)
        return res.status(401).json({ error: "Неверный логин или пароль" });

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword)
        return res.status(401).json({ error: "Неверный логин или пароль" });

      const token = jwt.sign({ id: user.id, username }, JWT_SECRET, {
        expiresIn: "1h",
      });
      res.json({ token });
    }
  );
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Foydalanuvchi ro'yxatdan o'tishi
 *     description: Yangi foydalanuvchi ro'yxatdan o'tadi.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Foydalanuvchi muvaffaqiyatli ro'yxatdan o'tdi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Пользователь успешно зарегистрирован
 *       400:
 *         description: Foydalanuvchi allaqachon mavjud
 */
router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  db.run(
    `INSERT INTO users (username, password) VALUES (?, ?)`,
    [username, hashedPassword],
    (err) => {
      if (err)
        return res.status(400).json({ error: "Пользователь уже существует" });
      res.json({ message: "Пользователь успешно зарегистрирован" });
    }
  );
});

module.exports = router;
