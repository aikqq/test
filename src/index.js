#!/usr/bin/env node

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { writeFile } from "node:fs/promises";

import { parseArguments, rejectUnknownOptions } from "./arguments.js";
import { summarize, toMarkdown } from "./report.js";
import {
  addTask,
  completeTask,
  editTask,
  loadTasks,
  queryTasks,
  removeTask,
  reopenTask,
  saveTasks,
} from "./task-store.js";

const VERSION = "0.3.1";

export function helpText() {
  return [
    `MiniBoard ${VERSION}`,
    "",
    "A tiny local task board.",
    "",
    "Usage:",
    "  miniboard add <title> [--priority level] [--tag name] [--due YYYY-MM-DD]",
    "  miniboard list [--open|--done|--all] [--priority level] [--tag name]",
    "                 [--search text] [--due overdue|today|week]",
    "  miniboard done <task-id>",
    "  miniboard reopen <task-id>",
    "  miniboard edit <task-id> [--title text] [--priority level]",
    "                 [--tags a,b] [--due YYYY-MM-DD|none]",
    "  miniboard remove <task-id>",
    "  miniboard summary",
    "  miniboard export <report.md>",
    "  miniboard --help | --version",
  ].join("\n");
}

export function formatTaskList(tasks) {
  if (tasks.length === 0) return "No tasks found.";
  return tasks
    .map((task) => {
      const metadata = [
        task.priority && task.priority !== "normal" ? `!${task.priority}` : null,
        ...(task.tags ?? []).map((tag) => `#${tag}`),
        task.dueDate ? `due:${task.dueDate}` : null,
      ].filter(Boolean);
      return `${task.completed ? "[x]" : "[ ]"} ${task.id}  ${task.title}${metadata.length ? `  ${metadata.join(" ")}` : ""}`;
    })
    .join("\n");
}

function tagsFromOptions(value) {
  if (value === undefined) return undefined;
  const values = Array.isArray(value) ? value : [value];
  return values.flatMap((item) => String(item).split(","));
}

function selectedState(options) {
  const selected = ["open", "done", "all"].filter((state) => options[state]);
  if (selected.length > 1) throw new TypeError("Choose only one of --open, --done, or --all.");
  return selected[0] ?? "open";
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

  try {
    if (command === "add") {
      const parsed = parseArguments(rest, { repeatable: ["tag"] });
      rejectUnknownOptions(parsed.options, ["priority", "tag", "due"]);
      const title = parsed.positionals.join(" ").trim();
      if (!title) throw new TypeError("Task title is required.");
      const result = addTask(tasks, title, new Date(), {
        priority: parsed.options.priority,
        tags: tagsFromOptions(parsed.options.tag),
        dueDate: parsed.options.due,
      });
      await saveTasks(filePath, result.tasks);
      output(`Added ${result.task.id}: ${result.task.title}`);
      return 0;
    }

    if (command === "list") {
      const parsed = parseArguments(rest, { flags: ["open", "done", "all"] });
      rejectUnknownOptions(parsed.options, ["open", "done", "all", "priority", "tag", "search", "due"]);
      if (parsed.positionals.length > 0) throw new TypeError(`Unexpected argument: ${parsed.positionals[0]}`);
      const result = queryTasks(tasks, {
        state: selectedState(parsed.options),
        priority: parsed.options.priority,
        tag: parsed.options.tag,
        search: parsed.options.search,
        due: parsed.options.due,
        today: options.today,
      });
      output(formatTaskList(result));
      return 0;
    }

    if (["done", "reopen", "remove"].includes(command)) {
      const id = rest[0];
      if (!id) throw new TypeError("Task id is required.");
      if (rest.length > 1) throw new TypeError(`Unexpected argument: ${rest[1]}`);
      const result = command === "done"
        ? completeTask(tasks, id)
        : command === "reopen"
          ? reopenTask(tasks, id)
          : removeTask(tasks, id);
      if (!result.changed) throw new TypeError(`Task cannot be ${command === "done" ? "completed" : command === "reopen" ? "reopened" : "removed"}: ${id}`);
      await saveTasks(filePath, result.tasks);
      output(`${command === "done" ? "Completed" : command === "reopen" ? "Reopened" : "Removed"} ${id}`);
      return 0;
    }

    if (command === "edit") {
      const parsed = parseArguments(rest);
      rejectUnknownOptions(parsed.options, ["title", "priority", "tags", "due"]);
      const id = parsed.positionals[0];
      if (!id) throw new TypeError("Task id is required.");
      if (parsed.positionals.length > 1) throw new TypeError(`Unexpected argument: ${parsed.positionals[1]}`);
      if (Object.keys(parsed.options).length === 0) throw new TypeError("At least one edit option is required.");
      const result = editTask(tasks, id, {
        title: parsed.options.title,
        priority: parsed.options.priority,
        tags: tagsFromOptions(parsed.options.tags),
        dueDate: parsed.options.due === "none" ? null : parsed.options.due,
      });
      if (!result.changed) throw new TypeError(`Task not found: ${id}`);
      await saveTasks(filePath, result.tasks);
      output(`Updated ${id}: ${result.task.title}`);
      return 0;
    }

    if (command === "summary") {
      const summary = summarize(tasks);
      output(`${summary.completed}/${summary.total} complete (${summary.completionRate}%), ${summary.open} open`);
      return 0;
    }

    if (command === "export") {
      const destination = resolve(rest[0] ?? "miniboard-report.md");
      await writeFile(destination, toMarkdown(tasks), "utf8");
      output(`Exported report to ${destination}`);
      return 0;
    }

    errorOutput(`Unknown command: ${command}`);
    return 1;
  } catch (error) {
    errorOutput(error.message);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().then((code) => {
    process.exitCode = code;
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

