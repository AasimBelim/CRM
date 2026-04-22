import {
    boolean,
    date,
    integer,
    pgTable,
    text,
    numeric,
    timestamp,
    index,
} from "drizzle-orm/pg-core";

/* =========================
   ROLES
========================= */
export const roles = pgTable("roles", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    roleName: text("role_name").notNull().unique(),
});

/* =========================
   USERS
========================= */
export const users = pgTable("users", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userName: text("user_name").notNull(),
    email: text("email").notNull().unique(),
    phoneNumber: text("phone_number").notNull(),
    password: text("password").notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    roleId: integer("role_id")
        .notNull()
        .references(() => roles.id),
    isActive: boolean("is_active").notNull().default(true),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* =========================
   MEDIA LIBRARY
========================= */
export const mediaLibrary = pgTable("media_library", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    fileName: text("file_name").notNull(),
    fileUrl: text("file_url").notNull(),
    mimeType: text("mime_type").notNull(),
    fileSize: integer("file_size").notNull(),
    width: integer("width"),
    height: integer("height"),
    altText: text("alt_text"),
    title: text("title"),
    description: text("description"),
    uploadedBy: integer("uploaded_by").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* =========================
   OPTIONS (SYSTEM CONFIG)
========================= */
export const options = pgTable("options", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    optionKey: text("option_key").notNull().unique(),
    optionValue: text("option_value"),
});

/* =========================
   DATA SOURCES
========================= */
export const dataSources = pgTable("data_sources", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: text("name").notNull().unique(), // LinkedIn, Website, Database, Referral, Cold Outreach
    isActive: boolean("is_active").notNull().default(true),
});

