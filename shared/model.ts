import { z } from "zod";
import { catalog, type Profile } from "./catalog";
const text = z.string().max(30000);
export const settingsSchema = z
  .object({
    autoWriteSubjective: z.boolean().default(false),
    fuzzyMatchObjective: z.boolean().default(false),
    allowDraftSave: z.boolean().default(true),
    allowSubmit: z.boolean().default(false),
    overwriteExisting: z.boolean().default(false),
    uploadAttachments: z.boolean().default(true),
    maxRetries: z.number().int().min(0).max(5).default(2),
    language: z.enum(["zh", "en", "ja"]).default("zh"),
  })
  .strict();
export type Settings = z.infer<typeof settingsSchema>;
export const defaultSettings = settingsSchema.parse({});
export const profileSchema = z
  .object({
    sections: z.record(
      z.string(),
      z
        .array(
          z
            .object({
              id: z.string().min(1).max(100),
              values: z.record(z.string(), text),
            })
            .strict(),
        )
        .max(200),
    ),
  })
  .strict()
  .superRefine((p, ctx) => {
    for (const [id, records] of Object.entries(p.sections)) {
      const section = catalog.find((s) => s.id === id);
      if (!section) {
        ctx.addIssue({
          code: "custom",
          message: "unknown_section",
          path: ["sections", id],
        });
        continue;
      }
      if (!section.repeated && records.length !== 1)
        ctx.addIssue({
          code: "custom",
          message: "invalid_singleton",
          path: ["sections", id],
        });
      const ids = new Set<string>();
      for (const [i, record] of records.entries()) {
        if (ids.has(record.id))
          ctx.addIssue({
            code: "custom",
            message: "duplicate_record",
            path: ["sections", id, i],
          });
        ids.add(record.id);
        for (const [key, value] of Object.entries(record.values)) {
          const field = section.fields.find((f) => f.id === key);
          const path = ["sections", id, i, "values", key];
          if (!field) {
            ctx.addIssue({ code: "custom", message: "unknown_field", path });
            continue;
          }
          if (!value) continue;
          if (
            field.type === "select" &&
            !field.options?.some((o) => o.value === value)
          )
            ctx.addIssue({ code: "custom", message: "invalid_option", path });
          if (
            field.type === "number" &&
            (!Number.isFinite(Number(value)) || Number(value) < 0)
          )
            ctx.addIssue({ code: "custom", message: "invalid_number", path });
          if (
            field.type === "date" &&
            (!/^\d{4}-\d{2}-\d{2}$/.test(value) ||
              Number.isNaN(Date.parse(value)) ||
              new Date(value).toISOString().slice(0, 10) !== value)
          )
            ctx.addIssue({ code: "custom", message: "invalid_date", path });
          if (field.type === "email" && !z.email().safeParse(value).success)
            ctx.addIssue({ code: "custom", message: "invalid_email", path });
        }
        const v = record.values;
        const start = v.startDate || v.admissionDate,
          end = v.endDate || v.graduationDate;
        if (start && end && start > end)
          ctx.addIssue({
            code: "custom",
            message: "date_order",
            path: ["sections", id, i],
          });
        if (v.rank && v.cohortSize && Number(v.rank) > Number(v.cohortSize))
          ctx.addIssue({
            code: "custom",
            message: "rank_range",
            path: ["sections", id, i],
          });
        const scale = v.gpaScale === "other" ? v.customGpaScale : v.gpaScale;
        if (v.gpa && scale && Number(v.gpa) > Number(scale))
          ctx.addIssue({
            code: "custom",
            message: "gpa_range",
            path: ["sections", id, i],
          });
      }
    }
    for (const s of catalog)
      if (!p.sections[s.id])
        ctx.addIssue({
          code: "custom",
          message: "missing_section",
          path: ["sections", s.id],
        });
  });
export const resumeInputSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    direction: z.string().max(500),
    jobContext: text,
    subjective: text,
    extractedText: z.string().max(200000),
  })
  .strict();
