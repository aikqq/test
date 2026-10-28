import { readFile, rename, writeFile } from "node:fs/promises";

export const PRIORITIES = ["low", "normal", "high", "urgent"];

function normalizePriority(value = "normal") {
  const priority = String(value).toLowerCase();
  if (!PRIORITIES.includes(priority)) {
    throw new TypeError(`Invalid priority: ${value}. Use low, normal, high, or urgent.`);
  }
  return priority;
}

function normalizeTags(value = []) {
  const tags = Array.isArray(value) ? value : String(value).split(",");
  return [...new Set(tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean))].sort();
}

function normalizeDueDate(value) {
  if (value === null || value === undefined || value === "") return null;
  const dueDate = String(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || Number.isNaN(Date.parse(`${dueDate}T00:00:00Z`))) {
    throw new TypeError(`Invalid due date: ${value}. Use YYYY-MM-DD.`);
  }
  return dueDate;
}

function withDefaults(task) {
  return {
    ...task,
    priority: PRIORITIES.includes(task.priority) ? task.priority : "normal",
    tags: normalizeTags(task.tags),
    dueDate: normalizeDueDate(task.dueDate),
    updatedAt: task.updatedAt ?? null,
  };
}

export async function loadTasks(filePath) {
  try {
    const data = JSON.parse(await readFile(filePath, "utf8"));
    return Array.isArray(data.tasks) ? data.tasks.map(withDefaults) : [];
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

export async function saveTasks(filePath, tasks) {
  const temporaryPath = `${filePath}.tmp`;
  const document = JSON.stringify({ version: 2, tasks }, null, 2) + "\n";

  await writeFile(temporaryPath, document, "utf8");
  await rename(temporaryPath, filePath);
}

export function addTask(tasks, title, now = new Date(), metadata = {}) {
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
    updatedAt: null,
    priority: normalizePriority(metadata.priority),
    tags: normalizeTags(metadata.tags),
    dueDate: normalizeDueDate(metadata.dueDate),
  };

  return { tasks: [...tasks, task], task };
}

export function editTask(tasks, id, changes, now = new Date()) {
  let task = null;
  const updated = tasks.map((current) => {
    if (current.id !== id) return current;

    const next = {
      ...withDefaults(current),
      ...(changes.title === undefined ? {} : { title: String(changes.title).trim() }),
      ...(changes.priority === undefined ? {} : { priority: normalizePriority(changes.priority) }),
      ...(changes.tags === undefined ? {} : { tags: normalizeTags(changes.tags) }),
      ...(changes.dueDate === undefined ? {} : { dueDate: normalizeDueDate(changes.dueDate) }),
      updatedAt: now.toISOString(),
    };
    if (!next.title) throw new TypeError("Task title is required.");
    task = next;
    return next;
  });

  return { tasks: updated, task, changed: task !== null };
}

export function completeTask(tasks, id, now = new Date()) {
  let changed = false;
  const updated = tasks.map((task) => {
    if (task.id !== id || task.completed) return task;
    changed = true;
    return { ...withDefaults(task), completed: true, completedAt: now.toISOString(), updatedAt: now.toISOString() };
  });

  return { tasks: updated, changed };
}

export function reopenTask(tasks, id, now = new Date()) {
  let changed = false;
  const updated = tasks.map((task) => {
    if (task.id !== id || !task.completed) return task;
    changed = true;
    return { ...withDefaults(task), completed: false, completedAt: null, updatedAt: now.toISOString() };
  });
  return { tasks: updated, changed };
}

export function removeTask(tasks, id) {
  const updated = tasks.filter((task) => task.id !== id);
  return { tasks: updated, changed: updated.length !== tasks.length };
}

export function filterTasks(tasks, state = "open") {
  if (state === "all") return [...tasks];
  if (state === "done") return tasks.filter((task) => task.completed);
  return tasks.filter((task) => !task.completed);
}

function endOfWeek(today) {
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 7);
  return date.toISOString().slice(0, 10);
}

export function queryTasks(tasks, filters = {}) {
  const today = filters.today ?? new Date().toISOString().slice(0, 10);
  let result = filterTasks(tasks.map(withDefaults), filters.state ?? "all");

  if (filters.priority) result = result.filter((task) => task.priority === normalizePriority(filters.priority));
  if (filters.tag) result = result.filter((task) => task.tags.includes(String(filters.tag).toLowerCase()));
  if (filters.search) {
    const query = String(filters.search).toLowerCase();
    result = result.filter((task) => task.title.toLowerCase().includes(query) || task.tags.some((tag) => tag.includes(query)));
  }
  if (filters.due === "overdue") result = result.filter((task) => !task.completed && task.dueDate && task.dueDate < today);
  if (filters.due === "today") result = result.filter((task) => !task.completed && task.dueDate === today);
  if (filters.due === "week") {
    const lastDay = endOfWeek(today);
    result = result.filter((task) => !task.completed && task.dueDate && task.dueDate >= today && task.dueDate <= lastDay);
  }

  const priorityRank = { urgent: 0, high: 1, normal: 2, low: 3 };
  return result.sort((a, b) =>
    Number(a.completed) - Number(b.completed)
    || priorityRank[a.priority] - priorityRank[b.priority]
    || (a.dueDate ?? "9999-12-31").localeCompare(b.dueDate ?? "9999-12-31")
    || a.id.localeCompare(b.id));
}

