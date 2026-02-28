# Highlight Digital Contact (GitHub Pages Ready)

## Quick Start
1. Upload these files to a GitHub repo (keep the same folder structure).
2. Turn on **GitHub Pages**:
   - Repo → Settings → Pages
   - Source: `Deploy from a branch`
   - Branch: `main` (or `master`), Folder: `/ (root)`
3. Your site will be live at: `https://<username>.github.io/<repo>/`

## Editing Employees
Open `employees.csv` and add rows.

**Columns**
- `first`, `last`, `title`, `phone`, `ext`, `email`
- `website` (defaults to highlightindustries.com if blank)
- `photo` (optional) — use a relative path like `./assets/headshots/taryne.jpg`
- `parts_label`, `parts_url` (optional) — show “Machine Parts” row if provided
- `slug` (optional) — used for URLs like `?u=taryne-swayze`

## Direct-link to an employee
Append `?u=<slug>` to the URL.
Example: `...?u=taryne-swayze`

## Notes
- “Add to Contacts” downloads a `.vcf` vCard which iOS/Android will import.
- Share uses the Web Share API when supported; otherwise it shows a copy-link modal.
- QR uses a small JS library via CDN; if blocked/offline, it falls back to a QR image API.
