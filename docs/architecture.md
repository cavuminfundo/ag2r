# AG2R Architecture & CDP Bridge Specification

## 1. Product Core Principle
AG2R is a lightweight mobile bridge that captures and mirrors Antigravity's UI via Chrome DevTools Protocol (CDP), enabling remote monitoring and interaction.

> **AG2R is a bridge, not a reconstruction.**
1. **Capture views, don't construct them:** Detect AG UI changes via CDP and mirror DOM.
2. **Proxy clicks, don't manage state:** Proxy user taps directly to AG via CDP.
3. **Index-based dispatch:** Elements are tagged `chat:N`, `left:N`, `dialog:N` for robust interaction without fragile CSS selectors.

---

## 2. Infrastructure & Port Mapping

AG2R is fully containerized and distributed via GitHub Container Registry (`ghcr.io/cavuminfundo/ag2r`).

| Port | Process | Managed By |
|---|---|---|
| 3000 | AG2R Production (Docker Container) | `docker-compose` / Dockge |
| 3001–3099 | Dev/Test Servers (agent sessions) | `_tools/setup-dev.sh` |
| 3100 | Dev Hub Proxy | `_tools/hub-watchdog.sh` |
| 9000 | CDP Remote Debugging | `ag-watchdog.sh` |

## 3. Docker Architecture

The Docker implementation uses the official `node:22-alpine` image.
- **Image**: `ghcr.io/cavuminfundo/ag2r:latest`
- **Network**: Requires `network_mode: host` to connect directly to the CDP instance on `localhost:9000`.
- **Environment Variables**:
  - `STARTUP_DELAY`: (Default: `0`) Number of seconds to wait before launching the node server, useful for ensuring Antigravity is fully initialized before the connection attempt.
- **Volumes (Persistence)**:
  - `/root/.config/ag2r`: Persists VAPID keys and push notification subscriptions.
  - `/app/certs`: Persists self-signed SSL certificates.
