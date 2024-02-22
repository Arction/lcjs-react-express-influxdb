require("dotenv").config();
const express = require("express");
const path = require("path");
const http = require("http");
const bodyParser = require("body-parser");
const cors = require("cors");
const { InfluxDB, Point } = require("@influxdata/influxdb-client");
const WebSocket = require("ws");

const INFLUXDB_API_TOKEN = process.env.INFLUXDB_API_TOKEN;
const PORT = 3000;
console.log({ PORT, INFLUXDB_API_TOKEN });

const influxDB = new InfluxDB({
  url: "http://localhost:8086",
  token: INFLUXDB_API_TOKEN,
});
const writeApi = influxDB.getWriteApi("test-organization", "test-bucket");
const queryApi = influxDB.getQueryApi("test-organization");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.get("/data", (req, res) => {
  // Query last 5 minutes of data from InfluxDB
  const fluxQuery = `from(bucket: "test-bucket")
            |> range(start: -5m, stop: now())`;
  const query = async () => {
    const data = { times: [], values: [] };
    for await (const { values, tableMeta } of queryApi.iterateRows(fluxQuery)) {
      const o = tableMeta.toObject(values);
      const time = new Date(o._time).getTime();
      const value = o._value;
      data.times.push(time);
      data.values.push(value);
    }
    res.json(data);
  };
  query();
});
server.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
wss.on("connection", function connection(ws) {
  console.log("ws connection");
});

setInterval(() => {
  // Spawn data point
  const time = Date.now();
  const value = 23.0 + Math.random();

  // Add data point to InfluxDB
  const point = new Point("temperature")
    .floatField("value", value)
    .timestamp(time);
  writeApi.writePoint(point);

  // Broadcast new data point to all active clients
  const data = JSON.stringify({ time, value });
  wss.clients.forEach((client) => {
    client.send(data);
  });
}, 1000 / 30);
