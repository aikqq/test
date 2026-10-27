import assert from "node:assert/strict";
import test from "node:test";

import { helpText } from "../src/index.js";

test("help describes the executable", () => {
  const help = helpText();

  assert.match(help, /MiniBoard 0\.1\.0/);
  assert.match(help, /miniboard --help/);
});

