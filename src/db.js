const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");

const db = new sqlite3.Database("./portfolio.db", (err) => {
  if (err) console.error("DB xatosi:", err.message);
  console.log("SQLite DB ulandi");
});

const initializeDatabase = () => {
  db.serialize(() => {
    // Users jadvali
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
      )
    `);

    // Coins jadvali
    db.run(`
      CREATE TABLE IF NOT EXISTS coins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        symbol TEXT,
        UNIQUE(user_id, symbol),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Transactions jadvali
    db.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        coin_id INTEGER,
        type TEXT,
        quantity REAL,
        price REAL,
        date TEXT,
        FOREIGN KEY (coin_id) REFERENCES coins(id)
      )
    `);

    // user_id ustunini qo‘shish uchun migratsiya
    db.all("PRAGMA table_info(coins)", (err, rows) => {
      if (err) {
        console.error("Migratsiya xatosi (PRAGMA table_info):", err.message);
        return;
      }
      const hasUserId =
        Array.isArray(rows) && rows.some((row) => row.name === "user_id");
      if (!hasUserId) {
        console.log("user_id ustuni yo‘q, qo‘shilmoqda...");
        db.run(`ALTER TABLE coins ADD COLUMN user_id INTEGER`, (err) => {
          if (err) {
            console.error("user_id ustunini qo‘shishda xatolik:", err.message);
            return;
          }
          console.log("user_id ustuni muvaffaqiyatli qo‘shildi");
          db.run(
            `CREATE UNIQUE INDEX IF NOT EXISTS idx_user_symbol ON coins(user_id, symbol)`,
            (err) => {
              if (err) {
                console.error("Indeks qo‘shishda xatolik:", err.message);
              } else {
                console.log("idx_user_symbol indeksi muvaffaqiyatli qo‘shildi");
              }
            }
          );
        });
      } else {
        console.log("user_id ustuni allaqachon mavjud");
      }
    });

    // Dastlabki foydalanuvchi qo‘shish (test uchun)
    const hashedPassword = bcrypt.hashSync("password123", 10);
    db.run(
      `INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)`,
      ["user1", hashedPassword],
      (err) => {
        if (err)
          console.error(
            "Dastlabki foydalanuvchi qo‘shishda xatolik:",
            err.message
          );
        else console.log("Dastlabki foydalanuvchi qo‘shildi: user1");
      }
    );
  });
};

module.exports = { db, initializeDatabase };
