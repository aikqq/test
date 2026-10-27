export function summarize(tasks) {
  const completed = tasks.filter((task) => task.completed).length;
  const total = tasks.length;

  return {
    total,
    open: total - completed,
    completed,
    completionRate: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

function escapeCell(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

export function toMarkdown(tasks) {
  const summary = summarize(tasks);
  const lines = [
    "# MiniBoard Report",
    "",
    `- Total: ${summary.total}`,
    `- Open: ${summary.open}`,
    `- Completed: ${summary.completed}`,
    `- Completion: ${summary.completionRate}%`,
    "",
    "| ID | Status | Task |",
    "| --- | --- | --- |",
  ];

  for (const task of tasks) {
    lines.push(`| ${escapeCell(task.id)} | ${task.completed ? "Done" : "Open"} | ${escapeCell(task.title)} |`);
  }

  if (tasks.length === 0) lines.push("| — | — | No tasks | ");
  return lines.join("\n") + "\n";
}

