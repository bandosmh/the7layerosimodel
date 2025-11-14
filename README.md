# OSI 7 Layers — Static Site

This repository contains a static HTML/CSS/JS site that visualizes the OSI 7-layer model. The site is ready to host on GitHub Pages.

Quick notes before publishing
- Ensure file names exactly match the paths used in the site (GitHub Pages is case-sensitive).
- The site uses relative links like `./layers/layer1.html` so it will work from the repository root.
- A `.nojekyll` file is included to prevent GitHub Pages from processing the site with Jekyll (useful if you have files or folders that start with an underscore).

Publish to GitHub Pages (recommended, using `main` branch root):

1. Create a new GitHub repository and set it up locally (PowerShell):

```powershell
cd "c:\Users\jayde\OneDrive\Pictures\osi 7 layers"
git init
git add .
git commit -m "Initial site commit"
# replace <your-repo-url> with the HTTPS or SSH URL from GitHub
git remote add origin <your-repo-url>
git branch -M main
git push -u origin main
```

2. Open your repository on GitHub → Settings → Pages and choose:
- Source: `Branch: main` and `Folder: / (root)`
- Save. GitHub will provide a URL such as `https://<username>.github.io/<repo>/` (or `https://<username>.github.io/` for user/organization site).

Alternative: publish from `gh-pages` branch
- If you prefer, create a `gh-pages` branch and push the built site there and set Pages to serve from `gh-pages`.

Troubleshooting
- If pages don’t load, open DevTools Console on the published URL to see network/console errors.
- File paths are case-sensitive on GitHub Pages (Linux). If links work locally on Windows but fail on GitHub, check capitalization.
- If you see 404s for files, confirm the files are in the repo and were pushed.

If you want, I can:
- Create a `package.json` + simple GitHub Action to auto-deploy (push to `gh-pages`) on every commit.
- Add a small `CNAME` file if you plan to use a custom domain.
- Double-check all internal links and adjust any absolute paths.

Happy to help finish the publish step — tell me your GitHub repo URL and whether you want to publish from `main` (root) or `gh-pages`.
