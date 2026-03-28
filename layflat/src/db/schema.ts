import { boolean, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  credits: integer("credits").notNull().default(0),
  stripeCustomerId: text("stripe_customer_id").unique(),
  subscriptionStatus: text("subscription_status"), // active | trialing | past_due | canceled | null
  subscriptionId: text("subscription_id"),
  subscriptionPlan: text("subscription_plan"), // monthly25 | monthly50 | monthly99
});

export const otpCodes = pgTable(
  "otp_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    codeHash: text("code_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    attempts: integer("attempts").notNull().default(0),
    used: boolean("used").notNull().default(false),
  },
  (t) => ({
    emailIdx: index("otp_codes_email_idx").on(t.email),
  }),
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => ({
    userIdIdx: index("sessions_user_id_idx").on(t.userId),
  }),
);

export const folders = pgTable(
  "folders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdIdx: index("folders_user_id_idx").on(t.userId),
  }),
);

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    folderId: uuid("folder_id").references(() => folders.id, { onDelete: "set null" }),
    name: text("name"),
    status: text("status").notNull().default("queued"), // queued|running|done|failed
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),

    garmentImageDataUrl: text("garment_image_data_url").notNull(),
    modelImageDataUrl: text("model_image_data_url").notNull(),

    replicatePredictionId: text("replicate_prediction_id"),
    error: text("error"),
  },
  (t) => ({
    userIdIdx: index("jobs_user_id_idx").on(t.userId),
    folderIdIdx: index("jobs_folder_id_idx").on(t.folderId),
    statusIdx: index("jobs_status_idx").on(t.status),
  }),
);

export const creditTransactions = pgTable(
  "credit_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(), // positive = credit, negative = debit
    type: text("type").notNull(), // pack_purchase | subscription_grant | job_deduction | manual
    description: text("description").notNull(),
    stripeSessionId: text("stripe_session_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdIdx: index("credit_transactions_user_id_idx").on(t.userId),
  }),
);

export const jobOutputs = pgTable(
  "job_outputs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    variantIndex: integer("variant_index").notNull(), // 0..5
    imageUrl: text("image_url").notNull(),
    poseLabel: text("pose_label"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    jobIdIdx: index("job_outputs_job_id_idx").on(t.jobId),
  }),
);

