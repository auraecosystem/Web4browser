# Web4browser

Web4browser is a hybrid desktop browser foundation for the Web4 ecosystem. The repository already contains a Next.js AI research/search workspace; this change adds an Electron-based desktop browsing shell and repository security/build foundations. It does not claim decentralized identity, LCT verification, trust scoring, or multi-tab browsing are already implemented.

## Architecture

- **Desktop chrome:** Electron window, address/search bar, back/forward/reload, local bookmarks.
- **Isolated page view:** external pages render in a separate BrowserView, away from the trusted local chrome.
- **Narrow preload bridge:** explicit IPC methods only; no Node.js access from renderer code.
- **Existing research workspace:** Next.js, NextAuth, Prisma, Gemini, Serper and optional Pinecone integrations remain in the repository.
- **Web4 integration seam:** identity, LCT, trust/reputation and permission-aware extension APIs are future work, not represented as operational.

## Requirements and setup

Requires Node.js 20 or 22 and npm. A desktop environment is needed to launch Electron.

    npm install
    cp .env.example .env.local

Fill only the credentials needed by the existing research workspace. Never commit real credentials. The repository previously tracked .env and .env.local with populated credentials. Treat every affected API key, OAuth secret, webhook URL and application secret as exposed and rotate them. Removing files from this branch does not erase their values from Git history.

## Run

Start the existing web workspace with `npm run dev`. Start the desktop shell with `npm run desktop`. The desktop shell is currently an independent browser window and does not require the Next.js server. It opens a default search page; enter HTTP/HTTPS URLs or search phrases in the address bar. Bookmarks are stored in local storage on this device.

## Validation

    npm test
    npm run typecheck
    npm run build

CI runs browser security unit tests and TypeScript checking on Node.js 20 and 22. A production build may also require valid environment configuration for the existing app routes.

## Security baseline

- Node integration is disabled; context isolation, sandboxing and Chromium web security are enabled.
- The preload exposes only explicit navigation/history/reload/bookmark methods.
- Navigation accepts HTTP and HTTPS only; javascript, data, file and other schemes are rejected.
- New windows are denied; credential-free HTTPS links may be opened externally by the operating system.
- Permission requests are denied by default.
- Local chrome uses a restrictive Content Security Policy.
- CI uses read-only repository permissions.

## Known limitations and roadmap

1. Add multi-tab support with per-tab isolated contents and lifecycle tests.
2. Design a reviewed Web4 identity/LCT adapter and trust-aware origin permission model before identity integration.
3. Add browser-owned bookmark/history UI, encrypted profile storage, and data export/deletion controls.
4. Add platform packaging/signing, update policy and release verification.
5. Complete security review of existing Next.js research routes, persistence ownership and environment configuration before production deployment.

## Repository safety note

The new branch removes tracked `.env` and `.env.local` and adds ignore rules. Git history may still contain old secret values; use GitHub's sensitive-data removal procedure if history cleanup is required. Rotate exposed credentials regardless of history cleanup.

No license is added by this change. Confirm the intended license before distributing binaries.
