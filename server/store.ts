import { mkdir, readFile, copyFile } from "node:fs/promises";
import { join, basename, extname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { emptyProfile } from "../shared/catalog.js";
import {
  defaultSettings,
  type State,
  type Resume,
  type Task,
  type ScanRequest,
  profileSchema,
  settingsSchema,
  discoveredPageSchema,
  fieldSchema,
} from "../shared/model.js";
import { z } from "zod";

export const DATA_DIR = resolve(
  process.env.RESUME_DATA_DIR || join(process.cwd(), "data"),
);
const FILE_DIR = join(DATA_DIR, "files");
let db: DatabaseSync | undefined;
const initialState = (): State => ({
  profile: emptyProfile(),
  profileVersion: 1,
  settings: { ...defaultSettings },
  resumes: [],
  tasks: [],
  scanRequests: [],
  webPages: [],
});
function migrate(s: State): State {
  s.scanRequests ??= [];
  s.webPages ??= [];
  s.settings = settingsSchema.parse(s.settings);
  for (const t of s.tasks)
    t.settingsSnapshot = settingsSchema.parse(t.settingsSnapshot);
  return s;
}
export async function initStore() {
  if (db) return getState();
  await mkdir(FILE_DIR, { recursive: true });
  db = new DatabaseSync(join(DATA_DIR, "workspace.sqlite"));
  db.exec(
    "PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS workspace(id INTEGER PRIMARY KEY CHECK(id=1), payload TEXT NOT NULL)",
  );
  if (!db.prepare("SELECT id FROM workspace WHERE id=1").get()) {
    let state = initialState();
    try {
      state = migrate(
        JSON.parse(await readFile(join(DATA_DIR, "state.json"), "utf8")),
      );
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    }
    db.prepare("INSERT OR IGNORE INTO workspace(id,payload) VALUES(1,?)").run(
      JSON.stringify(state),
    );
  }
  return getState();
}
export function getState(): State {
  if (!db) throw new Error("store_not_initialized");
  return migrate(
    JSON.parse(
      (
        db.prepare("SELECT payload FROM workspace WHERE id=1").get() as {
          payload: string;
        }
      ).payload,
    ),
  );
}
export async function mutate<T>(fn: (s: State) => T): Promise<T> {
  if (!db) throw new Error("store_not_initialized");
  db.exec("BEGIN IMMEDIATE");
  try {
    const s = getState();
    const result = fn(s);
    db.prepare("UPDATE workspace SET payload=? WHERE id=1").run(
      JSON.stringify(s),
    );
    db.exec("COMMIT");
    return result;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
export function profile() {
  return getState().profile;
}
export async function saveProfile(input: unknown) {
  const p = profileSchema.parse(input);
  return mutate((s) => {
    s.profile = p;
    s.profileVersion++;
    return s.profile;
  });
}
export async function saveSettings(input: unknown) {
  const p = settingsSchema.parse(input);
  return mutate((s) => {
    s.settings = p;
    return s.settings;
  });
}
export async function addResume(
  meta: Omit<Resume, "id" | "version" | "createdAt">,
  sourcePath: string,
) {
  const id = randomUUID(),
    fileName = id + extname(sourcePath);
  await copyFile(sourcePath, join(FILE_DIR, fileName));
  return mutate((s) => {
    const r = {
      ...meta,
      id,
      fileName,
      version:
        1 +
        Math.max(
          0,
          ...s.resumes
            .filter((r) => r.name === meta.name)
            .map((r) => r.version),
        ),
      createdAt: new Date().toISOString(),
    };
    s.resumes.push(r);
    return r;
  });
}
function newTask(
  s: State,
  input: {
    company: string;
    role: string;
    url: string;
    companyType: string;
    jobDescription: string;
    resumeId: string;
  },
): Task {
  const r = s.resumes.find((x) => x.id === input.resumeId);
  if (!r) throw new Error("resume_not_found");
  const now = new Date().toISOString();
  return {
    ...input,
    id: randomUUID(),
    resumeSnapshot: structuredClone(r),
    profileSnapshot: structuredClone(s.profile),
    profileVersion: s.profileVersion,
    settingsSnapshot: structuredClone(s.settings),
    status: "ready",
    createdAt: now,
    updatedAt: now,
    revision: 0,
    fields: [],
    checkpoints: [],
    scopeComplete: false,
    saveState: "not_attempted",
  };
}
export async function createTask(input: Parameters<typeof newTask>[1]) {
  return mutate((s) => {
    const t = newTask(s, input);
    s.tasks.push(t);
    return t;
  });
}
export async function requestTabScan() {
  return mutate((s) => {
    const pending = s.scanRequests.find(
      (r) => r.status === "requested" || r.status === "claimed",
    );
    if (pending) return pending;
    const now = new Date().toISOString();
    const req: ScanRequest = {
      id: randomUUID(),
      status: "requested",
      createdAt: now,
      updatedAt: now,
    };
    s.scanRequests.push(req);
    return req;
  });
}
export async function claimTabScan() {
  return mutate((s) => {
    const req = s.scanRequests.find((r) => r.status === "requested");
    if (!req) return { request: null };
    req.status = "claimed";
    req.updatedAt = new Date().toISOString();
    return { request: req };
  });
}
export async function completeTabScan(id: string, input: unknown) {
  const pages = z.array(discoveredPageSchema).max(100).parse(input);
  return mutate((s) => {
    const req = s.scanRequests.find((r) => r.id === id);
    if (!req || req.status !== "claimed") throw new Error("scan_not_claimed");
    const now = new Date().toISOString(),
      seen = new Set<string>();
    for (const p of pages) {
      if (seen.has(p.tabId)) throw new Error("duplicate_tab");
      seen.add(p.tabId);
      const existing = s.webPages.find(
        (x) => x.url === p.url && x.tabId === p.tabId,
      );
      if (existing) Object.assign(existing, p, { scanId: id, detectedAt: now });
      else
        s.webPages.push({
          ...p,
          id: randomUUID(),
          scanId: id,
          detectedAt: now,
        });
    }
    req.status = "completed";
    req.updatedAt = now;
    req.tabCount = pages.length;
    return { request: req, pages: s.webPages.filter((p) => p.scanId === id) };
  });
}
export async function bindWebPage(pageId: string, resumeId: string) {
  return mutate((s) => {
    const p = s.webPages.find((x) => x.id === pageId);
    if (!p) throw new Error("page_not_found");
    if (p.pageState !== "ready") throw new Error("page_not_ready");
    const existing = s.tasks.find((t) => t.id === p.taskId);
    if (existing) {
      if (existing.resumeId === resumeId) return existing;
      throw new Error("task_already_bound");
    }
    const t = newTask(s, {
      company: p.company || p.title || new URL(p.url).hostname,
      role: p.role || p.title,
      url: p.url,
      companyType: p.companyType,
      jobDescription: "",
      resumeId,
    });
    s.tasks.push(t);
    p.taskId = t.id;
    return t;
  });
}
export async function cancelTabScan(id: string) {
  return mutate((s) => {
    const r = s.scanRequests.find((x) => x.id === id);
    if (!r || r.status === "completed") throw new Error("invalid_scan_state");
    r.status = "cancelled";
    r.updatedAt = new Date().toISOString();
    return r;
  });
}
export async function updateTask(
  id: string,
  patch: Partial<
    Pick<
      Task,
      "status" | "fields" | "checkpoints" | "scopeComplete" | "saveState"
    >
  >,
) {
  return mutate((s) => {
    const t = s.tasks.find((x) => x.id === id);
    if (!t) throw new Error("task_not_found");
    if (patch.fields) {
      patch.fields = patch.fields.map((f) => fieldSchema.parse(f));
      const keys = new Set<string>();
      for (const f of patch.fields) {
        if (keys.has(f.key)) throw new Error("duplicate_field");
        keys.add(f.key);
        if (
          f.generated &&
          (f.kind !== "subjective" || !t.settingsSnapshot.autoWriteSubjective)
        )
          throw new Error("generation_not_allowed");
        if (
          f.matchMode === "equivalent" &&
          (!t.settingsSnapshot.fuzzyMatchObjective ||
            f.kind !== "objective" ||
            !f.originalValue.trim() ||
            !f.matchReason.trim())
        )
          throw new Error("matching_not_allowed");
      }
    }
    Object.assign(t, patch, {
      updatedAt: new Date().toISOString(),
      revision: t.revision + 1,
    });
    return t;
  });
}
export async function deleteResume(id: string) {
  return mutate((s) => {
    if (s.tasks.some((t) => t.resumeId === id))
      throw new Error("resume_in_use");
    s.resumes = s.resumes.filter((r) => r.id !== id);
    return true;
  });
}
export function filePath(name: string) {
  if (basename(name) !== name || name === "." || name === "..")
    throw new Error("invalid_file_name");
  return join(FILE_DIR, name);
}
export function redactState() {
  const s = getState();
  return {
    ...s,
    resumes: s.resumes.map(({ extractedText, ...r }) => ({
      ...r,
      extractedText: extractedText.slice(0, 1000),
    })),
  };
}
