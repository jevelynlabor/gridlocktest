#!/usr/bin/env python3
"""
Gridlock Holmes blog builder
=============================
This script reads posts.json (the list of every blog post) and updates:
  - blog.html                         (hero spotlight + post grid + sidebar counts)
  - blog/archive.html                 (full chronological list + sidebar counts)
  - blog/category/*.html              (per-category post list + sidebar counts)
  - blog/<slug>.html for every post    (prev/next links + sidebar counts)

It only ever touches the text between matching
    <!-- BUILD:SOMETHING -->  ...  <!-- /BUILD:SOMETHING -->
comments. Everything else in every file (design, nav, footer, article text)
is left completely untouched.

HOW TO USE:
  1. Add a new entry to posts.json for your new post.
  2. Create blog/<slug>.html for the new post (copy new-post-template.html).
  3. Run:  python3 build.py
  4. Check the terminal output, then check the site in a browser.

That's it - category counts, the archive list, the hub's post grid, and every
post's "previous/next" links are recalculated automatically.
"""

import json
import os
import re
import sys
from datetime import datetime

ROOT = os.path.dirname(os.path.abspath(__file__))
POSTS_JSON = os.path.join(ROOT, "posts.json")

# The five categories this site supports. To add a new category, add it here
# AND create a matching blog/category/<slug>.html file (copy an existing one).
CATEGORIES = [
    {"slug": "tutorials",         "label": "Tutorials",         "color": "var(--purple)"},
    {"slug": "platform-updates",  "label": "Platform Updates",  "color": "var(--teal)"},
    {"slug": "grid-detective",    "label": "Grid Detective",    "color": "var(--purple)"},
    {"slug": "for-educators",     "label": "For Educators",     "color": "var(--teal)"},
    {"slug": "gradient-tool",     "label": "Gradient Tool",     "color": "var(--pink)"},
]
CATEGORY_BY_SLUG = {c["slug"]: c for c in CATEGORIES}

MONTHS = ["January","February","March","April","May","June","July",
          "August","September","October","November","December"]


# ---------------------------------------------------------------------------
# Load + validate data
# ---------------------------------------------------------------------------

def load_posts():
    if not os.path.exists(POSTS_JSON):
        sys.exit(f"ERROR: could not find {POSTS_JSON}")
    with open(POSTS_JSON) as f:
        posts = json.load(f)

    for p in posts:
        required = ["slug", "title", "category_slug", "badge", "date",
                    "date_display", "read_time", "words", "excerpt",
                    "image", "image_alt"]
        missing = [k for k in required if k not in p]
        if missing:
            sys.exit(f"ERROR: post '{p.get('slug','?')}' is missing fields: {missing}")
        if p["category_slug"] not in CATEGORY_BY_SLUG:
            sys.exit(f"ERROR: post '{p['slug']}' has unknown category_slug "
                      f"'{p['category_slug']}'. Must be one of: "
                      f"{', '.join(CATEGORY_BY_SLUG)}")
        try:
            datetime.strptime(p["date"], "%Y-%m-%d")
        except ValueError:
            sys.exit(f"ERROR: post '{p['slug']}' has date '{p['date']}' - "
                      f"must be in YYYY-MM-DD format.")

    # newest first
    posts.sort(key=lambda p: p["date"], reverse=True)
    return posts


def check_post_files_exist(posts):
    missing = []
    for p in posts:
        path = os.path.join(ROOT, "blog", f"{p['slug']}.html")
        if not os.path.exists(path):
            missing.append(path)
    if missing:
        print("WARNING: posts.json references files that don't exist yet:")
        for m in missing:
            print(f"   - {m}")
        print("  Create these files (copy new-post-template.html) before publishing.\n")


# ---------------------------------------------------------------------------
# Small render helpers
# ---------------------------------------------------------------------------

def category_counts(posts):
    counts = {c["slug"]: 0 for c in CATEGORIES}
    for p in posts:
        counts[p["category_slug"]] += 1
    return counts


def render_sidebar_categories(posts, cat_href):
    """cat_href(slug) -> href string, differs depending on which file we're writing into."""
    counts = category_counts(posts)
    lines = ['    <div class="sidebar-card">', '      <h3>Categories</h3>']
    for c in CATEGORIES:
        lines.append(
            f'      <a class="cat-link" href="{cat_href(c["slug"])}">{c["label"]} '
            f'<span style="float:right;">{counts[c["slug"]]}</span></a>'
        )
    lines.append('    </div>')
    return "\n".join(lines) + "\n"


