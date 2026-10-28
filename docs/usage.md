# MiniBoard usage guide

## Planning a task

The `add` command accepts a free-form title followed by optional planning
metadata:

```powershell
npm start -- add "Cut release candidate" `
  --priority urgent `
  --tag release `
  --tag engineering `
  --due 2026-10-30
```

Priorities are `low`, `normal`, `high`, and `urgent`. Tags are normalized to
lowercase and duplicate tags are removed. Due dates use `YYYY-MM-DD`.

## Focused lists

Filters can be combined:

```powershell
npm start -- list --all
npm start -- list --priority high --tag docs
npm start -- list --search release
npm start -- list --due overdue
npm start -- list --due today
npm start -- list --due week
```

Open work is sorted by priority, then due date, then task ID.

## Updating work

```powershell
npm start -- edit T0001 --priority high --tags release,docs
npm start -- edit T0001 --title "Publish final release"
npm start -- edit T0001 --due none
npm start -- done T0001
npm start -- reopen T0001
npm start -- remove T0001
```

## Reporting

`board` groups open work by priority and marks overdue and due-today tasks:

```powershell
npm start -- board
npm start -- board --tag release
```

`summary` prints completion and overdue counts. `export` creates a Markdown
table with status, priority, tags, due date, and title:

```powershell
npm start -- summary
npm start -- export weekly-status.md
```

## Storage format

MiniBoard uses an atomic write (temporary file followed by rename) and stores a
versioned JSON document:

```json
{
  "version": 2,
  "tasks": [
    {
      "id": "T0001",
      "title": "Prepare release",
      "completed": false,
      "createdAt": "2026-10-28T01:00:00.000Z",
      "completedAt": null,
      "updatedAt": null,
      "priority": "urgent",
      "tags": ["release"],
      "dueDate": "2026-10-30"
    }
  ]
}
```

Older files without planning fields are loaded as normal-priority tasks with no
tags or due date.

