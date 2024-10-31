"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartData = [
  { month: "Enero", value: 45 },
  { month: "Febrero", value: 75 },
  { month: "Marzo", value: 35 },
  { month: "Abril", value: 85 },
  { month: "Mayo", value: 55 },
  { month: "Junio", value: 30 },
  { month: "Julio", value: 80 },
  { month: "Agosto", value: 45 },
  { month: "Septiembre", value: 65 },
  { month: "Octubre", value: 40 },
  { month: "Noviembre", value: 70 },
  { month: "Diciembre", value: 90 },
];

export default function MonthlyChart() {
  return (
    <div className="mt-20">
      <h2 className="text-lg font-medium mx-4 text-[#272727] text-opacity-[0.86]">
        Enero - Diciembre 2024
      </h2>

      <ChartContainer
        config={{
          value: {
            label: "Valor",
            color: "hsl(var(--foreground))",
          },
        }}
        className="h-[300px] w-full text-[#272727] text-opacity-[0.86]"
      >
        <BarChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 60,
          }}
        >
          <CartesianGrid vertical={false} className="stroke-muted" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            angle={-45}
            textAnchor="end"
            className="text-xs"
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Bar
            dataKey="value"
            fill="rgba(39,39,39,.86)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
