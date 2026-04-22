import { Badge } from "reactstrap";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "primary" | "secondary";

interface StatusBadgeProps {
  status: string;
  variant?: BadgeVariant;
  size?: "sm" | "md" | "lg";
  pill?: boolean;
}

const defaultVariantMap: Record<string, BadgeVariant> = {
  // Deal statuses
  won: "success",
  lost: "danger",
  pending: "warning",
  partial: "info",
  // Task priorities
  low: "secondary",
  medium: "info",
  high: "warning",
  urgent: "danger",
  // Generic
  active: "success",
  inactive: "secondary",
  completed: "success",
  overdue: "danger",
  // Lead statuses
  new: "primary",
  contacted: "info",
  qualified: "success",
  nurturing: "warning",
};

const sizeClasses: Record<string, string> = {
  sm: "fs-8",
  md: "",
  lg: "fs-6",
};

const StatusBadge = ({
  status,
  variant,
  size = "md",
  pill = true,
}: StatusBadgeProps) => {
  const resolvedVariant =
    variant || defaultVariantMap[status.toLowerCase()] || "secondary";

  return (
    <Badge
      color={resolvedVariant}
      pill={pill}
      className={sizeClasses[size]}
    >
      {status}
    </Badge>
  );
};

export default StatusBadge;
