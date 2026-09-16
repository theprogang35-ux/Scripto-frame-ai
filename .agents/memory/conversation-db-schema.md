---
name: Conversation database setup
description: Development database setup required for the chat and Workspace conversation flow
---

The chat and Workspace routes require the Drizzle `conversations` and `messages` tables to exist in the development database. A healthy API server alone is not enough: missing tables make the global composer fail with “Failed to start conversation.”

**Why:** The app can boot and serve static UI while conversation creation and history still return database errors when the dev schema has not been applied.

**How to apply:** After schema changes or a fresh database setup, apply the development schema with the repository’s Drizzle push flow, then verify conversation creation and recent history before testing the mobile composer.