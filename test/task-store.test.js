import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  addTask,
  completeTask,
  filterTasks,
  loadTasks,
  saveTasks,
} from "../src/task-store.js";

test("tasks receive stable sequential ids", () => {
  const first = addTask([], "write tests", new Date("2026-01-01T00:00:00Z"));
  const second = addTask(first.tasks, "ship release", new Date("2026-01-02T00:00:00Z"));

  assert.equal(first.task.id, "T0001");
  assert.equal(second.task.id, "T0002");
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

