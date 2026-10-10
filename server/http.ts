import Fastify from "fastify";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import { writeFile, unlink, readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  initStore,
  getState,
  saveProfile,
  saveSettings,
  addResume,
  createTask,
  updateTask,
  deleteResume,
  filePath,
  DATA_DIR,
  redactState,
  requestTabScan,
  cancelTabScan,
  bindWebPage,
} from "./store.js";
import {
  settingsSchema,
  profileSchema,
  taskInputSchema,
} from "../shared/model.js";
const app = Fastify({ logger: false });
await initStore();
await app.register(multipart, {
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
});
await app.register(fastifyStatic, {
  root: join(process.cwd(), "dist/web"),
  wildcard: false,
});
function jsonError(error: unknown) {
  const e = error as { issues?: unknown[]; message?: string };
  return {
    error: e.issues ? "validation_error" : e.message || "request_failed",
    details: e.issues,
  };
}
app.get("/api/health", async () => ({ ok: true, version: "0.1.0" }));
app.get("/api/state", async () => redactState());
app.post("/api/tab-scans", async () => requestTabScan());
app.post("/api/tab-scans/:id/cancel", async (req, reply) => {
  try {
    return await cancelTabScan((req.params as { id: string }).id);
  } catch (e) {
    return reply.code(400).send(jsonError(e));
  }
});
app.post("/api/web-pages/:id/bind", async (req, reply) => {
  try {
    const body = req.body as { resumeId?: string };
    if (!body?.resumeId) throw new Error("resume_required");
    return await bindWebPage((req.params as { id: string }).id, body.resumeId);
  } catch (e) {
    return reply.code(400).send(jsonError(e));
  }
});
app.put("/api/profile", async (req, reply) => {
  try {
    return await saveProfile(req.body);
  } catch (e) {
    return reply.code(400).send(jsonError(e));
  }
});
app.put("/api/settings", async (req, reply) => {
  try {
    return await saveSettings(req.body);
  } catch (e) {
    return reply.code(400).send(jsonError(e));
  }
});
app.post("/api/resumes", async (req, reply) => {
  try {
    const parts = req.parts();
    let filePathTmp = "";
    let fileMeta:
      | {
          name: string;
          direction: string;
          jobContext: string;
          subjective: string;
          extractedText: string;
        }
      | undefined;
    for await (const part of parts) {
      if (part.type === "file") {
        const tmp = join(
          DATA_DIR,
          `upload-${Date.now()}-${Math.random().toString(16).slice(2)}${part.filename ? "." + part.filename.split(".").pop() : ""}`,
        );
        await writeFile(tmp, await part.toBuffer());
        filePathTmp = tmp;
      } else {
        fileMeta ??= {
          name: "",
          direction: "",
          jobContext: "",
          subjective: "",
          extractedText: "",
        };
        if (part.fieldname in fileMeta)
          (fileMeta as any)[part.fieldname] = String(part.value);
      }
    }
    if (!fileMeta?.name || !filePathTmp)
      throw new Error("name_and_file_required");
    const r = await addResume(
      {
        ...fileMeta,
        originalName: fileMeta.name,
        fileName: "",
        extractionStatus: fileMeta.extractedText ? "ok" : "empty",
      },
      filePathTmp,
    );
    await unlink(filePathTmp).catch(() => {});
    return r;
  } catch (e) {
    return reply.code(400).send(jsonError(e));
  }
});
app.post("/api/tasks", async (req, reply) => {
  try {
    const input = taskInputSchema.parse(req.body);
    return await createTask(input);
  } catch (e) {
    return reply.code(400).send(jsonError(e));
  }
});
app.patch("/api/tasks/:id", async (req, reply) => {
  try {
    return await updateTask((req.params as any).id, req.body as any);
  } catch (e) {
    return reply.code(400).send(jsonError(e));
  }
});
app.delete("/api/resumes/:id", async (req, reply) => {
  try {
    return await deleteResume((req.params as any).id);
  } catch (e) {
    return reply.code(400).send(jsonError(e));
  }
});
app.get("/api/files/:file", async (req, reply) => {
  try {
    return reply
      .type("application/octet-stream")
      .send(await readFile(filePath((req.params as any).file)));
  } catch (e) {
    return reply.code(404).send(jsonError(e));
  }
});
app.setNotFoundHandler((req, reply) =>
  req.method === "GET"
    ? reply.sendFile("index.html")
    : reply.code(404).send({ error: "not_found" }),
);
const port = Number(process.env.PORT || 4318);
await app.listen({ port, host: "127.0.0.1" });
console.log(`Resume workspace listening on http://127.0.0.1:${port}`);
