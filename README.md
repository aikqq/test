# MiniBoard CLI

[![CI](https://github.com/aikqq/test/actions/workflows/ci.yml/badge.svg)](https://github.com/aikqq/test/actions/workflows/ci.yml)

MiniBoard is a dependency-free Node.js command-line task board. It keeps a
project in a human-readable JSON file and supports planning metadata, focused
views, progress reports, and Markdown exports.

## Highlights

- Add, edit, complete, reopen, and remove tasks.
- Plan with `low`, `normal`, `high`, or `urgent` priority.
- Attach multiple tags and an optional ISO due date.
- Filter by status, priority, tag, text, or due window.
- Render a terminal priority board with overdue indicators.
- Export a portable Markdown status report.
- Atomic JSON writes and automatic defaults for older task files.
- No runtime dependencies.

## Requirements

- Node.js 20 or newer

## Quick start

```powershell
npm test
npm start -- add "Prepare release" --priority urgent --tag release --due 2026-10-30
npm start -- add "Update documentation" --tag docs --priority high
npm start -- board
```

Tasks are stored in `.miniboard.json` in the current directory. Set
`MINIBOARD_FILE` to use a different board.

## Commands

```text
miniboard add <title> [--priority level] [--tag name] [--due YYYY-MM-DD]
miniboard list [--open|--done|--all] [--priority level] [--tag name]
               [--search text] [--due overdue|today|week]
miniboard edit <id> [--title text] [--priority level] [--tags a,b]
                    [--due YYYY-MM-DD|none]
miniboard done <id>
miniboard reopen <id>
miniboard remove <id>
miniboard board [--tag name] [--search text]
miniboard summary
miniboard export [report.md]
```

Multiple `--tag` arguments can be supplied while adding a task:

```powershell
npm start -- add "Publish v1" --tag release --tag docs --priority urgent
```

More examples and the data format are documented in
[docs/usage.md](docs/usage.md).

## Development

```powershell
npm test
```

The test suite uses the built-in `node:test` runner. CI exercises both the
oldest supported Node.js line and the current line.

## License

MIT