def render_post_card(p, image_href, post_href):
    color = CATEGORY_BY_SLUG[p["category_slug"]]["color"]
    return f'''    <div class="post-card">
      <div class="post-img">
        <img src="{image_href}" alt="{p['image_alt']}" loading="lazy">
      </div>
      <div class="post-body">
        <div class="post-cat" style="color:{color};">{p['badge']}</div>
        <h3>{p['title']}</h3>
        <p style="font-size:0.85rem;color:var(--muted);margin:8px 0 14px;">{p['excerpt']}</p>
        <div style="display:flex;gap:16px;align-items:center;">
          <span class="post-meta">{p['date_display']} &bull; {p['words']} words</span>
          <a href="{post_href}" style="font-size:0.85rem;font-weight:600;color:var(--teal);">Read post &rarr;</a>
        </div>
      </div>
    </div>'''


def render_empty_state(label, blog_href):
    return f'''    <div class="empty-state">
      <strong>No {label} posts yet</strong>
      We have not published in this category yet, but it is on the roadmap. Check the <a href="{blog_href}" style="color:var(--teal);">full blog</a> or subscribe in the sidebar to hear when it lands.
    </div>'''


def replace_between(content, marker, new_inner, fpath):
    """Replace everything between <!-- BUILD:marker --> and <!-- /BUILD:marker -->."""
    pattern = re.compile(
        r'(<!-- BUILD:' + re.escape(marker) + r' -->\n)(.*?)(\s*<!-- /BUILD:' + re.escape(marker) + r' -->)',
        re.DOTALL
    )
    new_content, n = pattern.subn(lambda m: m.group(1) + new_inner + m.group(3), content, count=1)
    if n != 1:
        print(f"  WARNING: marker '{marker}' not found (or found more than once) in {fpath} - skipped.")
        return content, False
    return new_content, True


def write_if_changed(fpath, new_content, changed_flags):
    if not any(changed_flags):
        return
    old = open(fpath).read()
    if old != new_content:
        with open(fpath, "w") as f:
            f.write(new_content)
        print(f"  updated: {os.path.relpath(fpath, ROOT)}")
    else:
        print(f"  unchanged: {os.path.relpath(fpath, ROOT)}")


# ---------------------------------------------------------------------------
# blog.html  (hero spotlight + grid + sidebar)
# ---------------------------------------------------------------------------

def build_hub(posts):
    fpath = os.path.join(ROOT, "blog.html")
    content = open(fpath).read()
    changed = []

    newest = posts[0]
    rest = posts[1:]

    hero = f'''  <div class="hero-featured-wrap">
    <a href="blog/{newest['slug']}.html" class="hero-featured" style="text-decoration:none;">
      <div class="hero-featured-img">
        <img src="assets/images/{os.path.basename(newest['image'])}" alt="{newest['image_alt']}" loading="lazy">
      </div>
      <div class="hero-featured-body">
        <div class="hero-featured-label" style="color:{CATEGORY_BY_SLUG[newest['category_slug']]['color']};">Latest &bull; {newest['badge']}</div>
        <h2>{newest['title']}</h2>
        <p>{newest['excerpt']}</p>
        <div class="hero-featured-meta">
          <span class="post-meta">{newest['date_display']} &bull; {newest['words']} words</span>
          <span style="font-size:0.85rem;font-weight:600;color:var(--teal);">Read post &rarr;</span>
        </div>
      </div>
    </a>
  </div>
'''
    content, ok = replace_between(content, "HERO_FEATURED", hero, fpath); changed.append(ok)

    cards = "\n\n".join(
        render_post_card(
            p,
            image_href=f"assets/images/{os.path.basename(p['image'])}",
            post_href=f"blog/{p['slug']}.html",
        )
        for p in rest
    )
    content, ok = replace_between(content, "POST_LIST", cards + "\n", fpath); changed.append(ok)

    sidebar = render_sidebar_categories(posts, lambda slug: f"blog/category/{slug}.html")
    content, ok = replace_between(content, "SIDEBAR_CATEGORIES", sidebar, fpath); changed.append(ok)

    write_if_changed(fpath, content, changed)


# ---------------------------------------------------------------------------
# blog/archive.html
# ---------------------------------------------------------------------------

