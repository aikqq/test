import assert from "node:assert/strict";
import test from "node:test";

import { summarize, toMarkdown } from "../src/report.js";

const tasks = [
  { id: "T0001", title: "Plan | scope", completed: true },
  { id: "T0002", title: "Build feature", completed: false },
  { id: "T0003", title: "Test release", completed: true },
];

test("summarizes completion progress", () => {
  assert.deepEqual(summarize(tasks), {
    total: 3,
    open: 1,
    completed: 2,
    completionRate: 67,
  });
});

test("renders a portable Markdown report", () => {
  const markdown = toMarkdown(tasks);

  assert.match(markdown, /Completion: 67%/);
  assert.match(markdown, /T0001 \| Done \| Plan \\\| scope/);
  assert.match(markdown, /T0002 \| Open \| Build feature/);
});

