import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  catalog,
  factCount,
  type Field,
  type Profile,
  type Section,
} from "../shared/catalog";
import {
  defaultSettings,
  type Resume,
  type Settings,
  type State,
} from "../shared/model";
import "./styles.css";
import "./styles-overrides.css";
import WebTasks from "./WebTasks";
import { extraLabels } from "./extra-labels";
type Lang = "zh" | "en" | "ja";
const labels: Record<Lang, Record<string, string>> = {
  zh: {
    facts: "公共事实资料",
    resumes: "简历与岗位",
    tasks: "网页任务",
    settings: "执行设置",
    save: "保存",
    saved: "已保存",
    add: "添加一段",
    remove: "删除",
    empty: "暂无资料",
    search: "搜索字段",
    filled: "已填写",
    missing: "空缺",
    uncertain: "有疑问",
    newResume: "上传简历",
    refresh: "刷新任务表",
    scan: "AI 扫描已打开网页",
    scanHint:
      "先由你在 Edge 中完成登录并打开招聘网页，AI 只读取已打开的标签页并生成待处理任务。",
    stepLogin: "人工登录",
    stepOpen: "打开招聘页",
    stepScan: "AI 识别并建表",
    manualBoundary: "登录、验证码和最终提交始终由你控制。",
    readonly: "客观事实（均为可选）",
    subjective: "岗位主观字段由简历变体提供",
    settingsHint: "这些设置会复制到每个网页任务，不会被网页内容覆盖",
    overview: "资料完成度",
    sections: "资料分区",
    factsCount: "项事实",
    records: "段记录",
    fuzzy: "客观事实项使用模糊匹配",
    fuzzyHint:
      "开启后，AI 可在不改变原意的前提下适配网站选项，例如“山西省”→“山西”、“O型血”→“O型”。会记录原值、选项和匹配理由。",
    auto: "自动撰写未匹配的主观字段",
    autoHint: "只对岗位相关主观字段生效；客观事实永不生成",
    draft: "允许保存草稿",
    submit: "允许最终提交",
    overwrite: "允许覆盖网页已有内容",
    upload: "自动上传附件",
    maxRetries: "失败重试次数",
    language: "界面语言",
    report: "查看报告",
    generated: "由已打开网页生成",
    noResume: "请先上传至少一份简历",
  },
  en: {
    facts: "Public facts",
    resumes: "Resumes & roles",
    tasks: "Web tasks",
    settings: "Execution settings",
    save: "Save",
    saved: "Saved",
    add: "Add entry",
    remove: "Remove",
    empty: "No data yet",
    search: "Search fields",
    filled: "Filled",
    missing: "Missing",
    uncertain: "Uncertain",
    newResume: "Upload resume",
    refresh: "Refresh task table",
    scan: "AI scan open pages",
    scanHint:
      "Log in manually in Edge and open recruitment pages first. AI reads open tabs and creates a reviewable task table.",
    stepLogin: "Log in manually",
    stepOpen: "Open recruitment pages",
    stepScan: "AI identifies and lists",
    manualBoundary:
      "Login, CAPTCHA, and final submission always stay under your control.",
    readonly: "Optional objective facts",
    subjective: "Role-specific subjective fields come from the selected resume",
    settingsHint:
      "These settings are snapshotted into each web task and cannot be overridden by page content",
    overview: "Profile completion",
    sections: "Fact sections",
    factsCount: "facts",
    records: "records",
    fuzzy: "Fuzzy match objective facts",
    fuzzyHint:
      "When enabled, AI may adapt semantically equivalent website options without changing meaning, and records the source, selected label, and reason.",
    auto: "Draft unmatched subjective fields",
    autoHint:
      "Only for role-specific subjective fields; objective facts are never invented",
    draft: "Allow saving drafts",
    submit: "Allow final submission",
    overwrite: "Allow overwriting existing values",
    upload: "Upload attachments automatically",
    maxRetries: "Max retries",
    language: "Interface language",
    report: "View report",
    generated: "Created from open pages",
    noResume: "Upload at least one resume first",
  },
  ja: {
    facts: "共通事実情報",
    resumes: "履歴書・職種",
    tasks: "Webタスク",
    settings: "実行設定",
    save: "保存",
    saved: "保存済み",
    add: "追加",
    remove: "削除",
    empty: "まだ情報がありません",
    search: "項目を検索",
    filled: "入力済み",
    missing: "空欄",
    uncertain: "要確認",
    newResume: "履歴書をアップロード",
    refresh: "タスク表を更新",
    scan: "開いているページをAIでスキャン",
    scanHint:
      "Edgeで先に手動ログインし、求人ページを開いてください。AIは開いているタブだけを読み、確認用タスク表を作成します。",
    stepLogin: "手動ログイン",
    stepOpen: "求人ページを開く",
    stepScan: "AIが識別・一覧化",
    manualBoundary: "ログイン、CAPTCHA、最終送信は常にユーザーが操作します。",
    readonly: "任意の客観的事実",
    subjective: "職種別の主観項目は選択した履歴書から提供",
    settingsHint: "設定は各Webタスクに保存され、ページ内容で上書きされません",
    overview: "情報の完成度",
    sections: "情報カテゴリ",
    factsCount: "件の事実",
    records: "件の記録",
    fuzzy: "客観的事実のあいまい一致",
    fuzzyHint:
      "有効にすると、意味を変えずに求人サイトの選択肢へ適応し、元の値・選択肢・理由を記録します。",
    auto: "未一致の主観項目を下書き",
    autoHint: "職種別の主観項目のみ。客観的事実は生成しません",
    draft: "下書き保存を許可",
    submit: "最終送信を許可",
    overwrite: "既存値の上書きを許可",
    upload: "添付ファイルを自動アップロード",
    maxRetries: "最大リトライ回数",
    language: "表示言語",
    report: "レポートを見る",
    generated: "開いているページから作成",
    noResume: "先に履歴書を1件以上アップロードしてください",
  },
};
const tr = (l: Lang, k: string) =>
  (extraLabels[l] as Record<string, string>)[k] || labels[l][k] || k;
