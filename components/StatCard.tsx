import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

interface StatCardProps {
  title: string;
  value: string;
  icon?: IconType;
  toneClassName?: string; // optional tailwind tone
  className?: string;
}

export function StatCard({ title, value, icon: Icon, toneClassName = "", className = "" }: StatCardProps) {
  return (
    <Card className={`shadow-sm rounded-2xl ${toneClassName} ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}
