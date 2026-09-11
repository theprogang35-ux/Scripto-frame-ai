---
name: WebGL preview fallback
description: Rendering guidance for React Three Fiber components in Replit browser previews
---

React Three Fiber canvases should be guarded by a WebGL capability check and paired with a static fallback. The Replit screenshot browser can lack a usable WebGL context even when the production browser supports it.

**Why:** An unguarded Canvas throws a WebGLRenderer error that triggers the Vite runtime overlay and obscures the rest of the page during visual verification.

**How to apply:** Detect WebGL before mounting Canvas; show a representative, accessible fallback without treating the environment limitation as an application crash.