"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";

interface Task {
  name: string;
  progress: number;
  startDate: string;
  endDate: string;
  createdBy: { username: string };
}

interface MonthlyChartProps {
  tasks?: Task[];
}

export default function MonthlyChart({ tasks = [] }: MonthlyChartProps) {
  console.log("Tasks received:", tasks); // Debug log

  const processData = () => {
    const months = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];

    // Inicializar los datos mensuales
    const monthlyData = months.map((month) => ({
      month,
      value: 0, // Cambiado a un solo valor para simplificar
    }));

    // Contar todas las tareas por mes
    if (tasks && tasks.length > 0) {
      tasks.forEach((task) => {
        try {
          const startDate = new Date(task.startDate);
          const monthIndex = startDate.getMonth();
          monthlyData[monthIndex].value++;
        } catch (error) {
          console.error("Error processing task:", task, error);
        }
      });
    }

    console.log("Processed data:", monthlyData); // Debug log
    return monthlyData;
  };

  const chartData = processData();

  return (
    <div className="mt-4 space-y-12">
      <h2 className="text-lg font-medium mx-4 text-[#272727] text-opacity-[0.86]">
        Total de Tareas por Mes - 2024
      </h2>

      <ChartContainer
        config={{
          value: {
            label: "Tareas",
            color: "rgba(39,39,39,.86)",
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
            className="text-xs"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            className="text-xs"
          />
          <ChartTooltip
            cursor={false}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-2 border rounded shadow">
                    <p className="text-sm">{`${payload[0].value} tareas`}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="value"
            fill="rgba(39,39,39,.86)"
            radius={[20, 20, 20, 20]}
            name="Total Tareas"
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
