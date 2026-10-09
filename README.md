# Daniel Studio

A public visual website editor with private workspaces for each registered user. Production runs on **Netlify**, with source code on **GitHub**. It does not require ChatGPT Sites.

## Features
- Import a self-contained HTML page up to 20 MB or create a practice website.
- Click text, buttons and images to edit; add text sections and images.
- Desktop and mobile previews.
- Durable drafts, private published copies and previous-publication restore.
- Download the edited HTML for an external host.
- Public registration with Netlify Identity login, email confirmation, recovery and sign-out.

## Deploy from this repository
1. In Netlify, import this GitHub repository and select `main`.
2. Netlify reads `netlify.toml`: build `pnpm run build`, publish `.next`, Node 22.
3. Enable **Netlify Identity** and set Registration to **Open**. Keep email confirmation enabled.
4. Anyone can create an account, confirm their email, and sign in. Passwords are set by users and never included in source control.

Every data route checks the signed-in user's ID. Project records, HTML versions and upload chunks are scoped to that ID. One account cannot read or change another account's files, including existing private projects. `STUDIO_OWNER_EMAIL` is no longer required or consulted.

## Storage and publishing
Netlify Blobs stores the app's records and immutable HTML versions. Production uses a site-scoped store; non-production deployments use isolated deploy-scoped stores. Conditional writes reject stale edits. Publishing makes a private copy at `/p/{id}` and does not update an unrelated website automatically.

HTML import removes scripts and embedded frames. Self-contained HTML or absolute asset URLs are supported; ZIPs, asset folders and complete JavaScript applications are not imported.

## Migration notes
The original ChatGPT-hosted source and host-specific configuration are preserved in `archive/chatgpt-sites/`. They are not used or deployed by this Netlify build. The previous Supabase admin panel is preserved in `archive/previous-admin/` and in Git history.

Existing live data in the old ChatGPT-hosted database/object store is **not** part of Git and is not automatically transferred. Download your edited HTML from the old workspace and import it here. This migration does not delete the old deployment.

## Development
Use Node 22.13+ and pnpm 11.25.0.

```sh
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run build
npx netlify dev
```

Netlify Identity must be tested on a deployed Netlify site. No credentials, generated output or node_modules should be committed.
