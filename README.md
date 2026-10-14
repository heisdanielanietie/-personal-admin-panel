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

## Multi-page editing
Select several HTML files when adding a website, or choose **Add HTML pages** inside an existing website. Each page supports 20 MB. Use the original hosting filenames (usually `index.html` and `contact-form.html`); rename browser-added copy suffixes in the import dialog if needed. Page tabs save the current draft before switching. Download ZIP exports all pages; private publication applies to the current page. Hidden Netlify form definitions are preserved, but imported JavaScript is removed and forms cannot submit inside the editor. Deploy the extracted files to their intended host for live form processing.

The frame uses `sandbox="allow-same-origin"` without `allow-scripts`, plus `script-src 'none'`. Only trusted parent-app code attaches the selection and editing listeners. Upload/download chunks use batches of four with 45-second request timeouts. Saves reuse local HTML instead of downloading it again.

## Expanded editing controls
Click an element and use **Select parent** or **Select enclosing section** for containers. The inspector includes typography, link destinations, backgrounds, dimensions, image fit/crop focus, spacing, column proportions, duplication, movement and deletion. Image crops use CSS `object-fit`; original image bytes remain unchanged. Column presets stack at 600px and below and the responsive CSS is included in exports. Fixed sizes can still affect responsive layouts; check Phone view before exporting.

Undo/redo keeps the latest 60 editing actions for the open page, including structural changes. Switching/reopening pages or reconnecting the editor resets that history. Save draft persists the resulting HTML, not the undo history. Text replacement flattens inline formatting in the selected text element, and undo restores its original child nodes. Container text replacement is blocked. Duplicated elements receive fresh IDs and matching internal label/ARIA/fragment references.

This update adds no third-party services. Accounts use Netlify Identity and uploaded HTML remains in account-scoped Netlify Blobs. Remote images, backgrounds and fonts referenced by a user's HTML can contact their original providers. The editor adds no marketing mail or subscription billing.

Controller regression checks (optional jsdom installation): `STUDIO_TEST_JSDOM=/path/to/node_modules/jsdom node tests/editor-controls.cjs`. These are DOM tests, not a signed-in browser end-to-end test.

## Canvas workbench
The Layers / Insert panel is collapsed initially to leave room for the canvas, and Properties can also be collapsed. Layers lists up to 2,000 HTML elements with search, branch collapse, selection, names, hide and lock. Locked containers protect descendants from editing; unlock the container in Layers. Layer names and locks persist in `data-studio-*` attributes; hidden uses HTML `hidden` and affects export. Layer locking is an editing aid, not an access-control mechanism.

Canvas controls provide zoom, fit, hand panning and desktop/tablet/phone viewport widths (1200/768/375px). The bottom-right resize handle changes width and height as one undoable action. Fixed pixel resizing may need further responsive adjustments. This is an HTML layout editor, not unrestricted vector drawing or Figma file import.

Insert adds text, headings, containers, dividers, rectangles, circles, buttons, sections and images. Design includes borders, shadow presets, opacity and two-colour gradients. Auto Layout applies wrapping flex rows or columns with alignment, distribution and gap controls. Page styles store up to 30 named colour or typography presets in page metadata, so saving/exporting preserves them. They apply by value, not as live-linked global styles. Scripts remain disabled and resize handles/selection labels are excluded from exports.

The Daniel Studio login and workspace display a copyright footer. User-uploaded pages are not branded. No new data recipients, billing or marketing features are introduced by these controls.

## Dragging, ZIPs, themes and shapes
Dragging defaults to **Free move**: a visual offset preserves the original layout slot, dimensions and sibling order. Existing transforms are retained. Inline text uses relative offsets; other objects use CSS translate. Undo/redo, saving and HTML export preserve the result. **Layout move** explicitly reorders siblings. Offsets remain pixel-based across viewport sizes: check Phone view for overlap. Moving a container moves its contents, identified by the canvas selection badge. Previously saved absolute positioning is preserved; this does not reconstruct layout slots removed by older edits. Use Hand for canvas panning; switch it off to drag elements. Locked layers remain protected.

The upload picker accepts standard stored/deflated ZIPs up to 20 MB, with up to 500 entries and 60 MB uncompressed total. ZIP64, encrypted archives, symbolic links, duplicate names, unsafe paths and damaged content are rejected. HTML folder paths are retained; local image/font assets and CSS are embedded in each HTML page rather than stored as separate files. Each prepared page must fit the 20 MB limit. Missing/unsupported referenced assets are reported. JavaScript and embedded frames remain unsupported, and this imports static website output, not source projects requiring a build. Exported ZIPs contain self-contained HTML pages at their retained paths.

**Dark mode / Light mode** changes only the editor and is remembered on the browser. **Page settings → Website appearance** changes the uploaded page's base background/text and is undoable; custom section backgrounds still need individual adjustment. Insert now includes a visual picker for rectangles, rounded rectangles, circles, ellipses, triangles, lines and arrows.


## Drawing toolbox
The slim toolbox provides Select/Move, Shape Edit, Rectangle, Ellipse, Line, Freehand, Text and Hand. Choose a drawing tool, then drag on the page; Text also supports a click. Drawing returns to Select automatically. Select a shape and open Design → Shape editing for fill, outline, dimensions, rotation and rectangle corner rounding. Freehand paths support open/closed outlines, fill and editable points through Shape Edit or point coordinates. Reset rotation to zero before dragging vector points.

Delete or Backspace removes the selected unlocked object when you are not typing in a field. Undo restores it. Drawing, point editing and deletion participate in undo/redo; SVG paths survive save and export. The app-level theme includes dialogs and the login page, persists when browser storage is available, and never changes the imported page.

Drawing regression checks: `STUDIO_TEST_JSDOM=/path/to/node_modules/jsdom node tests/editor-drawing.cjs`.
