import test from "node:test";
import assert from "node:assert/strict";
import { emptyProfile, catalog, factCount } from "../shared/catalog.js";
import { profileSchema, settingsSchema, fieldSchema } from "../shared/model.js";
import { matchObjectiveOption } from "../shared/matching.js";

test("catalog contains detailed optional repeated facts", () => {
  const p = emptyProfile();
  assert.equal(catalog.find((s) => s.id === "education")?.repeated, true);
  assert.equal(catalog.find((s) => s.id === "awards")?.repeated, true);
  assert.equal(factCount(p), 0);
  assert.ok(catalog.flatMap((s) => s.fields).some((f) => f.id === "religion"));
});
test("profile schema accepts empty optional records and rejects invalid select", () => {
  const p = emptyProfile();
  assert.doesNotThrow(() => profileSchema.parse(p));
  p.sections.education.push({
    id: "edu-1",
    values: { studyMode: "not-a-mode" },
  });
  assert.throws(() => profileSchema.parse(p));
});
test("filled report requires evidence and verification", () => {
  const base = {
    key: "email",
    label: "Email",
    section: "Contact",
    pageUrl: "https://example.com/form",
    component: "text",
    kind: "objective",
    required: true,
    status: "filled",
    value: "a@example.com",
    source: "facts",
    generated: false,
    verified: true,
    reason: "",
    evidence: "fresh value read",
  } as const;
  assert.doesNotThrow(() => fieldSchema.parse(base));
  assert.throws(() => fieldSchema.parse({ ...base, evidence: "" }));
});
test("settings default blocks submit and subjective generation", () => {
  const s = settingsSchema.parse({});
  assert.equal(s.allowSubmit, false);
  assert.equal(s.autoWriteSubjective, false);
  assert.equal(s.fuzzyMatchObjective, false);
});
test("objective fuzzy matching stays meaning-preserving and opt-in", () => {
  const exact = matchObjectiveOption(
    "山西",
    ["山西", "陕西"],
    "province",
    false,
  );
  assert.equal(exact.status, "matched");
  const equivalent = matchObjectiveOption(
    "山西省",
    ["山西", "陕西"],
    "province",
    true,
  );
  assert.equal(equivalent.selectedLabel, "山西");
  assert.equal(equivalent.mode, "equivalent");
  const disabled = matchObjectiveOption(
    "O型血",
    ["O型", "A型"],
    "bloodType",
    false,
  );
  assert.equal(disabled.status, "uncertain");
  const health = matchObjectiveOption(
    "身体健康",
    ["健康", "不健康"],
    "healthStatus",
    true,
  );
  assert.equal(health.selectedLabel, "健康");
});