const label = (l: Lang, v: { zh: string; en: string; ja: string }) => v[l];
const emptyState: State = {
  profile: {
    sections: Object.fromEntries(
      catalog.map((s) => [s.id, s.repeated ? [] : [{ id: s.id, values: {} }]]),
    ),
  },
  profileVersion: 1,
  settings: defaultSettings,
  resumes: [],
  tasks: [],
  scanRequests: [],
  webPages: [],
};
async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!r.ok)
    throw new Error(
      (await r.json().catch(() => ({}))).error || "request_failed",
    );
  return r.json();
}
function FieldInput({
  field,
  value,
  lang,
  onChange,
}: {
  field: Field;
  value: string;
  lang: Lang;
  onChange: (v: string) => void;
}) {
  return (
    <label className="field">
      <span>{label(lang, field.label)}</span>
      {field.type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
        />
      ) : field.type === "select" ? (
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {label(lang, o.label)}
            </option>
          ))}
        </select>
      ) : (
        <div className="input-wrap">
          <input
            type={
              field.type === "number"
                ? "number"
                : field.type === "date"
                  ? "date"
                  : field.type === "email"
                    ? "email"
                    : field.type === "tel"
                      ? "tel"
                      : "text"
            }
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          {field.unit && <small>{field.unit}</small>}
        </div>
      )}
    </label>
  );
}
function SectionEditor({
  section,
  records,
  lang,
  open,
  onToggle,
  onChange,
}: {
  section: Section;
  records: { id: string; values: Record<string, string> }[];
  lang: Lang;
  open: boolean;
  onToggle: () => void;
  onChange: (v: { id: string; values: Record<string, string> }[]) => void;
}) {
  const set = (i: number, key: string, v: string) =>
    onChange(
      records.map((r, j) =>
        j === i ? { ...r, values: { ...r.values, [key]: v } } : r,
      ),
    );
  const count = records.reduce(
    (n, r) => n + Object.values(r.values).filter(Boolean).length,
    0,
  );
  return (
    <section className={"data-section " + (open ? "is-open" : "")}>
      <button className="section-heading" onClick={onToggle}>
        <div>
          <h3>{label(lang, section.label)}</h3>
          <span>
            {count} {tr(lang, "factsCount")} · {records.length}{" "}
            {tr(lang, "records")}
          </span>
        </div>
        <span className="section-chevron">{open ? "−" : "＋"}</span>
      </button>
      {open && (
        <div className="section-body">
          {records.length === 0 ? (
            <div className="empty-record">
              <p>{tr(lang, "empty")}</p>
              {section.repeated && (
                <button
                  className="secondary"
                  onClick={() =>
                    onChange([{ id: crypto.randomUUID(), values: {} }])
                  }
                >
                  ＋ {tr(lang, "add")}
                </button>
              )}
            </div>
          ) : (
            records.map((r, i) => (
              <div className="record" key={r.id}>
                <div className="record-title">
                  {section.repeated
                    ? label(lang, section.label) + " " + (i + 1)
                    : ""}
                  {section.repeated && (
                    <button
                      className="icon-button danger"
                      onClick={() =>
                        onChange(records.filter((_, j) => j !== i))
                      }
                    >
                      {tr(lang, "remove")}
                    </button>
                  )}
                </div>
                <div className="field-grid">
                  {section.fields.map((f) => (
                    <FieldInput
                      key={f.id}
                      field={f}
                      lang={lang}
                      value={r.values[f.id] || ""}
                      onChange={(v) => set(i, f.id, v)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
          {section.repeated && records.length > 0 && (
            <button
              className="add-entry"
              onClick={() =>
                onChange([...records, { id: crypto.randomUUID(), values: {} }])
              }
            >
              ＋ {tr(lang, "add")}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
function Facts({
  state,
  setState,
  lang,
}: {
  state: State;
  setState: React.Dispatch<React.SetStateAction<State>>;
  lang: Lang;
}) {
  const [q, setQ] = useState("");
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState<string | null>("identity");
  const visible = useMemo(
    () =>
      catalog.filter(
        (s) =>
          !q ||
          label(lang, s.label).toLowerCase().includes(q.toLowerCase()) ||
          s.fields.some((f) =>
            label(lang, f.label).toLowerCase().includes(q.toLowerCase()),
          ),
      ),
    [q, lang],
  );
  const save = async () => {
    const p = await api<Profile>("/api/profile", {
      method: "PUT",
      body: JSON.stringify(state.profile),
    });
    setState((s) => ({
      ...s,
      profile: p,
      profileVersion: s.profileVersion + 1,
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 1400);
  };
  const total = catalog.flatMap((s) => s.fields).length;
  const counts = catalog.map((s) => ({
    s,
    count: (state.profile.sections[s.id] || []).reduce(
      (n, r) => n + Object.values(r.values).filter(Boolean).length,
      0,
    ),
  }));
  return (
    <>
      <div className="page-title">
        <div>
          <p className="kicker">{tr(lang, "factsKicker")}</p>
          <h1>{tr(lang, "facts")}</h1>
          <p>
            {tr(lang, "readonly")} · {factCount(state.profile)}{" "}
            {tr(lang, "factsCount")}
          </p>
        </div>
        <div className="actions">
          <input
            className="search"
            placeholder={tr(lang, "search")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button onClick={save}>
            {saved ? tr(lang, "saved") : tr(lang, "save")}
          </button>
        </div>
      </div>
      <div className="facts-overview">
        <div className="overview-main">
          <span className="overview-label">{tr(lang, "coverage")}</span>
          <strong>{factCount(state.profile)}</strong>
          <span>/ {total}</span>
          <div className="progress-track">
            <i
              style={{
                width:
                  Math.min(
                    100,
                    Math.round(
                      (factCount(state.profile) / Math.max(1, total)) * 100,
                    ),
                  ) + "%",
              }}
            />
          </div>
        </div>
        <div className="overview-categories">
          <span className="overview-label">{tr(lang, "sections")}</span>
          <div className="category-pills">
            {counts.map(({ s, count }) => (
              <button
                key={s.id}
                onClick={() => {
                  setOpen(s.id);
                  document
                    .getElementById("section-" + s.id)
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <b>{label(lang, s.label)}</b>
                <small>{count}</small>
              </button>
            ))}
          </div>
        </div>
      </div>
      {visible.map((s) => (
        <div id={"section-" + s.id} key={s.id}>
          <SectionEditor
            section={s}
            records={state.profile.sections[s.id] || []}
            lang={lang}
            open={open === s.id || Boolean(q)}
            onToggle={() => setOpen(open === s.id ? null : s.id)}
            onChange={(records) =>
              setState((x) => ({
                ...x,
                profile: {
                  ...x.profile,
                  sections: { ...x.profile.sections, [s.id]: records },
                },
              }))
            }
          />
        </div>
      ))}
    </>
  );
}
function Resumes({
  state,
  setState,
  lang,
}: {
  state: State;
  setState: React.Dispatch<React.SetStateAction<State>>;
  lang: Lang;
}) {
  const [form, setForm] = useState({
    name: "",
    direction: "",
    jobContext: "",
    subjective: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [show, setShow] = useState(false);
  const upload = async () => {
    if (!file || !form.name) return;
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    fd.append("file", file);
    const r = await fetch("/api/resumes", { method: "POST", body: fd });
    if (!r.ok) throw new Error("upload_failed");
    const resume = await r.json();
    setState((s) => ({ ...s, resumes: [...s.resumes, resume] }));
    setShow(false);
    setForm({ name: "", direction: "", jobContext: "", subjective: "" });
    setFile(null);
  };
  return (
    <>
      <div className="page-title">
        <div>
          <p className="kicker">{tr(lang, "resumesKicker")}</p>
          <h1>{tr(lang, "resumes")}</h1>
          <p>{tr(lang, "subjective")}</p>
        </div>
        <button onClick={() => setShow((v) => !v)}>
          ＋ {tr(lang, "newResume")}
        </button>
      </div>
      {show && (
        <div className="panel upload">
          <div className="field-grid">
            <label className="field">
              <span>{tr(lang, "resumeName")}</span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label className="field">
              <span>{tr(lang, "targetDirection")}</span>
              <input
                value={form.direction}
                onChange={(e) =>
                  setForm({ ...form, direction: e.target.value })
                }
              />
            </label>
            <label className="field wide">
              <span>{tr(lang, "roleContext")}</span>
              <textarea
                value={form.jobContext}
                onChange={(e) =>
                  setForm({ ...form, jobContext: e.target.value })
                }
              />
            </label>
            <label className="field wide">
              <span>{tr(lang, "constraints")}</span>
              <textarea
                value={form.subjective}
                onChange={(e) =>
                  setForm({ ...form, subjective: e.target.value })
                }
              />
            </label>
            <label className="field wide">
              <span>{tr(lang, "resumeFile")}</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>
          <button onClick={upload} disabled={!file || !form.name}>
            {tr(lang, "save")}
          </button>
        </div>
      )}
      <div className="resume-grid">
        {state.resumes.map((r: Resume) => (
          <article className="resume-card" key={r.id}>
            <div className="resume-icon">CV</div>
            <div>
              <h3>{r.name}</h3>
              <p>{r.direction || "—"}</p>
              <small>
                v{r.version} · {new Date(r.createdAt).toLocaleDateString()}
              </small>
            </div>
          </article>
        ))}
        {state.resumes.length === 0 && (
          <p className="muted">{tr(lang, "empty")}</p>
        )}
      </div>
    </>
  );
}
function SettingsPage({
  state,
  setState,
  lang,
}: {
  state: State;
  setState: React.Dispatch<React.SetStateAction<State>>;
  lang: Lang;
}) {
  const [saved, setSaved] = useState(false);
  const save = async () => {
    const x = await api<Settings>("/api/settings", {
      method: "PUT",
      body: JSON.stringify(state.settings),
    });
    setState((s) => ({ ...s, settings: x }));
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };
  const checks: [keyof Settings, string, string][] = [
    ["autoWriteSubjective", "auto", "autoHint"],
    ["fuzzyMatchObjective", "fuzzy", "fuzzyHint"],
    ["allowDraftSave", "draft", ""],
    ["allowSubmit", "submit", ""],
    ["overwriteExisting", "overwrite", ""],
    ["uploadAttachments", "upload", ""],
  ];
  return (
    <>
      <div className="page-title">
        <div>
          <p className="kicker">{tr(lang, "settingsKicker")}</p>
          <h1>{tr(lang, "settings")}</h1>
          <p>{tr(lang, "settingsHint")}</p>
        </div>
        <button onClick={save}>
          {saved ? tr(lang, "saved") : tr(lang, "save")}
        </button>
      </div>
      <div className="panel settings-list">
        {checks.map(([key, title, hint]) => (
          <label
            className={
              "setting " +
              (key === "fuzzyMatchObjective" ? "featured-setting" : "")
            }
            key={key}
          >
            <span>
              <b>{tr(lang, title)}</b>
              <small>{hint ? tr(lang, hint) : ""}</small>
            </span>
            <input
              type="checkbox"
              checked={Boolean(state.settings[key])}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  settings: { ...s.settings, [key]: e.target.checked },
                }))
              }
            />
          </label>
        ))}
        <label className="setting">
          <span>
            <b>{tr(lang, "maxRetries")}</b>
          </span>
          <input
            className="small-number"
            type="number"
            min="0"
            max="5"
            value={state.settings.maxRetries}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                settings: { ...s.settings, maxRetries: Number(e.target.value) },
              }))
            }
          />
        </label>
        <label className="setting">
          <span>
            <b>{tr(lang, "language")}</b>
          </span>
          <select
            value={lang}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                settings: { ...s.settings, language: e.target.value as Lang },
              }))
            }
          >
            <option value="zh">中文</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
          </select>
        </label>
      </div>
    </>
  );
}
function App() {
  const [state, setState] = useState<State>(emptyState);
  const [page, setPage] = useState<"facts" | "resumes" | "tasks" | "settings">(
    "facts",
  );
  const [lang, setLang] = useState<Lang>("zh");
  const [error, setError] = useState("");
  useEffect(() => {
    api<State>("/api/state")
      .then((s) => {
        setState(s);
        setLang(s.settings.language);
      })
      .catch((e) => setError(e.message));
  }, []);
  const nav: [typeof page, string][] = [
    ["facts", "facts"],
    ["resumes", "resumes"],
    ["tasks", "tasks"],
    ["settings", "settings"],
  ];
  return (
    <div className="app">
      <aside>
        <div className="brand">
          <div className="brand-mark">RW</div>
          <div>
            <b>
              Resume
              <br />
              Workspace
            </b>
            <small>{tr(lang, "brandHint")}</small>
          </div>
        </div>
        <nav>
          {nav.map(([id, k]) => (
            <button
              className={page === id ? "active" : ""}
              onClick={() => setPage(id)}
              key={id}
            >
              <span className={"nav-icon " + id} />
              {tr(lang, k)}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">v0.1 · {tr(lang, "workspaceHint")}</div>
      </aside>
      <main>
        <header>
          <span className="eyebrow">{tr(lang, "header")}</span>
          <div className="header-actions">
            <button
              className="lang-button"
              onClick={() =>
                setLang((l) => (l === "zh" ? "en" : l === "en" ? "ja" : "zh"))
              }
            >
              {lang.toUpperCase()}
            </button>
            <div className="avatar">RW</div>
          </div>
        </header>
        <div className="content">
          {error && <div className="error">{error}</div>}
          {page === "facts" && (
            <Facts state={state} setState={setState} lang={lang} />
          )}{" "}
          {page === "resumes" && (
            <Resumes state={state} setState={setState} lang={lang} />
          )}{" "}
          {page === "tasks" && (
            <WebTasks state={state} setState={setState} lang={lang} />
          )}{" "}
          {page === "settings" && (
            <SettingsPage state={state} setState={setState} lang={lang} />
          )}
        </div>
      </main>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
