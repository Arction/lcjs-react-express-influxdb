import logo from "./logo.svg";
import "./App.css";
import { useEffect, useState, useRef } from "react";
import {
  AxisScrollStrategies,
  AxisTickStrategies,
  emptyFill,
  lightningChart,
} from "@arction/lcjs";

if (!window.WebSocket) {
  throw new Error("Websocket not supported by browser.");
}

const backendUrl = window.origin;
const wsUrl = backendUrl.replace("http://", "ws://");

function App() {
  const [historyDataLoaded, setHistoryDataLoaded] = useState(false);
  const chartRef = useRef();

  // Setup chart to receive data points
  useEffect(() => {
    const container = document.getElementById("chart");
    if (!container) return;
    const lc = lightningChart({
      // (!!!) LightningChart JS license goes here (!!!)
    });
    const chart = lc.ChartXY({
      container,
      defaultAxisX: { type: "linear-highPrecision" },
      animationsEnabled: false,
    });
    const axisX = chart
      .getDefaultAxisX()
      .setTickStrategy(AxisTickStrategies.DateTime)
      .setScrollStrategy(AxisScrollStrategies.progressive)
      .setDefaultInterval((state) => ({
        end: state.dataMax ?? 0,
        start: (state.dataMax ?? 0) - 1 * 60 * 1000,
        stopAxisAfter: false,
      }));
    const lineSeries = chart
      .addPointLineAreaSeries({ dataPattern: "ProgressiveX" })
      .setMaxSampleCount(10_000)
      .setPointFillStyle(emptyFill);
    chartRef.current = { chart, axisX, lineSeries };
    return () => {
      lc.dispose();
    };
  }, []);

  // Load historical data at component lifecycle start
  useEffect(() => {
    if (historyDataLoaded) return;
    const abortController = new AbortController();
    (async () => {
      try {
        const response = await fetch(`${backendUrl}/data`, {
          signal: abortController.signal,
        });
        const data = await response.json();
        setHistoryDataLoaded(true);
        if (chartRef.current) {
          chartRef.current.lineSeries.appendSamples({
            xValues: data.times,
            yValues: data.values,
          });
        }
      } catch (e) {}
    })();
    return () => {
      abortController.abort();
    };
  }, [historyDataLoaded]);

  // After historical data is loaded, subscribe to new data events
  useEffect(() => {
    if (!historyDataLoaded) return;
    const socket = new WebSocket(wsUrl);
    socket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (chartRef.current) {
        chartRef.current.lineSeries.appendSample({
          x: data.time,
          y: data.value,
        });
      }
    };
    return () => {
      if (socket) socket.close();
    };
  }, [historyDataLoaded]);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <div id="chart" style={{ width: "80vw", height: "40vh" }}></div>
      </header>
    </div>
  );
}

export default App;
