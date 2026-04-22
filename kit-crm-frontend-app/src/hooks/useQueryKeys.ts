// Query key factory for consistent cache key management
export const queryKeys = {
  // Companies
  companies: {
    all: ["companies"] as const,
    lists: () => [...queryKeys.companies.all, "list"] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.companies.lists(), params] as const,
    details: () => [...queryKeys.companies.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.companies.details(), id] as const,
  },

  // Contacts
  contacts: {
    all: ["contacts"] as const,
    lists: () => [...queryKeys.contacts.all, "list"] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.contacts.lists(), params] as const,
    details: () => [...queryKeys.contacts.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.contacts.details(), id] as const,
    byCompany: (companyId: number) =>
      [...queryKeys.contacts.all, "company", companyId] as const,
  },

  // Leads
  leads: {
    all: ["leads"] as const,
    lists: () => [...queryKeys.leads.all, "list"] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.leads.lists(), params] as const,
    details: () => [...queryKeys.leads.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.leads.details(), id] as const,
    statuses: () => [...queryKeys.leads.all, "statuses"] as const,
    lostReasons: () => [...queryKeys.leads.all, "lostReasons"] as const,
  },

  // Opportunities
  opportunities: {
    all: ["opportunities"] as const,
    lists: () => [...queryKeys.opportunities.all, "list"] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.opportunities.lists(), params] as const,
    details: () => [...queryKeys.opportunities.all, "detail"] as const,
    detail: (id: number) =>
      [...queryKeys.opportunities.details(), id] as const,
    stages: () => [...queryKeys.opportunities.all, "stages"] as const,
  },

  // Deals
  deals: {
    all: ["deals"] as const,
    lists: () => [...queryKeys.deals.all, "list"] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.deals.lists(), params] as const,
    details: () => [...queryKeys.deals.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.deals.details(), id] as const,
    stats: (params?: Record<string, unknown>) =>
      [...queryKeys.deals.all, "stats", params] as const,
  },

  // Activities
  activities: {
    all: ["activities"] as const,
    lists: () => [...queryKeys.activities.all, "list"] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.activities.lists(), params] as const,
    details: () => [...queryKeys.activities.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.activities.details(), id] as const,
    types: () => [...queryKeys.activities.all, "types"] as const,
    stats: (params?: Record<string, unknown>) =>
      [...queryKeys.activities.all, "stats", params] as const,
  },

  // Tasks
  tasks: {
    all: ["tasks"] as const,
    lists: () => [...queryKeys.tasks.all, "list"] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.tasks.lists(), params] as const,
    details: () => [...queryKeys.tasks.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.tasks.details(), id] as const,
    stats: (params?: Record<string, unknown>) =>
      [...queryKeys.tasks.all, "stats", params] as const,
  },

  // Notes
  notes: {
    all: ["notes"] as const,
    lists: () => [...queryKeys.notes.all, "list"] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.notes.lists(), params] as const,
    details: () => [...queryKeys.notes.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.notes.details(), id] as const,
  },

  // Data Sources
  dataSources: {
    all: ["dataSources"] as const,
    list: () => [...queryKeys.dataSources.all, "list"] as const,
    imports: () => [...queryKeys.dataSources.all, "imports"] as const,
  },

  // Stage History
  stageHistory: {
    all: ["stageHistory"] as const,
    lists: () => [...queryKeys.stageHistory.all, "list"] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.stageHistory.lists(), params] as const,
    stats: (params?: Record<string, unknown>) =>
      [...queryKeys.stageHistory.all, "stats", params] as const,
  },

  // Users
  users: {
    all: ["users"] as const,
    lists: () => [...queryKeys.users.all, "list"] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.users.lists(), params] as const,
    details: () => [...queryKeys.users.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.users.details(), id] as const,
  },

  // Roles
  roles: {
    all: ["roles"] as const,
    list: () => [...queryKeys.roles.all, "list"] as const,
  },
};
