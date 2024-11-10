"use client";

import { useEffect, useRef } from "react";
import { gantt, Link, Task } from "dhtmlx-gantt";
import "dhtmlx-gantt/codebase/dhtmlxgantt.css";

interface GanttProps {
  tasks: {
    data: Task[];
    links: Link[];
  };
}

export default function Gantt({ tasks }: GanttProps) {
  const ganttContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ganttContainer.current) return;

    gantt.config.date_format = "%Y-%m-%d %H:%i";

    // Make chart read-only
    gantt.config.readonly = true;
    gantt.config.add_column = false;
    gantt.config.drag_links = false;
    gantt.config.drag_move = false;
    gantt.config.drag_progress = false;
    gantt.config.drag_resize = false;
    gantt.config.show_grid = true;

    // Configure columns and hide the add button
    gantt.config.columns = [
      {
        name: "text",
        label: "Task name",
        tree: true,
        width: "*",
        resize: true,
      },
      { name: "start_date", label: "Start time", align: "center" },
      { name: "duration", label: "Duration", align: "center" },
    ];

    // Ajustar layout para manejar overflow correctamente
    gantt.config.layout = {
      css: "gantt_container",
      rows: [
        {
          cols: [
            {
              view: "grid",
              scrollX: "scrollHor",
              scrollY: "scrollVer",
              width: 300, // Ancho fijo para la columna de tareas
            },
            { resizer: true, width: 1 },
            {
              view: "timeline",
              scrollX: "scrollHor",
              scrollY: "scrollVer",
            },
            {
              view: "scrollbar",
              id: "scrollVer",
              group: "vertical",
            },
          ],
        },
        { view: "scrollbar", id: "scrollHor", group: "horizontal" },
      ],
    };

    // Initialize Gantt
    gantt.init(ganttContainer.current);
    gantt.parse(tasks);

    return () => {
      gantt.clearAll();
    };
  }, [tasks]);

  return (
    <div className="relative w-full overflow-x-auto">
      <div className="w-11/12">
        <div
          ref={ganttContainer}
          className="h-[600px] relative rounded-lg border border-gray-200 bg-white shadow-sm"
        />
      </div>
    </div>
  );
}
