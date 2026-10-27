import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { formatTaskList, helpText, run } from "../src/index.js";

test("help describes the executable", () => {
  const help = helpText();

  assert.match(help, /MiniBoard 0\.3\.0/);
  assert.match(help, /miniboard --help/);
});

test("CLI summarizes and exports the board", async () => {
  const directory = await mkdtemp(join(tmpdir(), "miniboard-report-"));
  const filePath = join(directory, "tasks.json");
  const reportPath = join(directory, "report.md");
  const messages = [];
  const options = { filePath, output: (message) => messages.push(message) };

  await run(["add", "publish", "demo"], options);
  await run(["done", "T0001"], options);
  await run(["summary"], options);
  await run(["export", reportPath], options);

  assert.equal(messages[2], "1/1 complete (100%), 0 open");
  assert.match(await readFile(reportPath, "utf8"), /T0001 \| Done \| publish demo/);
});

test("formats open and completed tasks", () => {
  const text = formatTaskList([
    { id: "T0001", title: "first", completed: false },
    { id: "T0002", title: "second", completed: true },
  ]);

  assert.equal(text, "[ ] T0001  first\n[x] T0002  second");
});

test("CLI adds, lists and completes a task", async () => {
  const directory = await mkdtemp(join(tmpdir(), "miniboard-cli-"));
  const filePath = join(directory, "tasks.json");
  const messages = [];
  const options = { filePath, output: (message) => messages.push(message) };

  assert.equal(await run(["add", "prepare", "demo"], options), 0);
  assert.equal(await run(["list"], options), 0);
  assert.equal(await run(["done", "T0001"], options), 0);
  assert.equal(await run(["list", "--done"], options), 0);

  assert.deepEqual(messages, [
    "Added T0001: prepare demo",
    "[ ] T0001  prepare demo",
    "Completed T0001",
    "[x] T0001  prepare demo",
  ]);
});

