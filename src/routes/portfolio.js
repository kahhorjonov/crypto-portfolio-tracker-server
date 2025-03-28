const express = require("express");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");
const { db } = require("../db");

const router = express.Router();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Токен отсутствует" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Недействительный токен" });
    req.user = user;
    next();
  });
};

router.get("/", authenticateToken, (req, res) => {
  const userId = req.user.id;
  db.all(
    `
    SELECT c.symbol, t.id, t.type, t.quantity, t.price, t.date
    FROM coins c
    LEFT JOIN transactions t ON c.id = t.coin_id
    WHERE c.user_id = ?
  `,
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const portfolio = {};
      rows.forEach((row) => {
        if (!portfolio[row.symbol]) portfolio[row.symbol] = [];
        if (row.id) {
          portfolio[row.symbol].push({
            id: row.id,
            type: row.type,
            quantity: row.quantity,
            price: row.price,
            date: row.date,
          });
        }
      });
      res.json(portfolio);
    }
  );
});

// Statik marshrutni dinamik marshrutdan oldin aniqlaymiz
router.post("/add-coin", authenticateToken, (req, res) => {
  const { symbol } = req.body;
  const userId = req.user.id;
  db.run(
    `INSERT OR IGNORE INTO coins (user_id, symbol) VALUES (?, ?)`,
    [userId, symbol.toUpperCase()],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: `${symbol} добавлена` });
    }
  );
});

// Tranzaksiya qo‘shish uchun yo‘lni aniqroq qilamiz
router.post("/transaction/:coin", authenticateToken, (req, res) => {
  const { coin } = req.params;
  const { type, quantity, price } = req.body;
  const userId = req.user.id;
  db.get(
    `SELECT id FROM coins WHERE symbol = ? AND user_id = ?`,
    [coin, userId],
    (err, row) => {
      if (err || !row)
        return res.status(404).json({ error: "Монета не найдена" });
      const coinId = row.id;
      db.run(
        `INSERT INTO transactions (coin_id, type, quantity, price, date) VALUES (?, ?, ?, ?, ?)`,
        [coinId, type, quantity, price, new Date().toISOString()],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({
            id: this.lastID,
            type,
            quantity,
            price,
            date: new Date().toISOString(),
          });
        }
      );
    }
  );
});

// Shu tarzda boshqa tranzaksiya marshrutlarini ham o‘zgartiramiz
router.put("/transaction/:coin/:id", authenticateToken, (req, res) => {
  const { coin, id } = req.params;
  const { type, quantity, price } = req.body;
  const userId = req.user.id;
  db.get(
    `SELECT id FROM coins WHERE symbol = ? AND user_id = ?`,
    [coin, userId],
    (err, row) => {
      if (err || !row)
        return res.status(404).json({ error: "Монета не найдена" });
      db.run(
        `UPDATE transactions SET type = ?, quantity = ?, price = ? WHERE id = ? AND coin_id = ?`,
        [type, quantity, price, id, row.id],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ id: Number(id), type, quantity, price });
        }
      );
    }
  );
});

router.delete("/transaction/:coin/:id", authenticateToken, (req, res) => {
  const { coin, id } = req.params;
  const userId = req.user.id;
  db.get(
    `SELECT id FROM coins WHERE symbol = ? AND user_id = ?`,
    [coin, userId],
    (err, row) => {
      if (err || !row)
        return res.status(404).json({ error: "Монета не найдена" });
      db.run(
        `DELETE FROM transactions WHERE id = ? AND coin_id = ?`,
        [id, row.id],
        (err) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: "Транзакция удалена" });
        }
      );
    }
  );
});

router.delete("/remove-coin/:symbol", authenticateToken, (req, res) => {
  const { symbol } = req.params;
  const userId = req.user.id;
  db.run(
    `DELETE FROM coins WHERE symbol = ? AND user_id = ?`,
    [symbol, userId],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      db.run(
        `DELETE FROM transactions WHERE coin_id IN (SELECT id FROM coins WHERE symbol = ? AND user_id = ?)`,
        [symbol, userId],
        (err) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: `${symbol} удалена` });
        }
      );
    }
  );
});

module.exports = router;
