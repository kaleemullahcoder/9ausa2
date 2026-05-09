"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  ComposedChart,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { StockHistory } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface StockChartProps {
  history: StockHistory;
}

type ChartType = "line" | "candlestick" | "volume";

const CustomCandle = (props: any) => {
  const { x, y, width, height, payload, xAxis, yAxis } = props;

  // Safety check
  if (!payload || payload.open === undefined || payload.close === undefined || payload.high === undefined || payload.low === undefined) {
    return null;
  }

  const { open, close, high, low } = payload;
  const isUp = close >= open;
  const color = isUp ? "#10b981" : "#ef4444"; // Emerald vs Red

  // Calculate coordinates using axis scales
  // Recharts passes us the pre-calculated x and y (top of bar). 
  // But for a candle we need precise Y coordinates for O/C/H/L.
  // We can use the yAxis.scale() function if available, or rely on the payload passing processed data?
  // Actually, standard Recharts custom shapes receive the *view* coordinates if we map them correctly.

  // HOWEVER, getting pixel values inside a random shape is tricky without context.
  // TRICK: We pass the exact O/C/H/L pixel values in the data? No.

  // BETTER APPROACH:
  // We use the `yAxis` scale function which is passed in `props` (often implicit in Customized, but maybe not in Shape).
  // If `yAxis` is not passed, we have a problem.

  // ALTERNATIVE:
  // We calculate the localized height ratio.
  // The `y` prop given is the top of the "bar" (min value).
  // The `height` is the total height of the bar.
  // If we map the dataKey to [low, high], then `y` is `high` (screen coords) and `y + height` is `low`.

  // Let's assume we map the Bar to `[low, high]`.
  // y = pixel(high)
  // height = pixel(low) - pixel(high)

  // We need to find pixel(open) and pixel(close).
  // ratio = height / (high - low)
  // pixel(val) = y + (high - val) * ratio

  const range = high - low;
  const ratio = range === 0 ? 0 : height / range;

  const yHigh = y;
  const yLow = y + height;
  const yOpen = y + (high - open) * ratio;
  const yClose = y + (high - close) * ratio;

  // Wick x-position (center of candle)
  const xCenter = x + width / 2;

  // Body logic
  const bodyTop = Math.min(yOpen, yClose);
  const bodyHeight = Math.max(1, Math.abs(yOpen - yClose)); // Ensure at least 1px

  return (
    <g>
      {/* Wick (Line from High to Low) */}
      <line
        x1={xCenter} y1={yHigh}
        x2={xCenter} y2={yLow}
        stroke={color}
        strokeWidth={1}
      />
      {/* Body (Rect from Open to Close) */}
      <rect
        x={x + 1}
        y={bodyTop}
        width={Math.max(1, width - 2)}
        height={bodyHeight}
        fill={color}
        stroke={color} // Fill matches stroke 
      />
    </g>
  );
};

export default function StockChart({ history }: StockChartProps) {
  const [chartType, setChartType] = useState<ChartType>("candlestick"); // Default to candle

  if (!history || !history.lineData || !history.candleData) {
    return (
      <div className="rounded-lg border border-dark-border bg-dark-card p-6 flex items-center justify-center h-80">
        <p className="text-gray-500">Wait for market data...</p>
      </div>
    );
  }

  const lineData = (history.lineData || []).map((item) => {
    try {
      const date = item.date ? new Date(item.date) : new Date();
      return {
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        price: Number(item.price) || 0,
      };
    } catch (e) { return null; }
  }).filter(Boolean);

  const candleData = (history.candleData || []).map((item) => {
    try {
      const date = item.date ? new Date(item.date) : new Date();
      const open = Number(item.open) || 0;
      const close = Number(item.close) || 0;

      // We need [low, high] for the Bar dataKey to establish the main drawing range
      const low = Number(item.low) || Math.min(open, close);
      const high = Number(item.high) || Math.max(open, close);

      return {
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        open,
        close,
        high,
        low,
        // Used for the range mapping
        range: [low, high]
      };
    } catch (e) { return null; }
  }).filter(Boolean);

  const volumeData = (history.candleData || []).map((item) => {
    try {
      const date = item.date ? new Date(item.date) : new Date();
      return {
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        volume: (Number(item.volume) || 0) / 1000000,
      };
    } catch (e) { return null; }
  }).filter(Boolean);

  return (
    <div className="rounded-lg border border-dark-border bg-dark-card p-6 shadow-xl">
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-2">
        {(["line", "candlestick", "volume"] as ChartType[]).map((type) => (
          <button
            key={type}
            onClick={() => setChartType(type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${chartType === type
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "line" ? (
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="date" stroke="#666" tick={{ fill: "#666", fontSize: 12 }} tickMargin={10} />
              <YAxis
                stroke="#666"
                tick={{ fill: "#666", fontSize: 12 }}
                domain={["auto", "auto"]}
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#000", borderColor: "#333", color: "#fff" }}
                itemStyle={{ color: "#3b82f6" }}
              />
              <Line type="monotone" dataKey="price" stroke="#0ea5e9" strokeWidth={2} dot={false} activeDot={{ r: 6, fill: "#fff" }} />
            </LineChart>
          ) : chartType === "candlestick" ? (
            <BarChart data={candleData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="date" stroke="#666" tick={{ fill: "#666", fontSize: 12 }} tickMargin={10} />
              <YAxis
                stroke="#666"
                tick={{ fill: "#666", fontSize: 12 }}
                domain={["auto", "auto"]}
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    const isUp = d.close >= d.open;
                    return (
                      <div className="bg-black/90 border border-white/10 rounded-lg p-3 shadow-2xl backdrop-blur-md">
                        <p className="text-gray-400 text-xs mb-2">{label}</p>
                        <div className="space-y-1 font-mono text-xs">
                          <div className="flex justify-between gap-4"><span className="text-gray-500">Open:</span> <span className="text-white">{d.open}</span></div>
                          <div className="flex justify-between gap-4"><span className="text-gray-500">High:</span> <span className="text-white">{d.high}</span></div>
                          <div className="flex justify-between gap-4"><span className="text-gray-500">Low:</span> <span className="text-white">{d.low}</span></div>
                          <div className="flex justify-between gap-4"><span className="text-gray-500">Close:</span> <span className={isUp ? "text-emerald-400" : "text-red-400"}>{d.close}</span></div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* 
                  The Key Trick: 
                  We bind the Bar to the [low, high] range so Recharts calculates the Y and Height for the full vertical length of the candle.
                  Then our CustomCandle shape draws the Wick and Body inside that box.
               */}
              <Bar
                dataKey="range"
                shape={<CustomCandle />}
              />
            </BarChart>
          ) : (
            <BarChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="date" stroke="#666" tick={{ fill: "#666", fontSize: 12 }} />
              <YAxis stroke="#666" tick={{ fill: "#666", fontSize: 12 }} />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{ backgroundColor: "#000", borderColor: "#333", color: "#fff" }}
              />
              <Bar dataKey="volume" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
