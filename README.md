# Highlight Digital Business Card (Blinq-like)

## What this is
A lightweight, static, Blinq-style digital business card system:
- Desktop layout with employee search + Save to Contacts + Send to Phone (QR + share options)
- Mobile layout with QR under the photo + Save / Share / Find
- Forced mobile view link: `?view=mobile` (works even on Mac/PC)
- Employee selection via `?u=employee-id`

## Quick start (GitHub Pages)
1. Create a new GitHub repo and upload these files.
2. In GitHub: Settings → Pages → Deploy from branch → `main` → `/ (root)`.
3. Your link will look like: `https://<username>.github.io/<repo>/`

## URLs
- Desktop (auto): `/index.html?u=jessica-flanders`
- Forced mobile (for QR codes): `/index.html?u=jessica-flanders&view=mobile`

## Add employees
Edit `employees.json` and add a new object:
- `id` must be URL-safe (use dashes).
- `photo` can be null — it will use `fallbackPhoto` (building image).

## Notes
QR codes are generated using a hosted QR image endpoint.
If you want fully-offline QR generation later, we can swap in a tiny local JS QR library.


## Editing employee info (CSV)
Employee data is loaded from `employees.csv` (preferred) so you can edit it in Excel / Google Sheets.

- File: `employees.csv`
- Required column: `id` (used in the URL like `?u=jessica-flanders`)
- Recommended columns:
  - `name`, `title`, `email`, `phone`, `ext`, `website`
  - `photo` (leave blank to use the building photo)
  - `fallbackPhoto` (optional; default is `./assets/building.jpg`)
  - `location`, `dept` (optional)

### Add/Update photos
1. Drop the headshot into `/assets/` (jpg/png).
2. In `employees.csv`, set `photo` to `./assets/<filename>`.

> Note: If you previously used `employees.json`, it still works as a fallback, but CSV is what the app will try first.
