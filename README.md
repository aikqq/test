# MiniBoard CLI

[![CI](https://github.com/aikqq/test/actions/workflows/ci.yml/badge.svg)](https://github.com/aikqq/test/actions/workflows/ci.yml)

MiniBoard is a deliberately small, dependency-free Node.js command-line task
board. This repository doubles as a compact example of feature-branch
development and iterative delivery.

## Requirements

- Node.js 20 or newer

## Quick start

```powershell
npm test
npm start -- --help
```

Tasks are stored in `.miniboard.json` in the current directory:

```powershell
npm start -- add "Write release notes"
npm start -- list
npm start -- done T0001
npm start -- list --all
npm start -- summary
npm start -- export status.md
```

`summary` prints a compact progress snapshot. `export` writes the same board as
a Markdown report that can be attached to an issue or included in release notes.

