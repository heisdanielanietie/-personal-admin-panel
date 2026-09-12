# Personal Admin Panel — Setup

A one-page admin panel for editing text content across multiple projects, backed by Supabase. No server to run — just a database and a static HTML file.

## 1. Create your backend (~5 min)
1. Go to [supabase.com](https://supabase.com) → create a free account → **New project**.
2. Once it's ready, open **SQL Editor** → **New query**, paste the contents of `supabase-setup.sql`, click **Run**.
3. Go to **Authentication → Users → Add user**. Create yourself an email + password. This is your admin login — nobody else can sign in unless you create them a user.
4. Go to **Project Settings → API**. Copy your **Project URL** and **anon public key**.

## 2. Configure the admin panel
1. Open `index.html`, find these two lines near the bottom `<script>` tag:
   ```js
   const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
   const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";
   ```
2. Replace with the values from step 1.4.

## 3. Deploy it somewhere you can reach from your phone
Any static host works — pick one:
- **Netlify**: drag the folder onto [app.netlify.com/drop](https://app.netlify.com/drop)
- **Vercel**: `vercel deploy` from this folder, or drag-and-drop via their dashboard
- **GitHub Pages**: push this folder to a repo, enable Pages in repo settings

You'll get a URL like `your-admin.netlify.app` — bookmark it on your phone.

## 4. Connect a project's live site
1. In the admin panel, click **+ New project**, give it a name and a slug (e.g. `my-portfolio`).
2. Add a field (e.g. key `hero_title`).
3. In that project's actual website HTML, mark the spot:
   ```html
   <h1 data-cms-key="hero_title">Fallback text shown if the CMS hasn't loaded yet</h1>
   ```
4. Add `cms-embed.js` to that site (near end of `<body>`), and fill in its three constants (URL, anon key, and the slug from step 1) — same file works for every project, just change the slug per site.

Now editing `hero_title` in the admin panel and hitting **Save** updates the live site next time that page loads.

## ⚠️ Honest limitations — read before relying on this
- **Text only, by design.** This handles copy/text swaps safely. It does not let you drag-and-drop layouts or edit page structure — that's a much bigger (and riskier) tool to build well.
- **Updates on page load, not instantly.** If someone already has the page open, they won't see your edit until they refresh. I can add Supabase Realtime later if you want live push.
- **New fields need one code touch.** The first time you want a new editable spot, you still add one `data-cms-key` attribute to that project's HTML. After that, it's edit-forever without touching code.
- **One admin user model.** Anyone with your email/password has full edit access to everything. Fine for personal use; don't share the login.
- **No version history / undo.** Saves overwrite the previous value immediately. If that's a problem for you, ask me to add a simple change log — it's a small addition (one more table).
