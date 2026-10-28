import assert from "node:assert/strict";
import test from "node:test";

import { parseArguments, rejectUnknownOptions } from "../src/arguments.js";

test("parses positional, flag and valued arguments", () => {
  const parsed = parseArguments(
    ["Write", "docs", "--priority=high", "--tag", "release", "--tag", "docs", "--all"],
    { flags: ["all"], repeatable: ["tag"] },
  );

  assert.deepEqual(parsed, {
    positionals: ["Write", "docs"],
    options: { priority: "high", tag: ["release", "docs"], all: true },
  });
});

test("reports missing values and unknown options", () => {
  assert.throws(() => parseArguments(["--priority"]), /requires a value/);
  assert.throws(() => rejectUnknownOptions({ mystery: true }, ["all"]), /Unknown option/);
});

