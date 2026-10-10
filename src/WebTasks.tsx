import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { type State } from "../shared/model";
import { extraLabels } from "./extra-labels";
type Lang = "zh" | "en" | "ja";
export default function WebTasks({
  state,
  setState,
  lang,
}: {
  state: State;
  setState: Dispatch<SetStateAction<State>>;
  lang: Lang;
}) {
  const t = (key: string) =>
    (extraLabels[lang] as Record<string, string>)[key] || key;
  const [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [selected, setSelected] = useState<string | null>(null),
    [choices, setChoices] = useState<Record<string, string>>({});
  async function call(path: string, body?: unknown) {
    const r = await fetch(
      path,
      body === undefined
        ? undefined
        : {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          },
    );
    if (!r.ok) throw new Error("request_failed");
    return r.json();
  }
  const refreshTasks = async () => {
    const latest: State = await call("/api/state");
    setState((s) => ({
      ...s,
      tasks: latest.tasks,
      webPages: latest.webPages,
      scanRequests: latest.scanRequests,
    }));
  };
  useEffect(() => {
    let active = true;
    const timer = setInterval(() => {
      call("/api/state")
        .then((latest: State) => {
          if (active)
            setState((s) => ({
              ...s,
              tasks: latest.tasks,
              webPages: latest.webPages,
              scanRequests: latest.scanRequests,
            }));
        })
        .catch(() => {});
    }, 2500);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [setState]);
  async function act(fn: () => Promise<void>) {
    setError("");
    try {
      await fn();
    } catch {
      setError(t("error"));
    }
  }
  const pending = state.scanRequests.find(
    (r) => r.status === "requested" || r.status === "claimed",
  );
  return (
    <>
      <div className="page-title">
        <div>
          <p className="kicker">{t("tasksKicker")}</p>
          <h1>{t("tasks")}</h1>
          <p>{t("scanHint")}</p>
        </div>
        <div className="actions">
          <button className="secondary" onClick={() => act(refreshTasks)}>
            {t("refresh")}
          </button>
          <button
            disabled={Boolean(pending)}
            onClick={() =>
              act(async () => {
                await call("/api/tab-scans", {});
                setMessage(t("scanHandoff"));
                await refreshTasks();
              })
            }
          >
            ✦ {t("scan")}
          </button>
        </div>
      </div>
      <div className="scan-flow">
        <div>
          <b>01</b>
          <span>
            {lang === "zh"
              ? "人工登录"
              : lang === "ja"
                ? "手動ログイン"
                : "Manual login"}
          </span>
        </div>
        <i>→</i>
        <div>
          <b>02</b>
          <span>
            {lang === "zh"
              ? "AI 扫描"
              : lang === "ja"
                ? "AIスキャン"
                : "AI scan"}
          </span>
        </div>
        <i>→</i>
        <div>
          <b>03</b>
          <span>{t("resume")}</span>
        </div>
      </div>
      {error && (
        <div role="alert" className="error">
          {error}
        </div>
      )}
      {(message || pending) && (
        <div className="scan-notice">
          <strong>
            {pending
              ? t(pending.status === "requested" ? "queued" : "claimed")
              : t("scanDone")}
          </strong>
          <p>{message || t("scanHandoff")}</p>
          {pending && (
            <button
              className="secondary"
              onClick={() =>
                act(async () => {
                  await call("/api/tab-scans/" + pending.id + "/cancel", {});
                  setMessage("");
                  await refreshTasks();
                })
              }
            >
              {t("cancelScan")}
            </button>
          )}
        </div>
      )}
      <div className="page-table-wrap">
        <table className="page-table">
          <thead>
            <tr>
              <th>{t("company")}</th>
              <th>{t("role")}</th>
              <th>{t("pageStatus")}</th>
              <th>{t("resume")}</th>
            </tr>
          </thead>
          <tbody>
            {state.webPages.map((p) => (
              <tr key={p.id}>
                <td>
                  <b>{p.company || p.title}</b>
                  <small>{new URL(p.url).hostname}</small>
                  <details>
                    <summary>{t("evidence")}</summary>
                    <p>{p.evidence}</p>
                  </details>
                </td>
                <td>{p.role || "—"}</td>
                <td>
                  <span className={"page-badge " + p.pageState}>
                    {t(p.pageState)}
                  </span>
                </td>
                <td>
                  {p.taskId ? (
                    <span>
                      {state.tasks.find((x) => x.id === p.taskId)
                        ?.resumeSnapshot.name || t("runReady")}
                    </span>
                  ) : (
                    <div className="binding">
                      <select
                        aria-label={t("resume") + " " + p.title}
                        value={choices[p.id] || ""}
                        onChange={(e) =>
                          setChoices((c) => ({ ...c, [p.id]: e.target.value }))
                        }
                      >
                        <option value="">{t("resume")}</option>
                        {state.resumes.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                      <button
                        disabled={!choices[p.id] || p.pageState !== "ready"}
                        onClick={() =>
                          act(async () => {
                            await call("/api/web-pages/" + p.id + "/bind", {
                              resumeId: choices[p.id],
                            });
                            await refreshTasks();
                          })
                        }
                      >
                        {t("bind")}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!state.webPages.length && <p className="muted">{t("noPages")}</p>}
      </div>
      <div className="task-list">
        {state.tasks.map((task) => (
          <article className="task-card" key={task.id}>
            <div>
              <h3>
                {task.company} · {task.role}
              </h3>
              <p>
                {t(task.status)} · {task.resumeSnapshot.name}
              </p>
              <small>{task.url}</small>
              {selected === task.id && (
                <div className="report">
                  <small>
                    {t("saveState")}: {t(task.saveState)} ·{" "}
                    {t(
                      task.scopeComplete ? "scopeComplete" : "scopeIncomplete",
                    )}
                  </small>
                  {(["filled", "uncertain", "missing"] as const).map(
                    (group) => (
                      <div key={group} className="report-group">
                        <h4>
                          {group === "uncertain"
                            ? lang === "zh"
                              ? "有疑问"
                              : lang === "ja"
                                ? "要確認"
                                : "Uncertain"
                            : t(group)}{" "}
                          (
                          {task.fields.filter((f) => f.status === group).length}
                          )
                        </h4>
                        {task.fields
                          .filter((f) => f.status === group)
                          .map((f) => (
                            <div className="report-item" key={f.key}>
                              <b>
                                {f.section} / {f.label}
                              </b>
                              <p>{f.value || f.reason}</p>
                              {f.originalValue && (
                                <p>
                                  {t("original")}: {f.originalValue}
                                </p>
                              )}
                              <small>
                                {f.matchReason || f.evidence || f.reason}
                              </small>
                            </div>
                          ))}
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
            <button
              className="secondary"
              onClick={() => setSelected(selected === task.id ? null : task.id)}
            >
              {t("report")}
            </button>
          </article>
        ))}
      </div>
    </>
  );
}
