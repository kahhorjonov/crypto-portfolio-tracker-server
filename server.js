const express = require("express");
const cors = require("cors");
const { PORT } = require("./src/config");
const { initializeDatabase } = require("./src/db");
const setupWebSocket = require("./src/websocket");
const authRoutes = require("./src/routes/auth");
const portfolioRoutes = require("./src/routes/portfolio");
const helmet = require("helmet");

// Swagger uchun kerakli modullarni import qilamiz
const swaggerUi = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");

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

// Swagger sozlamalari
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Crypto Portfolio Tracker API",
      version: "1.0.0",
      description: "API for managing cryptocurrency portfolios",
    },
    servers: [
      // {
      //   url: "https://crypto-portfolio-tracker-server.onrender.com",
      // },
      {
        url: "http://localhost:4000",
      },
    ],
  },
  apis: ["./src/routes/*.js"], // API hujjatlari JSDoc kommentariyalari orqali ushbu fayllardan olinadi
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

initializeDatabase();

app.use("/auth", authRoutes);
app.use("/portfolio", portfolioRoutes);

const port = process.env.PORT || PORT;
const server = app.listen(port, "0.0.0.0", () => {
  console.log(`HTTP Server http://0.0.0.0:${port} da ishlamoqda`);
});

setupWebSocket(server);
