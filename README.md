# Web4browser

Web4browser is a hybrid desktop browser foundation for the Web4 ecosystem. The repository already contains a Next.js AI research/search workspace alongside an Electron desktop browsing shell. The current implementation does not claim decentralized identity, LCT verification, trust scoring, or multi-tab browsing are operational.

## Architecture

- **Desktop chrome:** Electron window, address/search bar, back/forward/reload, and local bookmarks.
- **Isolated page view:** external pages render in a separate `BrowserView`, away from trusted local chrome.
- **Narrow preload bridge:** explicit IPC methods only; no Node.js access from renderer code.
- **IPC trust boundary:** every browser command validates both the sending `webContents` and the exact local chrome document URL.
- **Existing research workspace:** Next.js, NextAuth, Prisma, Gemini, Serper, and optional Pinecone integrations remain in the repository.
- **Web4 integration seam:** identity, LCT, trust/reputation, and permission-aware extension APIs remain future work.

## Requirements and setup

Requires Node.js 20 or 22 and npm. A desktop environment is needed to launch Electron.

    npm install
    cp .env.example .env.local

Fill only the credentials needed by the existing research workspace. Never commit real credentials. The repository previously tracked `.env` and `.env.local` with populated credentials. Treat affected API keys, OAuth secrets, webhook URLs, and application secrets as exposed and rotate them. Removing files from a branch does not erase values from Git history.

## Run

Start the existing web workspace with `npm run dev`. Start the desktop shell with `npm run desktop`. The desktop shell is independent of the Next.js server. It opens a default search page; enter HTTP/HTTPS URLs or search phrases in the address bar. Bookmarks are stored in local storage on this device.

## Validation

    npm test
    npm run typecheck
    npm run build

The test suite includes navigation-policy and IPC trust-boundary tests. CI runs tests and TypeScript checking on Node.js 20 and 22. A production build may also require valid environment configuration for existing app routes. A successful unit-test run does not replace launching the packaged desktop application on each target operating system.

## Security baseline

- Node integration is disabled; context isolation, sandboxing, and Chromium web security are enabled.
- The preload exposes only explicit navigation/history/reload/bookmark methods.
- IPC handlers reject calls unless they originate from the trusted chrome renderer and its exact local document.
- Navigation accepts HTTP and HTTPS only; `javascript:`, `data:`, `file:`, and other schemes are rejected.
- New windows are denied in the embedded page; only credential-free HTTPS links may be handed to the operating system.
- Permission requests are denied by default.
- Local chrome uses a restrictive Content Security Policy.
- CI uses read-only repository permissions.

## Known limitations and roadmap

1. Add multi-tab support with per-tab isolated contents and lifecycle tests.
2. Design a reviewed Web4 identity/LCT adapter and trust-aware origin permission model before identity integration.
3. Add browser-owned bookmark/history UI, encrypted profile storage, and data export/deletion controls.
4. Add platform packaging/signing, update policy, and release verification.
5. Complete security review of existing Next.js research routes, persistence ownership, and environment configuration before production deployment.

## Repository safety note

The repository's ignore rules prevent local environment files from being added again, but Git history may still contain old secret values. Rotate exposed credentials regardless of whether history cleanup is performed.

No license is added by this change. Confirm the intended license before distributing binaries.
