import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  initStore,
  getState,
  saveProfile,
  saveSettings,
  createTask,
  updateTask,
  redactState,
  claimTabScan,
  completeTabScan,
  bindWebPage,
  requestTabScan,
} from "./store.js";
import { matchObjectiveOption } from "../shared/matching.js";
import {
  fieldSchema,
  profileSchema,
  settingsSchema,
  taskInputSchema,
} from "../shared/model.js";
await initStore();
const server = new McpServer(
  { name: "resume-workspace", version: "0.1.0" },
  {
    instructions:
      "Use this server for resume facts, resume variants, manually opened recruitment pages, settings, and structured filling reports. Objective facts are never invented. The host agent coordinates Edge browser tools and this server. Never handle credentials or CAPTCHA.",
  },
);
const result = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data) }],
  structuredContent: (Array.isArray(data) ? { items: data } : data) as Record<
    string,
    unknown
  >,
});
server.registerTool(
  "get_workspace_state",
  {
    description:
      "Return resume facts, resume variants, settings, open-page inventory, and web tasks.",
    inputSchema: {},
  },
  async () => result(redactState()),
);
server.registerTool(
  "get_fact_catalog",
  {
    description: "Return the full optional objective-fact catalog.",
    inputSchema: {},
  },
  async () => result((await import("../shared/catalog.js")).catalog),
);
server.registerTool(
  "get_resume_context",
  {
    description: "Return selected resume and immutable task snapshots.",
    inputSchema: { taskId: z.string().min(1) },
  },
  async ({ taskId }) => {
    const t = getState().tasks.find((x) => x.id === taskId);
    if (!t) throw new Error("task_not_found");
    return result({
      taskId,
      company: t.company,
      role: t.role,
      url: t.url,
      jobDescription: t.jobDescription,
      resume: t.resumeSnapshot,
      profile: t.profileSnapshot,
      settings: t.settingsSnapshot,
      status: t.status,
    });
  },
);
server.registerTool(
  "save_public_facts",
  {
    description: "Save objective facts edited in the visual profile center.",
    inputSchema: { profile: z.unknown() },
  },
  async ({ profile }) =>
    result(await saveProfile(profileSchema.parse(profile))),
);
server.registerTool(
  "save_execution_settings",
  {
    description:
      "Save execution controls, including conservative objective fuzzy matching.",
    inputSchema: { settings: z.unknown() },
  },
  async ({ settings }) =>
    result(await saveSettings(settingsSchema.parse(settings))),
);
server.registerTool(
  "create_application_task",
  {
    description:
      "Create a task from one already opened recruitment page after the user chooses a resume.",
    inputSchema: { input: z.unknown() },
  },
  async ({ input }) => result(await createTask(taskInputSchema.parse(input))),
);
server.registerTool(
  "request_tab_scan",
  {
    description:
      "Queue an open-page scan when the user asks in chat. Reuses an existing pending request.",
    inputSchema: {},
  },
  async () => result(await requestTabScan()),
);
server.registerTool(
  "claim_tab_scan",
  {
    description:
      "Claim the next user-requested scan. Then call the Edge browser tabs tool and inspect open recruitment pages.",
    inputSchema: {},
  },
  async () => result(await claimTabScan()),
);
server.registerTool(
  "complete_tab_scan",
  {
    description:
      "Store the Edge tab inventory for a claimed scan. Pages are only inventoried; the user remains responsible for login.",
    inputSchema: {
      scanId: z.string().min(1),
      tabs: z
        .array(
          z.object({
            tabId: z.string().min(1),
            url: z.url(),
            title: z.string().max(500),
            company: z.string().max(200).default(""),
            role: z.string().max(200).default(""),
            companyType: z
              .enum(["private", "state", "international", "other"])
              .default("other"),
            pageState: z.enum(["ready", "login_required", "uncertain"]),
            evidence: z.string().trim().min(1).max(10000),
          }),
        )
        .max(100),
    },
  },
  async ({ scanId, tabs }) => result(await completeTabScan(scanId, tabs)),
);
server.registerTool(
  "match_objective_option",
  {
    description:
      "Conservatively match a known objective fact to site options using the task's immutable fuzzy-matching setting. Never derives facts or picks ambiguous options.",
    inputSchema: {
      taskId: z.string().min(1),
      originalValue: z.string().max(10000),
      options: z.array(z.string().max(1000)).max(500),
      domain: z.enum(["province", "bloodType", "healthStatus", "other"]),
    },
  },
  async ({ taskId, originalValue, options, domain }) => {
    const task = getState().tasks.find((t) => t.id === taskId);
    if (!task) throw new Error("task_not_found");
    return result(
      matchObjectiveOption(
        originalValue,
        options,
        domain,
        task.settingsSnapshot.fuzzyMatchObjective,
      ),
    );
  },
);
server.registerTool(
  "bind_page_to_resume",
  {
    description:
      "Bind one inventoried ready page to a selected resume and create its immutable web task.",
    inputSchema: { pageId: z.string().min(1), resumeId: z.string().min(1) },
  },
  async ({ pageId, resumeId }) => result(await bindWebPage(pageId, resumeId)),
);
const checkpointInput = z.object({
  pageUrl: z.url(),
  section: z.string().max(200),
  note: z.string().max(30000),
  scopeComplete: z.boolean().default(false),
  saveState: z
    .enum(["not_attempted", "unverified", "confirmed"])
    .default("not_attempted"),
  saveEvidence: z.string().max(30000).default(""),
});
const patchInput = z.object({
  status: z
    .enum([
      "ready",
      "running",
      "paused",
      "needs_input",
      "completed",
      "cancelled",
    ])
    .optional(),
  fields: z.array(fieldSchema).max(500).optional(),
  checkpoints: z.array(checkpointInput).max(100).optional(),
  scopeComplete: z.boolean().optional(),
  saveState: z.enum(["not_attempted", "unverified", "confirmed"]).optional(),
});
server.registerTool(
  "update_application_task",
  {
    description:
      "Update a task report. Filled fields need reread evidence; uncertain/missing fields need a reason.",
    inputSchema: { taskId: z.string().min(1), patch: patchInput },
  },
  async ({ taskId, patch }) => result(await updateTask(taskId, patch)),
);
server.registerTool(
  "get_application_report",
  {
    description:
      "Return filled, uncertain, and missing fields plus checkpoints and save state.",
    inputSchema: { taskId: z.string().min(1) },
  },
  async ({ taskId }) => {
    const t = getState().tasks.find((x) => x.id === taskId);
    if (!t) throw new Error("task_not_found");
    return result({
      taskId,
      status: t.status,
      filled: t.fields.filter((f) => f.status === "filled"),
      uncertain: t.fields.filter((f) => f.status === "uncertain"),
      missing: t.fields.filter((f) => f.status === "missing"),
      checkpoints: t.checkpoints,
      saveState: t.saveState,
      scopeComplete: t.scopeComplete,
    });
  },
);
await server.connect(new StdioServerTransport());
