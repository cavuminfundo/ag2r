# AG2R Architecture & CDP Bridge Specification

## 1. Product Core Principle
AG2R is a lightweight mobile bridge that captures and mirrors Antigravity's UI via Chrome DevTools Protocol (CDP), enabling remote monitoring and interaction.

> **AG2R is a bridge, not a reconstruction.**
1. **Capture views, don't construct them:** Detect AG UI changes via CDP and mirror DOM.
2. **Proxy clicks, don't manage state:** Proxy user taps directly to AG via CDP.
3. **Index-based dispatch:** Elements are tagged `chat:N`, `left:N`, `dialog:N` for robust interaction without fragile CSS selectors.

---

## 2. Infrastructure & Port Mapping

| Port | Process | Managed By |
|---|---|---|
| 3000 | AG2R Production (`main` branch) | `scripts/watchdog.sh` |
| 3001–3099 | Dev/Test Servers (agent sessions) | `_tools/setup-dev.sh` |
| 3100 | Dev Hub Proxy | `_tools/hub-watchdog.sh` |
| 9000 | CDP Remote Debugging | `ag-watchdog.sh` |
