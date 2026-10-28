const PRIORITY_ORDER = ["urgent", "high", "normal", "low"];

export function summarize(tasks, today = new Date().toISOString().slice(0, 10)) {
  const completed = tasks.filter((task) => task.completed).length;
  const total = tasks.length;
  const openTasks = tasks.filter((task) => !task.completed);

  return {
    total,
    open: total - completed,
    completed,
    completionRate: total === 0 ? 0 : Math.round((completed / total) * 100),
    overdue: openTasks.filter((task) => task.dueDate && task.dueDate < today).length,
    dueToday: openTasks.filter((task) => task.dueDate === today).length,
    byPriority: Object.fromEntries(PRIORITY_ORDER.map((priority) => [
      priority,
      openTasks.filter((task) => (task.priority ?? "normal") === priority).length,
    ])),
  };
}

function escapeCell(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

export function toMarkdown(tasks, options = {}) {
  const summary = summarize(tasks, options.today);
  const lines = [
    "# MiniBoard Report",
    "",
    `- Total: ${summary.total}`,
    `- Open: ${summary.open}`,
    `- Completed: ${summary.completed}`,
    `- Completion: ${summary.completionRate}%`,
    `- Overdue: ${summary.overdue}`,
    `- Due today: ${summary.dueToday}`,
    "",
    "| ID | Status | Priority | Tags | Due | Task |",
    "| --- | --- | --- | --- | --- | --- |",
  ];

  for (const task of tasks) {
    lines.push(`| ${escapeCell(task.id)} | ${task.completed ? "Done" : "Open"} | ${escapeCell(task.priority ?? "normal")} | ${escapeCell((task.tags ?? []).join(", ") || "—")} | ${escapeCell(task.dueDate ?? "—")} | ${escapeCell(task.title)} |`);
  }

  if (tasks.length === 0) lines.push("| — | — | — | — | — | No tasks |");
  return lines.join("\n") + "\n";
}

export function toBoard(tasks, today = new Date().toISOString().slice(0, 10)) {
  const openTasks = tasks.filter((task) => !task.completed);
  if (openTasks.length === 0) return "All tasks are complete.";

  const lines = [];
  for (const priority of PRIORITY_ORDER) {
    const group = openTasks.filter((task) => (task.priority ?? "normal") === priority);
    if (group.length === 0) continue;
    lines.push(`${priority.toUpperCase()} (${group.length})`);
    for (const task of group) {
      const tags = (task.tags ?? []).map((tag) => `#${tag}`).join(" ");
      const due = task.dueDate
        ? task.dueDate < today
          ? `OVERDUE ${task.dueDate}`
          : task.dueDate === today
            ? "DUE TODAY"
            : `due ${task.dueDate}`
        : "";
      lines.push(`  - ${task.id} ${task.title}${tags ? ` ${tags}` : ""}${due ? ` [${due}]` : ""}`);
    }
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