export interface Resume extends z.infer<typeof resumeInputSchema> {
  id: string;
  version: number;
  originalName: string;
  fileName: string;
  createdAt: string;
  extractionStatus: "ok" | "empty" | "failed";
}
export const taskInputSchema = z
  .object({
    company: z.string().trim().min(1).max(200),
    role: z.string().trim().min(1).max(200),
    url: z.url().refine((s) => /^https?:\/\//.test(s), "invalid_url"),
    resumeId: z.string().min(1),
    companyType: z
      .enum(["private", "state", "international", "other"])
      .default("other"),
    jobDescription: text.default(""),
  })
  .strict();
export const fieldSchema = z
  .object({
    key: z.string().min(1).max(500),
    label: z.string().min(1).max(500),
    section: z.string().max(200),
    pageUrl: z.url(),
    component: z.enum([
      "text",
      "textarea",
      "select",
      "combobox",
      "date",
      "radio",
      "checkbox",
      "upload",
      "other",
    ]),
    kind: z.enum(["objective", "subjective", "preference", "declaration"]),
    required: z.boolean(),
    status: z.enum(["filled", "uncertain", "missing"]),
    value: text.default(""),
    source: z.string().max(500).default(""),
    generated: z.boolean().default(false),
    verified: z.boolean().default(false),
    reason: text.default(""),
    evidence: text.default(""),
    originalValue: text.default(""),
    matchMode: z.enum(["exact", "equivalent", "none"]).default("none"),
    matchReason: text.default(""),
  })
  .strict()
  .superRefine((f, ctx) => {
    if (
      f.status === "filled" &&
      (!f.verified ||
        !f.evidence.trim() ||
        (!f.value.trim() && f.component !== "checkbox"))
    )
      ctx.addIssue({ code: "custom", message: "filled_requires_evidence" });
    if (f.status !== "filled" && !f.reason.trim())
      ctx.addIssue({ code: "custom", message: "reason_required" });
  });
export type FieldResult = z.infer<typeof fieldSchema>;
export const checkpointSchema = z
  .object({
    pageUrl: z.url(),
    section: z.string().max(200),
    note: text,
    scopeComplete: z.boolean().default(false),
    saveState: z
      .enum(["not_attempted", "unverified", "confirmed"])
      .default("not_attempted"),
    saveEvidence: text.default(""),
    fields: z.array(fieldSchema).max(500),
  })
  .strict();
export type Checkpoint = z.infer<typeof checkpointSchema>;
export type TaskStatus =
  "ready" | "running" | "paused" | "needs_input" | "completed" | "cancelled";
export interface Task {
  id: string;
  company: string;
  role: string;
  url: string;
  companyType: string;
  jobDescription: string;
  resumeId: string;
  resumeSnapshot: Resume;
  profileSnapshot: Profile;
  profileVersion: number;
  settingsSnapshot: Settings;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  revision: number;
  fields: FieldResult[];
  checkpoints: Omit<Checkpoint, "fields">[];
  scopeComplete: boolean;
  saveState: "not_attempted" | "unverified" | "confirmed";
}
export interface State {
  profile: Profile;
  profileVersion: number;
  settings: Settings;
  resumes: Resume[];
  tasks: Task[];
  scanRequests: ScanRequest[];
  webPages: WebPage[];
}
export interface ScanRequest {
  id: string;
  status: "requested" | "claimed" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
  tabCount?: number;
  note?: string;
}
export const discoveredPageSchema = z
  .object({
    tabId: z.string().min(1).max(200),
    url: z.url().refine((s) => /^https?:\/\//.test(s), "invalid_url"),
    title: z.string().max(500),
    company: z.string().max(200).default(""),
    role: z.string().max(200).default(""),
    companyType: z
      .enum(["private", "state", "international", "other"])
      .default("other"),
    pageState: z.enum(["ready", "login_required", "uncertain"]),
    evidence: z.string().trim().min(1).max(10000),
  })
  .strict();
export interface WebPage extends z.infer<typeof discoveredPageSchema> {
  id: string;
  scanId: string;
  detectedAt: string;
  taskId?: string;
}
export const operationSchema = z.enum([
  "state",
  "save_profile",
  "save_settings",
  "upload_resume",
  "update_resume",
  "delete_resume",
  "create_task",
  "control_task",
  "delete_task",
]);
export type Operation = z.infer<typeof operationSchema>;