/* =========================
   DATA IMPORTS (Track bulk uploads by analysts)
========================= */
export const dataImports = pgTable("data_imports", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    fileName: text("file_name"),
    importedBy: integer("imported_by")
        .notNull()
        .references(() => users.id),
    totalRecords: integer("total_records").notNull().default(0),
    successfulRecords: integer("successful_records").notNull().default(0),
    failedRecords: integer("failed_records").notNull().default(0),
    status: text("status").notNull().default("processing"), // processing, completed, failed
    errorLog: text("error_log"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* =========================
   COMPANIES
========================= */
export const companies = pgTable(
    "companies",
    {
        id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
        name: text("name").notNull(),
        website: text("website"),
        domain: text("domain"), // normalized domain for duplicate detection
        industry: text("industry"),
        companySize: text("company_size"), // 1-10, 11-50, 51-200, 201-500, 500+
        country: text("country"),
        city: text("city"),
        address: text("address"),
        description: text("description"),
        dataSourceId: integer("data_source_id").references(() => dataSources.id),
        dataQuality: integer("data_quality").default(3), // 1-5 rating by analyst
        dataImportId: integer("data_import_id").references(() => dataImports.id),
        verifiedAt: timestamp("verified_at"),
        verifiedBy: integer("verified_by").references(() => users.id),
        createdBy: integer("created_by")
            .notNull()
            .references(() => users.id),
        assignedTo: integer("assigned_to").references(() => users.id),
        assignedAt: timestamp("assigned_at"),
        isActive: boolean("is_active").notNull().default(true),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => ({
        domainIdx: index("companies_domain_idx").on(table.domain),
        assignedToIdx: index("companies_assigned_to_idx").on(table.assignedTo),
        createdByIdx: index("companies_created_by_idx").on(table.createdBy),
    })
);

/* =========================
   COMPANY CONTACTS
========================= */
export const companyContacts = pgTable(
    "company_contacts",
    {
        id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
        companyId: integer("company_id")
            .notNull()
            .references(() => companies.id, { onDelete: "cascade" }),
        name: text("name").notNull(),
        email: text("email").notNull(),
        phone: text("phone"),
        linkedIn: text("linkedin"),
        designation: text("designation"),
        isPrimary: boolean("is_primary").default(false),
        isActive: boolean("is_active").notNull().default(true),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => ({
        companyIdIdx: index("company_contacts_company_id_idx").on(table.companyId),
    })
);

/* =========================
   LEAD STATUSES (Customizable pipeline)
========================= */
export const leadStatuses = pgTable("lead_statuses", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: text("name").notNull().unique(), // New, Contacted, Qualified, Nurturing, Lost
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* =========================
   LOST REASONS
========================= */
export const lostReasons = pgTable("lost_reasons", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    reason: text("reason").notNull().unique(), // Budget, No Response, Not Interested, Bad Timing
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* =========================
   LEADS
========================= */
export const leads = pgTable(
    "leads",
    {
        id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
        companyId: integer("company_id")
            .notNull()
            .references(() => companies.id, { onDelete: "cascade" }),
        contactId: integer("contact_id").references(() => companyContacts.id),
        leadStatusId: integer("lead_status_id")
            .notNull()
            .references(() => leadStatuses.id),
        assignedTo: integer("assigned_to")
            .references(() => users.id),
        createdBy: integer("created_by")
            .notNull()
            .references(() => users.id),
        priority: text("priority").default("medium"), // low, medium, high, urgent
        tags: text("tags"), // JSON array or comma-separated
        qualifiedAt: timestamp("qualified_at"),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => ({
        companyIdIdx: index("leads_company_id_idx").on(table.companyId),
        statusIdx: index("leads_status_idx").on(table.leadStatusId),
        assignedToIdx: index("leads_assigned_to_idx").on(table.assignedTo),
    })
);

/* =========================
   OPPORTUNITY STAGES (Customizable sales pipeline)
========================= */
export const opportunityStages = pgTable("opportunity_stages", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: text("name").notNull().unique(), // Discovery, Proposal, Negotiation, Won, Lost
    probability: integer("probability"), // 0-100%
    order: integer("order").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* =========================
   OPPORTUNITIES
========================= */
export const opportunities = pgTable(
    "opportunities",
    {
        id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
        leadId: integer("lead_id")
            .notNull()
            .references(() => leads.id, { onDelete: "cascade" }),
        stageId: integer("stage_id")
            .notNull()
            .references(() => opportunityStages.id),
        lostReasonId: integer("lost_reason_id").references(() => lostReasons.id),
        expectedValue: numeric("expected_value", { precision: 12, scale: 2 }),
        expectedCloseDate: timestamp("expected_close_date"),
        actualCloseDate: timestamp("actual_close_date"),
        probability: integer("probability"), // 0-100%
        description: text("description"),
        competitorInfo: text("competitor_info"),
        createdBy: integer("created_by")
            .notNull()
            .references(() => users.id),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => ({
        leadIdIdx: index("opportunities_lead_id_idx").on(table.leadId),
        stageIdx: index("opportunities_stage_idx").on(table.stageId),
    })
);

/* =========================
   DEALS
========================= */
export const deals = pgTable(
    "deals",
    {
        id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
        opportunityId: integer("opportunity_id")
            .notNull()
            .references(() => opportunities.id, { onDelete: "cascade" }),
        createdBy: integer("created_by")
            .notNull()
            .references(() => users.id),
        dealValue: numeric("deal_value", { precision: 12, scale: 2 }).notNull(),
        status: text("status").notNull().default("pending"), // pending, partial, won, lost
        lostReasonId: integer("lost_reason_id").references(() => lostReasons.id),
        contractStartDate: timestamp("contract_start_date"),
        contractEndDate: timestamp("contract_end_date"),
        paymentTerms: text("payment_terms"),
        closedDate: timestamp("closed_date"),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => ({
        opportunityIdIdx: index("deals_opportunity_id_idx").on(table.opportunityId),
        statusIdx: index("deals_status_idx").on(table.status),
    })
);

/* =========================
   ACTIVITY TYPES
========================= */
export const activityTypes = pgTable("activity_types", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: text("name").notNull().unique(), // Call, Email, LinkedIn, WhatsApp, Meeting, Demo
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* =========================
   ACTIVITIES
========================= */
export const activities = pgTable(
    "activities",
    {
        id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
        entityType: text("entity_type").notNull(), // company, lead, opportunity
        entityId: integer("entity_id").notNull(),
        contactId: integer("contact_id").references(() => companyContacts.id), // specific contact involved
        activityTypeId: integer("activity_type_id")
            .notNull()
            .references(() => activityTypes.id),
        subject: text("subject"),
        notes: text("notes"),
        duration: integer("duration"), // in minutes
        outcome: text("outcome"), // successful, no_answer, follow_up_needed, etc.
        performedBy: integer("performed_by")
            .notNull()
            .references(() => users.id),
        activityDate: timestamp("activity_date").notNull().defaultNow(),
        createdAt: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => ({
        entityIdx: index("activities_entity_idx").on(table.entityType, table.entityId),
        performedByIdx: index("activities_performed_by_idx").on(table.performedBy),
        activityDateIdx: index("activities_date_idx").on(table.activityDate),
    })
);

/* =========================
   TASKS (Follow-ups and reminders for BDEs)
========================= */
export const tasks = pgTable(
    "tasks",
    {
        id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
        entityType: text("entity_type").notNull(), // company, lead, opportunity
        entityId: integer("entity_id").notNull(),
        title: text("title").notNull(),
        description: text("description"),
        taskType: text("task_type").notNull(), // call, email, meeting, follow_up, demo
        priority: text("priority").default("medium"), // low, medium, high, urgent
        assignedTo: integer("assigned_to")
            .notNull()
            .references(() => users.id),
        createdBy: integer("created_by").references(() => users.id),
        dueDate: timestamp("due_date").notNull(),
        reminderDate: timestamp("reminder_date"),
        completed: boolean("completed").default(false),
        completedAt: timestamp("completed_at"),
        completedBy: integer("completed_by").references(() => users.id),
        outcome: text("outcome"),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => ({
        entityIdx: index("tasks_entity_idx").on(table.entityType, table.entityId),
        assignedToIdx: index("tasks_assigned_to_idx").on(table.assignedTo),
        dueDateIdx: index("tasks_due_date_idx").on(table.dueDate),
        completedIdx: index("tasks_completed_idx").on(table.completed),
    })
);

/* =========================
   NOTES
========================= */
export const notes = pgTable(
    "notes",
    {
        id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
        entityType: text("entity_type").notNull(), // company, lead, opportunity, deal
        entityId: integer("entity_id").notNull(),
        content: text("content").notNull(),
        isPinned: boolean("is_pinned").default(false),
        createdBy: integer("created_by")
            .notNull()
            .references(() => users.id),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => ({
        entityIdx: index("notes_entity_idx").on(table.entityType, table.entityId),
    })
);

/* =========================
   STAGE HISTORY (Track movement through pipeline)
========================= */
export const stageHistory = pgTable(
    "stage_history",
    {
        id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
        entityType: text("entity_type").notNull(), // lead, opportunity
        entityId: integer("entity_id").notNull(),
        fromStageId: integer("from_stage_id"),
        toStageId: integer("to_stage_id").notNull(),
        changedBy: integer("changed_by")
            .notNull()
            .references(() => users.id),
        notes: text("notes"),
        createdAt: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => ({
        entityIdx: index("stage_history_entity_idx").on(table.entityType, table.entityId),
    })
);