#!/usr/bin/env node

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  addTask,
  completeTask,
  filterTasks,
  loadTasks,
  saveTasks,
} from "./task-store.js";

const VERSION = "0.2.0";

export function helpText() {
  return [
    `MiniBoard ${VERSION}`,
    "",
    "A tiny local task board.",
    "",
    "Usage:",
    "  miniboard add <title>",
    "  miniboard list [--open|--done|--all]",
    "  miniboard done <task-id>",
    "  miniboard --help | --version",
  ].join("\n");
}

export function formatTaskList(tasks) {
  if (tasks.length === 0) return "No tasks found.";
  return tasks
    .map((task) => `${task.completed ? "[x]" : "[ ]"} ${task.id}  ${task.title}`)
    .join("\n");
}

export async function run(args = process.argv.slice(2), options = {}) {
  const output = options.output ?? console.log;
  const errorOutput = options.errorOutput ?? console.error;
  const filePath = options.filePath ?? process.env.MINIBOARD_FILE ?? resolve(".miniboard.json");
  const [command, ...rest] = args;

  if (command === "--version") {
    output(VERSION);
    return 0;
  }

  if (!command || command === "--help" || command === "help") {
    output(helpText());
    return 0;
  }

  const tasks = await loadTasks(filePath);

  if (command === "add") {
    const result = addTask(tasks, rest.join(" "));
    await saveTasks(filePath, result.tasks);
    output(`Added ${result.task.id}: ${result.task.title}`);
    return 0;
  }

  if (command === "list") {
    const state = rest.includes("--all") ? "all" : rest.includes("--done") ? "done" : "open";
    output(formatTaskList(filterTasks(tasks, state)));
    return 0;
  }

  if (command === "done") {
    const result = completeTask(tasks, rest[0]);
    if (!result.changed) {
      errorOutput(`Task not found or already complete: ${rest[0] ?? "(missing id)"}`);
      return 1;
    }
    await saveTasks(filePath, result.tasks);
    output(`Completed ${rest[0]}`);
    return 0;
  }

  errorOutput(`Unknown command: ${command}`);
  return 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().then((code) => {
    process.exitCode = code;
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

