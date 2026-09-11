---
name: Workspace package age policy
description: The imported workspace enforces a minimum npm release age during installs.
---

The workspace package policy blocks newly published npm versions until they have aged for one day. When an imported dependency is too new, use the newest mature release that satisfies the app rather than weakening or bypassing the policy.

**Why:** The security setting is intentional supply-chain protection and can reject a package even when the registry reports it as the latest version.

**How to apply:** Check the package's publish time, select the latest release outside the age window, update its manifest, and regenerate the lockfile.