def build_archive(posts):
    fpath = os.path.join(ROOT, "blog", "archive.html")
    content = open(fpath).read()
    changed = []

    groups = {}
    for p in posts:
        d = datetime.strptime(p["date"], "%Y-%m-%d")
        key = (d.year, d.month)
        groups.setdefault(key, []).append(p)

    blocks = []
    for (year, month) in sorted(groups.keys(), reverse=True):
        blocks.append(f'    <div class="archive-group">\n      <div class="archive-group-title">{MONTHS[month-1]} {year}</div>\n')
        for p in groups[(year, month)]:
            color = CATEGORY_BY_SLUG[p["category_slug"]]["color"]
            blocks.append(f'''
      <div class="archive-row">
        <a href="{p['slug']}.html" class="archive-thumb">
          <img src="../assets/images/{os.path.basename(p['image'])}" alt="{p['image_alt']}" loading="lazy">
        </a>
        <div class="archive-row-body">
          <div class="archive-row-cat" style="color:{color};">{p['badge']}</div>
          <h3><a href="{p['slug']}.html" style="color:inherit;">{p['title']}</a></h3>
          <div class="archive-row-date">{p['date_display']} &bull; {p['read_time']}</div>
        </div>
      </div>''')
        blocks.append("\n    </div>\n")

    content, ok = replace_between(content, "ARCHIVE_LIST", "".join(blocks), fpath); changed.append(ok)

    sidebar = render_sidebar_categories(posts, lambda slug: f"category/{slug}.html")
    content, ok = replace_between(content, "SIDEBAR_CATEGORIES", sidebar, fpath); changed.append(ok)

    write_if_changed(fpath, content, changed)


# ---------------------------------------------------------------------------
# blog/category/<slug>.html
# ---------------------------------------------------------------------------

def build_category_pages(posts):
    for cat in CATEGORIES:
        fpath = os.path.join(ROOT, "blog", "category", f"{cat['slug']}.html")
        if not os.path.exists(fpath):
            print(f"  WARNING: {fpath} does not exist - skipping. "
                  f"Create it (copy an existing category page) to enable this category.")
            continue
        content = open(fpath).read()
        changed = []

        matching = [p for p in posts if p["category_slug"] == cat["slug"]]
        if matching:
            body = "\n\n".join(
                render_post_card(
                    p,
                    image_href=f"../../assets/images/{os.path.basename(p['image'])}",
                    post_href=f"../{p['slug']}.html",
                )
                for p in matching
            ) + "\n"
        else:
            body = render_empty_state(cat["label"], "../../blog.html") + "\n"

        content, ok = replace_between(content, "POST_LIST", body, fpath); changed.append(ok)

        sidebar = render_sidebar_categories(posts, lambda slug: f"{slug}.html")
        content, ok = replace_between(content, "SIDEBAR_CATEGORIES", sidebar, fpath); changed.append(ok)

        write_if_changed(fpath, content, changed)


# ---------------------------------------------------------------------------
# blog/<slug>.html - prev/next nav + sidebar counts only
# ---------------------------------------------------------------------------

def build_post_pages(posts):
    for i, p in enumerate(posts):
        # posts is sorted newest-first; "previous" chronologically = older = higher index
        older = posts[i + 1] if i + 1 < len(posts) else None   # published before this one
        newer = posts[i - 1] if i > 0 else None                # published after this one

        fpath = os.path.join(ROOT, "blog", f"{p['slug']}.html")
        if not os.path.exists(fpath):
            continue
        content = open(fpath).read()
        changed = []

        prev_html = ""
        if older:
            prev_html = f'''<a href="{older['slug']}.html" class="post-nav-link prev">
          <span class="post-nav-label">&larr; Previous post</span>
          <span class="post-nav-title">{older['title']}</span>
        </a>'''
        else:
            prev_html = "<span></span>"

        next_html = ""
        if newer:
            next_html = f'''<a href="{newer['slug']}.html" class="post-nav-link next">
          <span class="post-nav-label">Next post &rarr;</span>
          <span class="post-nav-title">{newer['title']}</span>
        </a>'''
        else:
            next_html = "<span></span>"

        nav = f'''      <div class="post-nav">
        {prev_html}
        {next_html}
      </div>
'''
        content, ok = replace_between(content, "POST_NAV", nav, fpath); changed.append(ok)

        sidebar = render_sidebar_categories(posts, lambda slug: f"category/{slug}.html")
        content, ok = replace_between(content, "SIDEBAR_CATEGORIES", sidebar, fpath); changed.append(ok)

        write_if_changed(fpath, content, changed)


# ---------------------------------------------------------------------------

def main():
    print("Gridlock Holmes blog builder\n" + "-" * 30)
    posts = load_posts()
    print(f"Loaded {len(posts)} posts from posts.json\n")
    check_post_files_exist(posts)

    print("Updating blog.html ...")
    build_hub(posts)

    print("Updating blog/archive.html ...")
    build_archive(posts)

    print("Updating category pages ...")
    build_category_pages(posts)

    print("Updating individual post pages (prev/next + sidebar) ...")
    build_post_pages(posts)

    print("\nDone. Open blog.html in a browser to check the result.")


if __name__ == "__main__":
    main()
