# Daniel Studio

A private visual website editor. Production runs on **Netlify**, with source code on **GitHub**. It does not require ChatGPT Sites.

## Features
- Import a self-contained HTML page or create a practice website.
- Click text, buttons and images to edit; add text sections and images.
- Desktop and mobile previews.
- Durable drafts, private published copies and previous-publication restore.
- Download the edited HTML for an external host.
- Owner-only Netlify Identity login, email confirmation, recovery and sign-out.

## Deploy from this repository
1. In Netlify, import this GitHub repository and select `main`.
2. Netlify reads `netlify.toml`: build `pnpm run build`, publish `.next`, Node 22.
3. Set `STUDIO_OWNER_EMAIL` to your own verified email in Netlify's environment variables (Functions and Builds scopes).
4. Enable **Netlify Identity** in Project configuration → Identity. Keep email confirmation enabled. Either allow registration (the `identity-validate` function restricts it to the configured owner email) or choose Invite only and invite that address.
5. Open the deployed website and create/confirm the owner account or accept the invitation. Passwords are set by the owner, never included in source control.

The app denies access if the owner email is missing or the signed-in address does not match. Every data route checks ownership. A public login page does not make stored websites public.

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
