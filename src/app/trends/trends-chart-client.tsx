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

const TrendsChartClient = ({ points, labels }: TrendsChartClientProps) => (
  <ResponsiveContainer width="100%" height={320}>
    <LineChart data={points} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
      <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#64748b" />
      <YAxis tick={{ fontSize: 12 }} stroke="#64748b" allowDecimals={false} />
      <Tooltip />
      <Legend />
      <Line
        type="monotone"
        dataKey="totalStationCount"
        name={labels.totalStationCount}
        stroke="#059669"
        strokeWidth={2}
        dot={false}
      />
      <Line
        type="monotone"
        dataKey="totalHpcStationCount"
        name={labels.totalHpcStationCount}
        stroke="#2563eb"
        strokeWidth={2}
        dot={false}
      />
      <Line
        type="monotone"
        dataKey="totalConnectorCount"
        name={labels.totalConnectorCount}
        stroke="#d97706"
        strokeWidth={2}
        dot={false}
      />
    </LineChart>
  </ResponsiveContainer>
);

export default TrendsChartClient;
