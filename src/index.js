#!/usr/bin/env node

const VERSION = "0.1.0";

export function helpText() {
  return [
    `MiniBoard ${VERSION}`,
    "",
    "A tiny local task board.",
    "",
    "Usage:",
    "  miniboard --help",
    "  miniboard --version",
  ].join("\n");
}

export function run(args = process.argv.slice(2)) {
  if (args.includes("--version")) {
    console.log(VERSION);
    return 0;
  }

  console.log(helpText());
  return 0;
}

if (import.meta.url === `file://${process.argv[1].replaceAll("\\", "/")}`) {
  process.exitCode = run();
}

