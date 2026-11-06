# markital-1st-github-website

## Markital Business Hub — Version 1

A simple, responsive dashboard for managing **clients, projects and tasks**.
Built with plain **HTML, CSS and JavaScript**: no frameworks, no build step, no server code.

> ⚠️ **Data is stored only in your browser (localStorage).**
> Tasks are saved on the device and browser where you enter them.
> They are **not shared with teammates**, not synced to other devices or browsers,
> and are **erased if you clear your browser/site data**. A shared database can be added in a later version.

All client and project names in the demo data are **fictional**.

### Features

- **Overview:** task totals (To Do, In Progress, Done, Overdue), upcoming deadlines and overall progress.
- **Clients:** one card per client with project count, open/done/overdue tasks and progress.
- **Projects:** one card per project with status (On track / Needs attention / Completed), progress and next due date.
- **Tasks:** add, edit, delete, change status, search, and filter by client, project, status, priority or overdue.
- Each task has: Client Name, Project Name, Task Title, Description, Priority, Due Date and Status.
- **Reset demo data** button (bottom of the menu) restores the example tasks.
- Works on desktop, tablet and mobile.

### How to preview

**Option 1: just open it.** Download or clone the repository and double-click `index.html`.
It opens in your browser and works straight away.

**Option 2: local web server** (closer to how real hosting behaves):

```bash
python3 -m http.server 8080
```

Then open <http://localhost:8080> in your browser. Press `Ctrl + C` in the terminal to stop it.

### Project structure

```
index.html          The page layout: menu, 4 sections, task form pop-up
css/styles.css      All the styling (colours, layout, mobile design)
js/utils.js         Small helpers (dates, ids, safe text)
js/storage.js       Saving/loading tasks in the browser (localStorage)
js/demo-data.js     Fictional example tasks
js/app.js           Main logic: drawing the page, forms, filters, buttons
```

The scripts are loaded in that order at the bottom of `index.html`. Each file can use the ones before it.

### Deploying to Hostinger (later, not done yet)

Because this is a static site, deployment is just uploading files:

1. Open Hostinger **hPanel → File Manager → `public_html`** (or the folder for your subdomain).
2. Upload `index.html` plus the `css` and `js` folders, keeping the same structure.
3. Visit your domain.

No PHP, database or Node.js is needed for Version 1.
