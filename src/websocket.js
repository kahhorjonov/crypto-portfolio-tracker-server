const WebSocket = require("ws");
const { COIN_PAIRS, INITIAL_PRICES } = require("./config");

const setupWebSocket = (server) => {
  const wss = new WebSocket.Server({
    server,
    verifyClient: (info, done) => {
      const origin = info.req.headers.origin;
      const allowedOrigins = [
        "https://crypto-portfolio-tracker-client.vercel.app",
        "http://localhost:3000",
        "http://localhost:3001",
      ];
      if (allowedOrigins.includes(origin)) {
        done(true);
      } else {
        console.log(
          `WebSocket ulanishi rad etildi: Noto‘g‘ri origin ${origin}`
        );
        done(false, 403, "CORS error: Origin not allowed");
      }
    },
  });

  let prices = { ...INITIAL_PRICES };

  const connectToBinanceWebSocket = () => {
    const ws = new WebSocket(
      "wss://stream.binance.com:9443/stream?streams=" +
        COIN_PAIRS.map((pair) => `${pair}@ticker`).join("/")
    );

    ws.on("open", () => console.log("Binance WebSocket ulandi"));

    ws.on("ping", (data) => {
      console.log("Ping received, sending pong...");
      ws.pong(data);
    });

    ws.on("message", (data) => {
      const message = JSON.parse(data);
      const ticker = message.data;
      if (ticker && ticker.s) {
        const symbol = ticker.s.replace("USDT", "").toUpperCase();
        const price = parseFloat(ticker.c);
        prices[symbol] = price;
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(prices));
          }
        });
      }
    });

    let retryCount = 0;
    const maxRetries = 5;
    const baseDelay = 1000;

    ws.on("error", (error) => {
      console.error("WebSocket xatosi:", error.message);
    });

    ws.on("close", () => {
      if (retryCount < maxRetries) {
        const delay = baseDelay * Math.pow(2, retryCount);
        console.log(
          `Binance WebSocket uzildi, ${delay}ms dan keyin qayta ulanmoqda...`
        );
        setTimeout(() => {
          retryCount++;
          connectToBinanceWebSocket();
        }, delay);
      } else {
        console.error(
          "Maksimal qayta ulanish urinishlari tugadi. Iltimos, tarmoqni tekshiring."
        );
      }
    });
  };

  connectToBinanceWebSocket();

  wss.on("connection", (ws) => {
    console.log("Yangi mijoz ulandi");
    ws.send(JSON.stringify(prices));
    ws.on("close", () => console.log("Mijoz uzildi"));
  });
};

module.exports = setupWebSocket;
