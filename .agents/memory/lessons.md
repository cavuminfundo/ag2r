# ag2r AI Agent - Lessons Learned & Behavioral Memory

This file serves as a memory bank to record past execution mistakes, lessons learned, and behavioral rules. Future agents working on this repository should review this file during startup to avoid repeating mistakes.

## 1. CDP Event Dispatch Hijacking & UI Freeze Warning
* **Issue:** Injecting continuous `dispatchRadixClick` simulated pointer events (`mousemove`, `pointerdown`, `mousedown`, `pointerup`, `mouseup`) into Chrome DevTools CDP intercepts and freezes the user's Antigravity IDE UI, blocking mouse clicks, dropdowns, and conversation switching.
* **Lesson:** NEVER run background auto-clicking or continuous CDP pointer dispatch loops against active IDE sessions without strict user isolation, as it corrupts the user's browser UI interaction context.
