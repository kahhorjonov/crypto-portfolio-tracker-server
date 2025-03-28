const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { db } = require("../db");
const { JWT_SECRET } = require("../config");

const router = express.Router();

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
