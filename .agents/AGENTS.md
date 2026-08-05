# Workspace Agent Router — AG2R

> **AG2R** is a lightweight mobile bridge and remote monitor for Antigravity UI via CDP.

## 📖 [ALL AGENTS] Repository Documentation Index
Before starting any work, consult the project documentation:

- **Global Agent Guidelines & Safety:** Refer to `~/.gemini/config/AGENTS.md` for shell rules and agent protocols.
- **CDP Bridge Architecture & Ports:** Read [docs/architecture.md](file:///home/federico/ag2r/docs/architecture.md) for CDP principles, index click dispatch, and port map.
- **Developer Workflow & Git Rules:** Read [docs/workflow.md](file:///home/federico/ag2r/docs/workflow.md) for dev environment setup, `next`/`main` branching, and CI rules.
- **Product Overview:** Read [README.md](file:///home/federico/ag2r/README.md).

## 🚀 [ALL AGENTS] Session Startup Requirement
Always run `./_tools/setup-dev.sh` at session start before reading or editing source files.

## 🧹 [ALL AGENTS] Repository Maintenance & Cleanliness
To keep the repository clean and updated, all agents MUST adhere to the following rules:
- **Branch Management:** Always delete local and remote feature branches once they are successfully merged or if they become stale. Keep the branch list minimal.
- **Dependency Health:** Proactively monitor and resolve dependency vulnerabilities (e.g., using `npm audit`). 
- **Artifact Cleanup:** Never leave temporary scripts, scratch files, or test outputs in the working directory. Store temporary agent data only in `.agents/memory/` or `.gemini/` scratch directories.
- **Graphify Sync:** Run `graphify update .` after significant refactoring, file additions, or deletions to ensure the architectural knowledge graph remains perfectly synchronized.
- **Code Quality:** Ensure no dead code or unused files are left behind during refactoring tasks. Remove them proactively.
