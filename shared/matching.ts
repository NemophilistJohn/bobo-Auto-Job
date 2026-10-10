export type MatchDomain = "province" | "bloodType" | "healthStatus" | "other";
export interface OptionMatch {
  status: "matched" | "uncertain" | "missing";
  selectedLabel?: string;
  originalValue: string;
  mode: "exact" | "equivalent" | "none";
  reason: string;
}
const provinces = new Set(
  "山西 陕西 山东 河北 河南 湖北 湖南 辽宁 吉林 黑龙江 江苏 浙江 安徽 福建 江西 广东 海南 四川 贵州 云南 青海 甘肃 台湾".split(
    " ",
  ),
);
function canonical(value: string, domain: MatchDomain) {
  const text = value.trim();
  if (domain === "province") {
    const base = text.replace(/省$/, "");
    return provinces.has(base) ? base : text;
  }
  if (domain === "bloodType") {
    const m = /^(A|B|AB|O)(?:型血|型)?$/i.exec(text);
    return m ? m[1].toUpperCase() : text;
  }
  if (domain === "healthStatus" && ["身体健康", "健康"].includes(text))
    return "健康";
  return text;
}
export function matchObjectiveOption(
  value: string,
  options: string[],
  domain: MatchDomain,
  enabled: boolean,
): OptionMatch {
  if (!value.trim())
    return {
      status: "missing",
      originalValue: value,
      mode: "none",
      reason: "missing_fact",
    };
  const exact = options.filter((o) => o === value);
  if (exact.length === 1)
    return {
      status: "matched",
      selectedLabel: exact[0],
      originalValue: value,
      mode: "exact",
      reason: "exact_option",
    };
  if (exact.length > 1)
    return {
      status: "uncertain",
      originalValue: value,
      mode: "none",
      reason: "ambiguous_options",
    };
  if (!enabled)
    return {
      status: "uncertain",
      originalValue: value,
      mode: "none",
      reason: "fuzzy_matching_disabled",
    };
  const matches = options.filter(
    (o) => canonical(o, domain) === canonical(value, domain),
  );
  if (matches.length === 1)
    return {
      status: "matched",
      selectedLabel: matches[0],
      originalValue: value,
      mode: "equivalent",
      reason: "meaning_preserving_" + domain,
    };
  return {
    status: "uncertain",
    originalValue: value,
    mode: "none",
    reason: matches.length ? "ambiguous_options" : "no_verified_equivalent",
  };
}
