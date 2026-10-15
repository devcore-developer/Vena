import React from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: string;
  accent?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, accent }) => (
  <Card className={cn(accent && "bg-vena-500 border-vena-500 text-white hover:shadow-hover")}>
    <div className="flex items-start justify-between">
      <div>
        <p className={cn("text-sm font-medium", accent ? "text-vena-100" : "text-charcoal-muted")}>{title}</p>
        <p className="text-2xl font-bold mt-2">{value}</p>
        {trend && (
          <div className={cn("flex items-center mt-2 text-xs", accent ? "text-vena-50" : "text-green-600")}>
            <ArrowUpRight size={14} className="mr-1" /> {trend}
          </div>
        )}
      </div>
      <div className={cn("p-2 rounded-lg", accent ? "bg-vena-600" : "bg-slate-50")}>
        <Icon className={cn("h-5 w-5", accent ? "text-white" : "text-vena-500")} />
      </div>
    </div>
  </Card>
);