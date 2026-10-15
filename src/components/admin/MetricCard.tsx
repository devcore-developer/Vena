import React from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  accent?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, accent }) => (
  <Card className={cn(accent && "bg-vena-500 border-vena-500 text-white hover:shadow-hover")}>
    <div className="flex items-start justify-between">
      <div>
        <p className={cn("text-sm font-medium", accent ? "text-vena-100" : "text-charcoal-muted")}>{title}</p>
        <p className="text-2xl font-bold mt-2">{value}</p>
      </div>
      <div className={cn("p-2 rounded-lg", accent ? "bg-vena-600" : "bg-slate-50")}>
        <Icon className={cn("h-5 w-5", accent ? "text-white" : "text-vena-500")} />
      </div>
    </div>
  </Card>
);