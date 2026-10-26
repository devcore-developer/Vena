import React from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  accent?: boolean;
  isLoading?: boolean;
  error?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  accent,
  isLoading,
  error,
}) => {
  if (isLoading) {
    return (
      <Card className={cn(accent && "bg-vena-500 border-vena-500")}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-3 w-20 bg-vena-50 rounded animate-pulse" />
            <div className="h-6 w-16 bg-vena-50 rounded mt-3 animate-pulse" />
          </div>
          <div
            className={cn(
              "p-2 rounded-lg",
              accent ? "bg-vena-600" : "bg-vena-50"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5",
                accent ? "text-white" : "text-vena-500"
              )}
            />
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn(accent && "bg-vena-500 border-vena-500")}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p
              className={cn(
                "text-sm font-medium",
                accent ? "text-vena-100" : "text-charcoal-muted"
              )}
            >
              {title}
            </p>
            <p className="text-sm font-bold mt-2 text-red-500">Unavailable</p>
          </div>
          <div
            className={cn(
              "p-2 rounded-lg",
              accent ? "bg-vena-600" : "bg-red-50"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5",
                accent ? "text-white" : "text-red-500"
              )}
            />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        accent && "bg-vena-500 border-vena-500 text-white hover:shadow-hover"
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className={cn(
              "text-sm font-medium",
              accent ? "text-vena-100" : "text-charcoal-muted"
            )}
          >
            {title}
          </p>
          <p className="text-2xl font-bold mt-2">{value}</p>
        </div>
        <div
          className={cn(
            "p-2 rounded-lg",
            accent ? "bg-vena-600" : "bg-vena-50"
          )}
        >
          <Icon
            className={cn(
              "h-5 w-5",
              accent ? "text-white" : "text-vena-500"
            )}
          />
        </div>
      </div>
    </Card>
  );
};