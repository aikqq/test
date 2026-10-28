import assert from "node:assert/strict";
import test from "node:test";

import { summarize, toBoard, toMarkdown } from "../src/report.js";

const tasks = [
  { id: "T0001", title: "Plan | scope", completed: true, priority: "normal", tags: ["planning"], dueDate: null },
  { id: "T0002", title: "Build feature", completed: false, priority: "urgent", tags: ["code"], dueDate: "2026-10-27" },
  { id: "T0003", title: "Test release", completed: true, priority: "high", tags: [], dueDate: "2026-10-28" },
];

test("summarizes completion progress", () => {
  assert.deepEqual(summarize(tasks, "2026-10-28"), {
    total: 3,
    open: 1,
    completed: 2,
    completionRate: 67,
    overdue: 1,
    dueToday: 0,
    byPriority: { urgent: 1, high: 0, normal: 0, low: 0 },
  });
});

test("renders a portable Markdown report", () => {
  const markdown = toMarkdown(tasks, { today: "2026-10-28" });

  assert.match(markdown, /Completion: 67%/);
  assert.match(markdown, /Overdue: 1/);
  assert.match(markdown, /T0001 \| Done \| normal \| planning \| — \| Plan \\\| scope/);
  assert.match(markdown, /T0002 \| Open \| urgent \| code \| 2026-10-27 \| Build feature/);
});

test("renders an operational priority board", () => {
  const board = toBoard(tasks, "2026-10-28");

  assert.match(board, /URGENT \(1\)/);
  assert.match(board, /T0002 Build feature #code \[OVERDUE 2026-10-27\]/);
});

