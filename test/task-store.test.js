import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  addTask,
  completeTask,
  editTask,
  filterTasks,
  loadTasks,
  queryTasks,
  removeTask,
  reopenTask,
  saveTasks,
} from "../src/task-store.js";

test("tasks receive stable sequential ids", () => {
  const first = addTask([], "write tests", new Date("2026-01-01T00:00:00Z"));
  const second = addTask(first.tasks, "ship release", new Date("2026-01-02T00:00:00Z"));

  assert.equal(first.task.id, "T0001");
  assert.equal(second.task.id, "T0002");
});

test("task titles are normalized and cannot be empty", () => {
  assert.equal(addTask([], "  trimmed title  ").task.title, "trimmed title");
  assert.throws(() => addTask([], "   "), /Task title is required/);
});

test("tasks can carry planning metadata", () => {
  const result = addTask([], "Ship release", new Date("2026-10-01T00:00:00Z"), {
    priority: "urgent",
    tags: ["Release", "docs", "release"],
    dueDate: "2026-10-30",
  });

  assert.equal(result.task.priority, "urgent");
  assert.deepEqual(result.task.tags, ["docs", "release"]);
  assert.equal(result.task.dueDate, "2026-10-30");
});

test("edits, reopens and removes tasks", () => {
  const original = addTask([], "draft").tasks;
  const edited = editTask(original, "T0001", { title: "final", priority: "high", tags: "docs,release" });
  const completed = completeTask(edited.tasks, "T0001").tasks;
  const reopened = reopenTask(completed, "T0001");
  const removed = removeTask(reopened.tasks, "T0001");

  assert.equal(edited.task.title, "final");
  assert.equal(edited.task.priority, "high");
  assert.deepEqual(edited.task.tags, ["docs", "release"]);
  assert.equal(reopened.tasks[0].completed, false);
  assert.equal(removed.tasks.length, 0);
});

test("rejects invalid metadata", () => {
  assert.throws(() => addTask([], "bad", new Date(), { priority: "maximum" }), /Invalid priority/);
  assert.throws(() => addTask([], "bad", new Date(), { dueDate: "tomorrow" }), /Invalid due date/);
});

test("queries and sorts tasks by planning fields", () => {
  const tasks = [
    addTask([], "Normal work", new Date(), { dueDate: "2026-11-02" }).task,
    { ...addTask([], "Urgent deploy", new Date(), { priority: "urgent", tags: ["release"], dueDate: "2026-10-27" }).task, id: "T0002" },
    { ...addTask([], "High docs", new Date(), { priority: "high", tags: ["docs"], dueDate: "2026-10-30" }).task, id: "T0003" },
  ];

  assert.deepEqual(queryTasks(tasks, { state: "open", today: "2026-10-28" }).map((task) => task.id), ["T0002", "T0003", "T0001"]);
  assert.deepEqual(queryTasks(tasks, { due: "overdue", today: "2026-10-28" }).map((task) => task.id), ["T0002"]);
  assert.deepEqual(queryTasks(tasks, { tag: "docs" }).map((task) => task.id), ["T0003"]);
  assert.deepEqual(queryTasks(tasks, { search: "deploy" }).map((task) => task.id), ["T0002"]);
});

test("completing a task records its completion time", () => {
  const created = addTask([], "review changes").tasks;
  const result = completeTask(created, "T0001", new Date("2026-01-03T12:00:00Z"));

  assert.equal(result.changed, true);
  assert.equal(result.tasks[0].completed, true);
  assert.equal(result.tasks[0].completedAt, "2026-01-03T12:00:00.000Z");
});

test("filters tasks by state", () => {
  const open = addTask([], "open task").tasks;
  const both = addTask(completeTask(open, "T0001").tasks, "another task").tasks;

  assert.deepEqual(filterTasks(both, "open").map((task) => task.id), ["T0002"]);
  assert.deepEqual(filterTasks(both, "done").map((task) => task.id), ["T0001"]);
  assert.equal(filterTasks(both, "all").length, 2);
});

test("persists tasks as readable JSON", async () => {
  const directory = await mkdtemp(join(tmpdir(), "miniboard-"));
  const filePath = join(directory, "tasks.json");
  const tasks = addTask([], "persist me").tasks;

  await saveTasks(filePath, tasks);

  assert.deepEqual(await loadTasks(filePath), tasks);
  assert.match(await readFile(filePath, "utf8"), /"tasks"/);
});

