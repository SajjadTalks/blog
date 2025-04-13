import os
import shutil
import math
import json
from pathlib import Path
import markdown
import jinja2
import frontmatter
from datetime import datetime, date


# --- Configuration ---
BLOG_SOURCE_DIR = Path("blog")
TEMPLATES_DIR = Path("templates")
STATIC_SOURCE_DIR = Path("static")
OUTPUT_DIR = Path("docs")
SITE_BASE_URL = ""
POSTS_PER_PAGE = 10
# PYGMENTS_STYLE = 'friendly' # Or 'monokai', 'friendly', etc.

# --- Setup ---
md_extensions = ['fenced_code', 'codehilite', 'tables', 'meta', 'extra', 'smarty', 'md_in_html']
md = markdown.Markdown(extensions=md_extensions, extension_configs={
    'codehilite': {
        'css_class': 'highlight',
        'guess_lang': True,
        'linenums': True
        }
})
env = jinja2.Environment(
    loader=jinja2.FileSystemLoader(TEMPLATES_DIR),
    autoescape=jinja2.select_autoescape(['html', 'xml'])
)
env.globals['now'] = datetime.utcnow

# --- Helper Functions ---
def ensure_dir(path):
    path.mkdir(parents=True, exist_ok=True)

def clean_dir(path):
    if path.exists() and path.is_dir():
        shutil.rmtree(path)

def generate_output_path(source_path, base_dir=BLOG_SOURCE_DIR, output_dir=OUTPUT_DIR):
    relative_path = source_path.relative_to(base_dir)
    output_filename = relative_path.with_suffix(".html")
    return output_dir / output_filename

def get_relative_url(output_path, base_output_dir=OUTPUT_DIR):
    relative_to_output = output_path.relative_to(base_output_dir)
    url_path = relative_to_output.as_posix()
    return f"{SITE_BASE_URL}/{url_path}"

def get_static_url(static_file_name, current_output_path, base_output_dir=OUTPUT_DIR, static_base=STATIC_SOURCE_DIR.name):
    return f"{SITE_BASE_URL}/{static_base}/{static_file_name}"

def get_pagination_url(page_num):
    if page_num <= 1:
        return f"{SITE_BASE_URL}/index.html" if SITE_BASE_URL else "index.html"
    else:
        return f"{SITE_BASE_URL}/page{page_num}.html"

env.globals['url_for_index'] = lambda: get_pagination_url(1)
env.globals['url_for_static'] = lambda filename: get_static_url(filename, env.globals.get('current_output_path', OUTPUT_DIR / 'index.html'))
env.globals['url_for_pagination'] = get_pagination_url

