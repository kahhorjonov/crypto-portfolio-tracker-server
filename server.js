const express = require("express");
const cors = require("cors");
const { PORT } = require("./src/config");
const { initializeDatabase } = require("./src/db");
const setupWebSocket = require("./src/websocket");
const authRoutes = require("./src/routes/auth");
const portfolioRoutes = require("./src/routes/portfolio");
const helmet = require("helmet");

const app = express();

// const corsOptions = {
//   origin: [
//     "https://crypto-portfolio-tracker-client.vercel.app",
//     "http://localhost:3000",
//     "http://localhost:3001",
//   ],
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
// };

const corsOptions = {
  origin: "*", // Allow all origins
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  // Note: Remove 'credentials: true' if using '*', see below
};

app.use(cors(corsOptions));
app.use(helmet());

app.options("*", cors(corsOptions));

app.use(express.json());

initializeDatabase();

app.use("/login", authRoutes);
app.use("/register", authRoutes);
app.use("/portfolio", portfolioRoutes);
app.use("/add-coin", portfolioRoutes);
app.use("/remove-coin", portfolioRoutes);

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`HTTP Server http://0.0.0.0:${PORT} da ishlamoqda`);
  console.log("Listening on port:", server.address().port);
  console.log("Address:", server.address().address);
});

setupWebSocket(server);
