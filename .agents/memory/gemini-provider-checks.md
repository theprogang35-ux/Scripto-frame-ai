---
name: Gemini provider checks
description: Durable lessons for diagnosing Gemini chat failures caused by credentials or model availability.
---

Validate the Gemini credential with a small live request before diagnosing the chat UI. A configured secret can still be rejected by Google, and older model IDs may return 404 even when the key is valid.

**Why:** The app can surface the same generic AI error for missing credentials, suspended provider credentials, and unavailable models, so logs alone are not enough to distinguish them.

**How to apply:** Check the API workflow logs, test the provider without printing secret values, and use a currently supported model before changing the frontend streaming flow.

Gemini free-tier request limits can be project-wide rather than key-wide. Rotating multiple keys only increases capacity when those keys belong to separate Google projects; multiple keys from one project still share that project's quota.

**Why:** The provider's quota errors identify the project/model quota metric, so changing only the key may not change the effective limit.

**How to apply:** Keep rotation for independent projects, but show a clear quota message when every configured project is exhausted.

The API server should use one shared, round-robin key pool across chat, image, voice, and video routes, with short cooldowns after quota or authorization failures. Per-route cursors can otherwise concentrate traffic on the same key.

**Why:** Each route previously maintained its own cursor, so rotation was inconsistent across the product even though multiple Gemini secrets were configured.

**How to apply:** Keep key values inside the server only, expose slot names/counts at most for diagnostics, and always retry another configured key before returning a provider error.