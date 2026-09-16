---
name: Browser upload flow
description: Lessons for validating upload controls in browser-only editor flows.
---

Upload controls must be tested beyond the file picker UI: the selected file needs an onChange handler that moves it into the actual feature flow. For a chat composer, prefer one universal upload action over separate photo/video/document buttons, then show the selected file as an attachment chip. When there is no upload backend, a validated local data URL plus a short-lived browser handoff can support private editing without pretending the file was uploaded.

**Why:** A previous upload control only showed a success toast, so users could select a file but could not edit or use it.

**How to apply:** For client-only editing, validate type and size, clear the input value after selection so the same file can be chosen again, and provide visible preview, edit, remove, and download states.