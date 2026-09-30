/**
 * CMS EMBED SNIPPET
 * Drop this near the end of <body> on any live project page you want
 * to make editable from the admin panel.
 *
 * 1. Mark editable spots in your HTML with data-cms-key, e.g.:
 *      <h1 data-cms-key="hero_title">Fallback headline</h1>
 *      <p data-cms-key="hero_subtitle">Fallback subtext</p>
 *
 * 2. Fill in the three constants below.
 *    PROJECT_SLUG must exactly match the slug you gave this project
 *    inside the admin panel.
 *
 * 3. The keys you use here (e.g. "hero_title") must also exist as
 *    fields inside that project in the admin panel — the admin panel
 *    doesn't know a field exists until you add one with that same key.
 *
 * Note: content updates on page load/refresh, not instantly while
 * someone is already viewing the page. Ask me if you want live-push
 * updates instead — it's a small addition using Supabase Realtime.
 */
(function () {
  const SUPABASE_URL = "https://wziaefgyrkuhifgihhts.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6aWFlZmd5cmt1aGlmZ2loaHRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMTQ4NDUsImV4cCI6MjEwNDc5MDg0NX0.EfRo0vOVc0zfwxTps6UArhRs4Gc9PjVMZJeIKB9Mnc8";
  const PROJECT_SLUG = "your-project-slug"; // change this per project — set it to match the slug you give it in the admin panel

  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  script.onload = loadContent;
  document.head.appendChild(script);

  async function loadContent() {
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await supabase
      .from("content_blocks")
      .select("key, value, projects!inner(slug)")
      .eq("projects.slug", PROJECT_SLUG);

    if (error) {
      console.error("CMS load failed:", error.message);
      return;
    }
    data.forEach((block) => {
      document
        .querySelectorAll(`[data-cms-key="${block.key}"]`)
        .forEach((el) => { el.textContent = block.value; });
    });
  }
})();
