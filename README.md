
# 📝 Python Static Blog Generator

This is a simple, fast, and customizable static blog generator written in Python. It reads Markdown posts with optional metadata, converts them into static HTML pages using Jinja2 templates, and deploys the site to GitHub Pages automatically via GitHub Actions.

## 🌐 Live Demo

👉 [sajjadtalks.github.io/blog](https://sajjadtalks.github.io/blog)

---

## 📂 Project Structure

```
📦 your-blog-repo/
├─ .github/workflows/build-site.yml  # GitHub Actions workflow
├─ README.md                         # This file
├─ blog/                             # Your markdown posts
│  ├─ Hello-World.md
│  └─ Python-Markdown.md
├─ generate.py                       # Blog generator script
├─ requirements.txt                  # Python dependencies
├─ static/                           # Static assets (JS, CSS)
│  ├─ script.js
│  └─ style.css
├─ templates/                        # HTML templates
│  ├─ base.html
│  ├─ index.html
│  └─ post.html
└─ docs/                             # Output folder (auto-generated)
```

---

## 🛠️ Setup & Usage

### 1. Clone the repository

```bash
git clone https://github.com/sajjadtalks/blog.git
cd blog
```

### 2. Create your blog posts

Put your Markdown files inside the `blog/` folder. Example:

```markdown
---
title: Hello World
date: 2024-01-01 11:20:00
summary: This is my first post!
---

# Welcome to My Blog

This is the content of my first blog post.
```

Each post supports **YAML frontmatter** with fields like `title`, `date`, and `summary`.

### 3. Install dependencies

Use Python 3.11+ and run:

```bash
pip install -r requirements.txt
```

### 4. Build the site

```bash
python generate.py
```

The generated HTML site will be saved in the `docs/` folder.

### 5. Preview locally (optional)

You can serve the site locally to preview it:

```bash
cd docs
python -m http.server
```

Open [http://localhost:8000](http://localhost:8000) in your browser.

---

## 🚀 Auto Deploy with GitHub Actions

This project uses a GitHub Actions workflow to automatically build and deploy your blog to the `gh-pages` branch whenever you:

- Push to the `main` branch
- Modify any file in `blog/`, `templates/`, `static/`, `generate.py`, `requirements.txt`, or the workflow file itself

### How it works:

1. **On Push**: The GitHub Action runs `generate.py` to build the site into `docs/`
2. **Deploy**: Uses [peaceiris/actions-gh-pages](https://github.com/peaceiris/actions-gh-pages) to push the built site to `gh-pages`
3. **GitHub Pages**: Serves your static site from the `gh-pages` branch

### GitHub Pages Settings

Make sure to:

1. Go to your repo’s Settings → Pages
2. Set:
   - **Source**: `gh-pages` branch
   - **Folder**: `/ (root)`

---

## 🔍 Features

- 🗂 Supports pagination (10 posts per page)
- 📅 Sorts posts by date (newest first)
- 🧠 Builds a `search_index.json` file for custom search
- 🎨 Styled with custom `style.css` and supports `codehilite`
- ✅ Automatically creates `.nojekyll` for proper GitHub Pages support
- 📄 Supports Markdown extensions like tables, task lists, code blocks

---

## ✅ Requirements

- Python 3.11+
- See `requirements.txt` for packages like:
  - `markdown`
  - `jinja2`
  - `python-frontmatter`
  - `pymdown-extensions`

---

## 💡 Example Post Format

```markdown
---
title: My First Blog Post
date: 2025-04-15 11:20:00
summary: This post talks about Python static site generators.
---

# Hello Static Blogging!

Here is **some content** with `code`.

``` python
print("Hello World")```

```

---

## 📦 Deployment Notes

You **do not need to manually push to `gh-pages`**. Just push your Markdown or template changes to `main`, and the deployment is automatic 🚀

---

## 🧪 License

MIT License — Free to use and modify.

---

## 🙌 Credits

Created with ❤️ by [@sajjadtalks](https://github.com/sajjadtalks)