# --- Main Generation Logic ---
def build_site():
    print("Starting static site generation...")
    clean_dir(OUTPUT_DIR)
    ensure_dir(OUTPUT_DIR)
    print(f"Created output directory: {OUTPUT_DIR}")

    all_posts_data = []
    search_index_data = []
    print(f"Looking for posts in: {BLOG_SOURCE_DIR}")
    markdown_files = list(BLOG_SOURCE_DIR.glob("**/*.md"))
    print(f"Found {len(markdown_files)} markdown files.")

    # --- Process Posts ---
    for md_file in markdown_files:
        print(f"Processing: {md_file}")
        try:
            post_fm = frontmatter.load(md_file)
            post_metadata = post_fm.metadata
            html_content = md.convert(post_fm.content)

            # --- Date Handling ---
            raw_date = post_metadata.get('date')
            post_date_obj = None
            default_date = datetime(1970, 1, 1)
            if isinstance(raw_date, datetime): post_date_obj = raw_date
            elif isinstance(raw_date, date): post_date_obj = datetime.combine(raw_date, datetime.min.time())
            elif isinstance(raw_date, str):
                try: post_date_obj = datetime.strptime(raw_date, '%Y-%m-%d')
                except ValueError: post_date_obj = default_date; print(f"  [!] Warning: Bad date '{raw_date}'")
            else: post_date_obj = default_date; print(f"  [!] Warning: No/bad date type '{type(raw_date)}'")

            output_path = generate_output_path(md_file)
            ensure_dir(output_path.parent)
            post_url = get_relative_url(output_path)

            post_data = {
                'metadata': post_metadata,
                'html_content': html_content,
                'source_path': md_file,
                'url': post_url,
                'date_obj': post_date_obj
            }

            post_template = env.get_template("post.html")
            env.globals['current_output_path'] = output_path
            rendered_html = post_template.render(post=post_data)
            with open(output_path, "w", encoding="utf-8") as f: f.write(rendered_html)
            print(f"  -> Generated: {output_path}")

            # --- Add data to search index ---
            search_entry = {
                "url": post_url,
                "title": post_metadata.get("title", "Untitled"),
                "date": post_date_obj.strftime('%Y-%m-%d'),
                "summary": post_metadata.get("summary", "")

            }
            if not search_entry["summary"] and post_fm.content:
                 import re
                 plain_content = re.sub('<[^<]+?>', '', html_content)
                 plain_content = ' '.join(plain_content.split())
                 search_entry["summary"] = (plain_content[:150] + '...') if len(plain_content) > 150 else plain_content


            search_index_data.append(search_entry)

            all_posts_data.append(post_data)

        except Exception as e:
            print(f"  [!] Error processing {md_file}: {e}")

    # --- Generate Index Page(s) ---
    print("Generating index pages...")
    if all_posts_data:
        all_posts_data.sort(key=lambda p: p['date_obj'], reverse=True)
        total_posts = len(all_posts_data)
        total_pages = math.ceil(total_posts / POSTS_PER_PAGE)
        print(f"Total posts: {total_posts}, Pages: {total_pages}")
        index_template = env.get_template("index.html")
        for page_num in range(1, total_pages + 1):
            start_index = (page_num - 1) * POSTS_PER_PAGE
            end_index = start_index + POSTS_PER_PAGE
            paginated_posts = all_posts_data[start_index:end_index]
            page_output_path = OUTPUT_DIR / "index.html" if page_num == 1 else OUTPUT_DIR / f"page{page_num}.html"
            ensure_dir(page_output_path.parent)
            pagination = {'current_page': page_num, 'total_pages': total_pages, 'has_prev': page_num > 1, 'prev_url': get_pagination_url(page_num - 1) if page_num > 1 else None, 'has_next': page_num < total_pages, 'next_url': get_pagination_url(page_num + 1) if page_num < total_pages else None,}
            env.globals['current_output_path'] = page_output_path
            index_html = index_template.render(posts=paginated_posts, pagination=pagination)
            with open(page_output_path, "w", encoding="utf-8") as f: f.write(index_html)
            print(f"    -> Generated: {page_output_path}")
    else:
        print("  -> No valid posts found, generating empty index.")
        index_template = env.get_template("index.html")
        index_output_path = OUTPUT_DIR / "index.html"
        env.globals['current_output_path'] = index_output_path
        index_html = index_template.render(posts=[], pagination=None)
        with open(index_output_path, "w", encoding="utf-8") as f: f.write(index_html)
        print(f"  -> Generated empty index: {index_output_path}")


    # --- Generate Search Index File ---
    print("Generating search index file...")
    search_index_path = OUTPUT_DIR / "search_index.json"
    try:
        with open(search_index_path, "w", encoding="utf-8") as f:
            json.dump(search_index_data, f, ensure_ascii=False, indent=None)
        print(f"  -> Generated: {search_index_path}")
    except Exception as e:
         print(f"  [!] Error generating search index: {e}")

    # --- Copy Static Files ---
    print("Copying static files...")
    static_output_dir = OUTPUT_DIR / STATIC_SOURCE_DIR.name
    if STATIC_SOURCE_DIR.exists() and STATIC_SOURCE_DIR.is_dir():
        ensure_dir(static_output_dir.parent)
        shutil.copytree(STATIC_SOURCE_DIR, static_output_dir, dirs_exist_ok=True)
        print(f"  -> Copied {STATIC_SOURCE_DIR} to {static_output_dir}")
    else:
        print(f"  -> Static source directory '{STATIC_SOURCE_DIR}' not found or is not a directory, skipping.")

    print("\nSite generation complete!")
    print(f"Static site generated in: {OUTPUT_DIR.resolve()}")


# --- Run the script ---
if __name__ == "__main__":
    build_site()