const WebSocket = require("ws");
const { COIN_PAIRS, INITIAL_PRICES } = require("./config");

const setupWebSocket = (server) => {
  const wss = new WebSocket.Server({ server });
  let prices = { ...INITIAL_PRICES };

  const connectToBinanceWebSocket = () => {
    const ws = new WebSocket(
      "wss://stream.binance.com:9443/stream?streams=" +
        COIN_PAIRS.map((pair) => `${pair}@ticker`).join("/")
    );

    ws.on("open", () => console.log("Binance WebSocket ulandi"));

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

    ws.on("error", (error) =>
      console.error("WebSocket xatosi:", error.message)
    );
    ws.on("close", () => {
      console.log("Binance WebSocket uzildi, qayta ulanmoqda...");
      setTimeout(connectToBinanceWebSocket, 1000);
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
