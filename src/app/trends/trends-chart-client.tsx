"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { TrendPoint } from "@/features/trends/trend-series";

type TrendsChartClientProps = {
  points: TrendPoint[];
  labels: {
    totalStationCount: string;
    totalHpcStationCount: string;
    totalConnectorCount: string;
  };
};

const FOREST = "#0d2b22";
const AMBER = "#c27428";
const FOREST_MID = "#3f6a58";
const GRID = "rgb(13 43 34 / 0.1)";
const TICK = { fontSize: 12, fill: "rgb(13 43 34 / 0.7)" };

const TrendsChartClient = ({ points, labels }: TrendsChartClientProps) => (
  <ResponsiveContainer width="100%" height={320}>
    <LineChart data={points} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
      <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
      <XAxis dataKey="date" tick={TICK} stroke={GRID} tickLine={false} />
      <YAxis tick={TICK} stroke={GRID} tickLine={false} allowDecimals={false} />
      <Tooltip
        cursor={{ stroke: GRID }}
        contentStyle={{
          background: "#fbf8f1",
          border: "1px solid rgb(13 43 34 / 0.1)",
          borderRadius: 16,
          boxShadow: "0 8px 24px rgb(13 43 34 / 0.12)",
          color: FOREST,
          fontSize: 13,
        }}
        labelStyle={{ color: FOREST, fontWeight: 600 }}
      />
      <Legend
        wrapperStyle={{ fontSize: 13 }}
        formatter={(value: string) => <span style={{ color: FOREST }}>{value}</span>}
      />
      <Line
        type="monotone"
        dataKey="totalStationCount"
        name={labels.totalStationCount}
        stroke={FOREST}
        strokeWidth={2.5}
        dot={false}
      />
      <Line
        type="monotone"
        dataKey="totalHpcStationCount"
        name={labels.totalHpcStationCount}
        stroke={AMBER}
        strokeWidth={2.5}
        dot={false}
      />
      <Line
        type="monotone"
        dataKey="totalConnectorCount"
        name={labels.totalConnectorCount}
        stroke={FOREST_MID}
        strokeWidth={2.5}
        strokeDasharray="6 4"
        dot={false}
      />
    </LineChart>
  </ResponsiveContainer>
);

export default TrendsChartClient;
