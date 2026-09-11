---
name: Clerk Google OAuth
description: Replit-managed Clerk Google sign-in behavior in browser previews and embedded browsers.
---

Use Clerk's redirect OAuth flow for web sign-in and sign-up pages instead of relying on the automatic popup flow. Replit-managed Clerk does not support Google sign-in inside embedded browsers or in-app webviews; users must complete the flow in a standard external browser.

**Why:** Mobile preview containers can block or isolate OAuth popups, while Google/Clerk intentionally reject embedded webview authentication for security.

**How to apply:** Keep the auth routes as full path routes with optional OAuth callback wildcards, set `oauthFlow="redirect"` on the Clerk web components, and avoid presenting a generic “Google is broken” warning. If the app is opened in an embedded browser, explain that the same URL must be opened in Chrome/Safari.