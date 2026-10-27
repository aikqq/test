import { readFile, rename, writeFile } from "node:fs/promises";

export async function loadTasks(filePath) {
  try {
    const data = JSON.parse(await readFile(filePath, "utf8"));
    return Array.isArray(data.tasks) ? data.tasks : [];
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

export async function saveTasks(filePath, tasks) {
  const temporaryPath = `${filePath}.tmp`;
  const document = JSON.stringify({ tasks }, null, 2) + "\n";

  await writeFile(temporaryPath, document, "utf8");
  await rename(temporaryPath, filePath);
}

export function addTask(tasks, title, now = new Date()) {
  const normalizedTitle = String(title).trim();
  if (!normalizedTitle) throw new TypeError("Task title is required.");

  const nextNumber = tasks.reduce((largest, task) => {
    const value = Number.parseInt(String(task.id).replace(/^T/, ""), 10);
    return Number.isFinite(value) ? Math.max(largest, value) : largest;
  }, 0) + 1;

  const task = {
    id: `T${String(nextNumber).padStart(4, "0")}`,
    title: normalizedTitle,
    completed: false,
    createdAt: now.toISOString(),
    completedAt: null,
  };

  return { tasks: [...tasks, task], task };
}

export function completeTask(tasks, id, now = new Date()) {
  let changed = false;
  const updated = tasks.map((task) => {
    if (task.id !== id || task.completed) return task;
    changed = true;
    return { ...task, completed: true, completedAt: now.toISOString() };
  });

  return { tasks: updated, changed };
}

export function filterTasks(tasks, state = "open") {
  if (state === "all") return [...tasks];
  if (state === "done") return tasks.filter((task) => task.completed);
  return tasks.filter((task) => !task.completed);
}

