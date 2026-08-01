# AG2R Workflow & Git Branching Guide

## 1. Developer Workflow
1. **Startup:** Run `./_tools/setup-dev.sh` then `node server.js` in background.
2. **Research:** Check active GitHub Issues before editing.
3. **Plan:** Document implementation steps in plan artifacts.
4. **Implement & Test:** Verify on assigned port.

## 2. Git Branching & CI Policy
AG2R uses two permanent long-lived branches:
- `next`: Active development branch.
- `main`: Stable production branch.

**Committing:**
```bash
git add -A && git commit -m "type: description"
```
Always use `gh pr create --base $TARGET_BRANCH` and merge via `--squash`.
