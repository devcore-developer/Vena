import React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, actionLabel, onAction }) => (
  <Card className="text-center py-12 px-6">
    <Icon className="mx-auto h-12 w-12 text-charcoal-muted opacity-50 mb-4" />
    <h3 className="text-lg font-medium text-charcoal">{title}</h3>
    <p className="text-charcoal-muted mt-1 mb-4 max-w-sm mx-auto">{description}</p>
    {actionLabel && onAction && (
      <Button onClick={onAction}>{actionLabel}</Button>
    )}
  </Card>
);