"use client";

import { useEffect, useRef } from "react";
import { gantt, Link, Task } from "dhtmlx-gantt";
import "dhtmlx-gantt/codebase/dhtmlxgantt.css";

interface GanttProps {
  tasks: {
    data: Task[];
    links: Link[];
  };
  onTaskChange?: (task: Task) => void;
  onLinkChange?: (link: Link) => void;
}

export default function Gantt({
  tasks,
  onTaskChange,
  onLinkChange,
}: GanttProps) {
  const ganttContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ganttContainer.current) return;

    gantt.config.date_format = "%Y-%m-%d %H:%i";

    // Initialize Gantt
    gantt.init(ganttContainer.current);
    gantt.parse(tasks);

    // Event listeners
    const taskUpdateEvent = gantt.attachEvent(
      "onAfterTaskUpdate",
      (_id: number, task: Task) => {
        onTaskChange?.(task);
      },
    );

    const linkUpdateEvent = gantt.attachEvent(
      "onAfterLinkUpdate",
      (_id: number, link: Link) => {
        onLinkChange?.(link);
      },
    );

    // Cleanup
    return () => {
      gantt.detachEvent(taskUpdateEvent);
      gantt.detachEvent(linkUpdateEvent);
      gantt.clearAll();
    };
  }, [tasks, onTaskChange, onLinkChange]);

  return (
    <div
      ref={ganttContainer}
      className="w-full h-full min-h-[600px] relative rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden"
    />
  );
}
