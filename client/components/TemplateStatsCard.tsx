import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface TemplateStatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: "blue" | "green" | "purple" | "orange" | "red";
  change?: {
    value: number;
    trend: "up" | "down";
  };
}

const colorMap = {
  blue: {
    bg: "bg-blue-500",
    light: "bg-blue-50",
    text: "text-blue-600",
  },
  green: {
    bg: "bg-green-500",
    light: "bg-green-50",
    text: "text-green-600",
  },
  purple: {
    bg: "bg-purple-500",
    light: "bg-purple-50",
    text: "text-purple-600",
  },
  orange: {
    bg: "bg-orange-500",
    light: "bg-orange-50",
    text: "text-orange-600",
  },
  red: {
    bg: "bg-red-500",
    light: "bg-red-50",
    text: "text-red-600",
  },
};

export default function TemplateStatsCard({
  title,
  value,
  icon: Icon,
  color,
  change,
}: TemplateStatsCardProps) {
  const colors = colorMap[color];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`${colors.light} p-2 rounded-lg`}>
          <Icon className={`w-4 h-4 ${colors.text}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className="text-xs text-muted-foreground">
            <span
              className={
                change.trend === "up" ? "text-green-600" : "text-red-600"
              }
            >
              {change.trend === "up" ? "+" : "-"}
              {Math.abs(change.value)}%
            </span>{" "}
            from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}
