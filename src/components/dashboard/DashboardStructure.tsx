import React from "react";

export function DashboardStructure({
  children,
}: {
  children: React.ReactNode[] | React.ReactNode;
}) {
  return <div className="m-4">{children}</div>;
}
