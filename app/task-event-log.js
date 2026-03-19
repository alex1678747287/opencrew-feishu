const EVENT_LOG_HEADINGS = ["## Event Log", "## \u4e8b\u4ef6\u65e5\u5fd7"];
const DEFAULT_REDUCED_FIELDS = ["state", "owner", "humanGate"];

function normalizeNewlines(value) {
  return String(value || "").replace(/\r\n/g, "\n");
}

function normalizeInline(value, fallback = "") {
  const normalized = String(value ?? fallback)
    .replace(/\r?\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized || String(fallback || "").trim();
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.map((item) => normalizeInline(item)).filter(Boolean)));
  }

  return Array.from(
    new Set(
      String(value || "")
        .split(/\r?\n|[,;\uFF0C\uFF1B]/)
        .map((item) => normalizeInline(item))
        .filter(Boolean)
        .filter((item) => item.toLowerCase() !== "none")
    )
  );
}

function serializeTaskEvent(event) {
  return JSON.stringify(event);
}

function parseTaskEventLogSection(section) {
  return normalizeNewlines(section)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith("_"))
    .map((line, index) => {
      try {
        const parsed = JSON.parse(line);
        return {
          ...parsed,
          ts: normalizeInline(parsed.ts),
          mode: normalizeInline(parsed.mode, "unknown"),
          summary: normalizeInline(parsed.summary, ""),
          index
        };
      } catch (error) {
        return {
          ts: "",
          mode: "invalid",
          summary: line,
          raw: line,
          invalid: true,
          index
        };
      }
    });
}

function reduceTaskEventSnapshot(baseSnapshot, eventLog, options = {}) {
  const reduceFields = new Set(
    Array.isArray(options.reduceFields) && options.reduceFields.length > 0
      ? options.reduceFields
      : DEFAULT_REDUCED_FIELDS
  );
  const preferHeaderSnapshot = options.preferHeaderSnapshot === true;
  const normalizedBase = {
    ...baseSnapshot,
    type: normalizeInline(baseSnapshot.type, "A"),
    priority: normalizeInline(baseSnapshot.priority, "P2"),
    owner: normalizeInline(baseSnapshot.owner, "HQ(CoS)"),
    goal: normalizeInline(baseSnapshot.goal),
    acceptance: normalizeInline(baseSnapshot.acceptance, "Define a clear done condition"),
    dependsOn: normalizeList(baseSnapshot.dependsOn),
    humanGate: normalizeInline(baseSnapshot.humanGate, "none") || "none",
    state: normalizeInline(baseSnapshot.state, "triage") || "triage"
  };
  const snapshot = {
    ...normalizedBase,
    source: "header",
    lastEvent: null
  };

  for (const event of Array.isArray(eventLog) ? eventLog : []) {
    if (!event || event.invalid) {
      continue;
    }

    if (reduceFields.has("type") && event.type) snapshot.type = normalizeInline(event.type, snapshot.type);
    if (reduceFields.has("priority") && event.priority) snapshot.priority = normalizeInline(event.priority, snapshot.priority);
    if (reduceFields.has("owner") && event.owner) snapshot.owner = normalizeInline(event.owner, snapshot.owner);
    if (reduceFields.has("goal") && event.goal) snapshot.goal = normalizeInline(event.goal, snapshot.goal);
    if (reduceFields.has("acceptance") && event.acceptance) snapshot.acceptance = normalizeInline(event.acceptance, snapshot.acceptance);
    if (reduceFields.has("dependsOn") && Array.isArray(event.dependsOn)) snapshot.dependsOn = normalizeList(event.dependsOn);
    if (reduceFields.has("humanGate") && event.humanGate) snapshot.humanGate = normalizeInline(event.humanGate, snapshot.humanGate) || "none";
    if (reduceFields.has("state") && event.state) snapshot.state = normalizeInline(event.state, snapshot.state) || "triage";

    snapshot.source = "event-log";
    snapshot.lastEvent = event;
  }

  if (preferHeaderSnapshot && snapshot.source === "event-log") {
    for (const field of reduceFields) {
      snapshot[field] = normalizedBase[field];
    }
    snapshot.source = "header-pending";
  }

  return snapshot;
}

module.exports = {
  EVENT_LOG_HEADINGS,
  normalizeList,
  parseTaskEventLogSection,
  reduceTaskEventSnapshot,
  serializeTaskEvent
};
