const express = require("express");
const cors = require("cors");
const { PORT } = require("./src/config");
const { initializeDatabase } = require("./src/db");
const setupWebSocket = require("./src/websocket");
const authRoutes = require("./src/routes/auth");
const portfolioRoutes = require("./src/routes/portfolio");
const helmet = require("helmet");

const app = express();

const corsOptions = {
  origin: [
    "https://crypto-portfolio-tracker-client.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(helmet());
app.options("*", cors(corsOptions));
app.use(express.json());

initializeDatabase();

// Marshrutlar
app.use("/auth", authRoutes);
app.use("/portfolio", portfolioRoutes);

const port = process.env.PORT || PORT; // Render PORT ni ishlatish uchun
const server = app.listen(port, "0.0.0.0", () => {
  console.log(`HTTP Server http://0.0.0.0:${port} da ishlamoqda`);
});

setupWebSocket(server);
