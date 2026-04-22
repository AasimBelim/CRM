import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  message?: string;
  action?: ReactNode;
}

const EmptyState = ({
  icon,
  title = "No data found",
  message = "There are no records to display.",
  action,
}: EmptyStateProps) => {
  return (
    <div className="text-center py-5">
      <div className="mb-3 text-muted">
        {icon || <Inbox size={48} strokeWidth={1.5} />}
      </div>
      <h5 className="text-muted">{title}</h5>
      <p className="text-muted mb-3">{message}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
