# MiniBoard CLI

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
```

