const express = require("express");
const cors = require("cors");
const { PORT } = require("./src/config");
const { initializeDatabase } = require("./src/db");
const setupWebSocket = require("./src/websocket");
const authRoutes = require("./src/routes/auth");
const portfolioRoutes = require("./src/routes/portfolio");

const app = express();

app.use(express.json());
app.use(cors());

// Ma’lumotbazani ishga tushirish
initializeDatabase();

// Marshrutlar
app.use("/login", authRoutes);
app.use("/register", authRoutes);
app.use("/portfolio", portfolioRoutes);
app.use("/add-coin", portfolioRoutes);
app.use("/remove-coin", portfolioRoutes);

const server = app.listen(PORT, "localhost", () => {
  console.log(`HTTP Server http://localhost:${PORT} da ishlamoqda`);
});

// WebSocket ni sozlash
setupWebSocket(server);
