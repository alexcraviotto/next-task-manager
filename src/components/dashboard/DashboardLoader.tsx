import { Loader2 } from "lucide-react";
import { DashboardStructure } from "./DashboardStructure";

export default function DashboardLoader() {
  return (
    <DashboardStructure>
      <div className="flex h-screen items-center justify-center -mt-16">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    </DashboardStructure>
  );
}
