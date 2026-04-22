import { useAuth } from "./useAuth";

type Resource =
  | "companies"
  | "contacts"
  | "leads"
  | "opportunities"
  | "deals"
  | "activities"
  | "tasks"
  | "notes"
  | "users"
  | "roles"
  | "config";

type Action = "view" | "create" | "edit" | "delete" | "assign" | "export";

// Admin-only resources
const adminResources: Resource[] = ["users", "roles", "config"];

export function usePermissions() {
  const { user, isAdmin, isManager } = useAuth();

  const canAccess = (resource: Resource, action: Action = "view"): boolean => {
    if (!user) return false;
    if (isAdmin()) return true;

    // Manager can do everything except manage users/roles/config
    if (isManager()) {
      if (adminResources.includes(resource) && action !== "view") return false;
      return true;
    }

    // Regular users: can view & create on CRM resources, can edit/delete their own
    if (adminResources.includes(resource)) return false;
    if (action === "assign") return false;
    return true;
  };

  return { canAccess, isAdmin, isManager };
}
