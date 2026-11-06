/*
  app.js - the "brain" of the Business Hub.

  How it works, in plain words:
    1. When the page opens, we LOAD tasks from the browser (or create demo tasks).
    2. We keep all tasks in one list called `tasks`.
    3. Whenever something changes (add / edit / delete / status change), we:
         a) update the `tasks` list,
         b) SAVE it to the browser,
         c) RE-DRAW (render) the page so it shows the latest data.
  Clients and Projects are not stored separately - they are worked out
  from the tasks (every task has a client name and a project name).
*/

/* ------------------------------------------------------------------
   1. APP STATE (the data the app is currently working with)
------------------------------------------------------------------- */
let tasks = [];

const filters = {
  search: '',
  client: 'All',
  project: 'All',
  status: 'All',
  priority: 'All'
};

const SECTIONS = {
  overview: { title: 'Overview', subtitle: 'Your business at a glance' },
  clients:  { title: 'Clients',  subtitle: 'Everyone you are working with' },
  projects: { title: 'Projects', subtitle: 'Progress of every project' },
  tasks:    { title: 'Tasks',    subtitle: 'Add, edit and track your work' }
};

const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 };

/* A shortcut: $('#id') finds one element on the page. */
const $ = (selector) => document.querySelector(selector);


/* ------------------------------------------------------------------
   2. STARTING THE APP
------------------------------------------------------------------- */
function init() {
  const saved = HubStorage.load();
  if (saved) {
    tasks = saved;
  } else {
    tasks = createDemoTasks();   // first visit: show demo data
    saveTasks();
  }

  bindEvents();
  showSection(getSectionFromUrl());
  renderAll();
}

/* Save to the browser. If the browser refuses, show a warning banner. */
function saveTasks() {
  const ok = HubStorage.save(tasks);
  $('#storageWarning').hidden = ok;
  return ok;
}


/* ------------------------------------------------------------------
   3. NAVIGATION (switching between the 4 sections)
   The address bar ends with #overview, #clients, #projects or #tasks.
   This means the browser "Back" button and bookmarks work too.
   (The sections are called "section-overview" etc. on purpose: if they were
   just "overview", the browser would jump down the page to them by itself.)
------------------------------------------------------------------- */
function getSectionFromUrl() {
  const name = window.location.hash.replace('#', '');
  return SECTIONS[name] ? name : 'overview';
}

function showSection(name) {
  // Show the chosen section, hide the others.
  Object.keys(SECTIONS).forEach((key) => {
    document.getElementById('section-' + key).hidden = key !== name;
  });

  // Highlight the active menu button.
  document.querySelectorAll('.nav-link').forEach((btn) => {
    const active = btn.dataset.section === name;
    btn.classList.toggle('active', active);
    if (active) {
      btn.setAttribute('aria-current', 'page');
      // On phones the menu scrolls sideways: make sure the active item is visible.
      // (Only scrolls the menu sideways; the page itself does not move.)
      const nav = btn.parentElement;
      nav.scrollLeft = btn.offsetLeft - nav.offsetLeft - 16;
    } else {
      btn.removeAttribute('aria-current');
    }
  });

  $('#pageTitle').textContent = SECTIONS[name].title;
  $('#pageSubtitle').textContent = SECTIONS[name].subtitle;
  window.scrollTo(0, 0);
}

function goTo(name) {
  if (window.location.hash === '#' + name) showSection(name);
  else window.location.hash = name;   // triggers the 'hashchange' event
}


/* ------------------------------------------------------------------
   4. WORKING OUT CLIENTS AND PROJECTS FROM THE TASKS
------------------------------------------------------------------- */
function summarise(list) {
  const done = list.filter((t) => t.status === 'Done').length;
  return {
    total: list.length,
    done,
    open: list.length - done,
    inProgress: list.filter((t) => t.status === 'In Progress').length,
    overdue: list.filter(Utils.isOverdue).length,
    progress: Utils.percent(done, list.length)
  };
}

/* Group tasks by client: [{ name, tasks: [...], projects: Set }] */
function getClients() {
  const map = new Map();
  tasks.forEach((t) => {
    if (!map.has(t.clientName)) map.set(t.clientName, { name: t.clientName, tasks: [], projects: new Set() });
    const client = map.get(t.clientName);
    client.tasks.push(t);
    client.projects.add(t.projectName);
  });
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/* Group tasks by project (a project belongs to one client). */
function getProjects() {
  const map = new Map();
  tasks.forEach((t) => {
    const key = t.clientName + '||' + t.projectName;
    if (!map.has(key)) map.set(key, { name: t.projectName, client: t.clientName, tasks: [] });
    map.get(key).tasks.push(t);
  });
  return [...map.values()].sort((a, b) =>
    a.client.localeCompare(b.client) || a.name.localeCompare(b.name));
}

/* The earliest due date among unfinished tasks (or null). */
function nextDueDate(list) {
  const dates = list.filter((t) => t.status !== 'Done' && t.dueDate).map((t) => t.dueDate).sort();
  return dates[0] || null;
}


/* ------------------------------------------------------------------
   5. DRAWING THE PAGE ("rendering")
------------------------------------------------------------------- */
function renderAll() {
  renderOverview();
  renderClients();
  renderProjects();
  renderFilterOptions();
  renderTasks();
  renderFormSuggestions();
}

/* ---- Overview ---- */
function renderOverview() {
  const s = summarise(tasks);
  const todo = tasks.filter((t) => t.status === 'To Do').length;

  const cards = [
    { label: 'Total tasks', value: s.total, tone: 'neutral', status: 'All' },
    { label: 'To Do', value: todo, tone: 'todo', status: 'To Do' },
    { label: 'In Progress', value: s.inProgress, tone: 'progress', status: 'In Progress' },
    { label: 'Done', value: s.done, tone: 'done', status: 'Done' },
    { label: 'Overdue', value: s.overdue, tone: 'overdue', status: 'Overdue' }
  ];

  $('#statsGrid').innerHTML = cards.map((c) => `
    <button class="stat-card tone-${c.tone}" data-status-filter="${c.status}" type="button">
      <span class="stat-label">${c.label}</span>
      <span class="stat-value">${c.value}</span>
    </button>`).join('');

  // Upcoming & overdue: unfinished tasks, earliest due date first, top 6.
  const upcoming = tasks
    .filter((t) => t.status !== 'Done')
    .sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'))
    .slice(0, 6);

  $('#deadlineList').innerHTML = upcoming.length
    ? upcoming.map((t) => `
      <li class="deadline-item">
        <div>
          <div class="deadline-title">${Utils.escapeHtml(t.title)}</div>
          <div class="muted small">${Utils.escapeHtml(t.clientName)} · ${Utils.escapeHtml(t.projectName)}</div>
        </div>
        <span class="date-pill ${Utils.isOverdue(t) ? 'is-overdue' : ''}">
          ${Utils.isOverdue(t) ? 'Overdue · ' : ''}${Utils.formatDate(t.dueDate)}
        </span>
      </li>`).join('')
    : '<li class="empty-state">Nothing pending. Great work! 🎉</li>';

  // Progress panel: overall completion + numbers.
  const clients = getClients().length;
  const projects = getProjects().length;
  $('#progressPanel').innerHTML = `
    <div class="progress-big">
      <span class="progress-number">${s.progress}%</span>
      <span class="muted">of all tasks completed</span>
    </div>
    <div class="progress-bar" role="progressbar" aria-valuenow="${s.progress}" aria-valuemin="0" aria-valuemax="100">
      <span style="width:${s.progress}%"></span>
    </div>
    <div class="mini-stats">
      <div><strong>${clients}</strong><span>Clients</span></div>
      <div><strong>${projects}</strong><span>Projects</span></div>
      <div><strong>${s.open}</strong><span>Open tasks</span></div>
    </div>`;
}

/* ---- Clients ---- */
function renderClients() {
  const clients = getClients();
  if (!clients.length) {
    $('#clientGrid').innerHTML = '<div class="empty-state panel">No clients yet. Add a task to create your first client.</div>';
    return;
  }

  $('#clientGrid').innerHTML = clients.map((c) => {
    const s = summarise(c.tasks);
    const name = Utils.escapeHtml(c.name);
    const initials = c.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    return `
      <article class="card">
        <div class="card-top">
          <div class="avatar" aria-hidden="true">${Utils.escapeHtml(initials)}</div>
          <div>
            <h3 class="card-title">${name}</h3>
            <p class="muted small">${c.projects.size} project${c.projects.size === 1 ? '' : 's'} · ${s.total} task${s.total === 1 ? '' : 's'}</p>
          </div>
        </div>
        <div class="card-stats">
          <span><strong>${s.open}</strong> open</span>
          <span><strong>${s.done}</strong> done</span>
          <span class="${s.overdue ? 'text-danger' : ''}"><strong>${s.overdue}</strong> overdue</span>
        </div>
        <div class="progress-bar small-bar"><span style="width:${s.progress}%"></span></div>
        <p class="muted small">${s.progress}% complete</p>
        <div class="card-actions">
          <button class="btn btn-ghost btn-small" data-view-client="${name}" type="button">View tasks</button>
          <button class="btn btn-soft btn-small" data-add-for-client="${name}" type="button">+ Add task</button>
        </div>
      </article>`;
  }).join('');
}

/* ---- Projects ---- */
function renderProjects() {
  const projects = getProjects();
  if (!projects.length) {
    $('#projectGrid').innerHTML = '<div class="empty-state panel">No projects yet. Add a task to create your first project.</div>';
    return;
  }

  $('#projectGrid').innerHTML = projects.map((p) => {
    const s = summarise(p.tasks);
    const next = nextDueDate(p.tasks);
    const name = Utils.escapeHtml(p.name);
    const client = Utils.escapeHtml(p.client);
    const state = s.progress === 100 ? 'Completed' : s.overdue ? 'Needs attention' : 'On track';
    return `
      <article class="card">
        <div class="card-head-row">
          <span class="chip chip-${Utils.slug(state)}">${state}</span>
          <span class="muted small">${s.done}/${s.total} done</span>
        </div>
        <h3 class="card-title">${name}</h3>
        <p class="muted small">${client}</p>
        <div class="progress-bar small-bar"><span style="width:${s.progress}%"></span></div>
        <div class="card-stats">
          <span><strong>${s.progress}%</strong> complete</span>
          <span>Next due: <strong>${next ? Utils.formatDate(next) : '—'}</strong></span>
        </div>
        <div class="card-actions">
          <button class="btn btn-ghost btn-small" data-view-client="${client}" data-view-project="${name}" type="button">View tasks</button>
          <button class="btn btn-soft btn-small" data-add-for-client="${client}" data-add-for-project="${name}" type="button">+ Add task</button>
        </div>
      </article>`;
  }).join('');
}

/* ---- Filter drop-downs (client & project lists) ---- */
function renderFilterOptions() {
  const clientNames = getClients().map((c) => c.name);
  if (filters.client !== 'All' && !clientNames.includes(filters.client)) filters.client = 'All';

  // Projects list only shows projects of the selected client.
  const projectNames = [...new Set(
    tasks.filter((t) => filters.client === 'All' || t.clientName === filters.client).map((t) => t.projectName)
  )].sort();
  if (filters.project !== 'All' && !projectNames.includes(filters.project)) filters.project = 'All';

  const options = (list, allLabel) =>
    `<option value="All">${allLabel}</option>` +
    list.map((n) => `<option value="${Utils.escapeHtml(n)}">${Utils.escapeHtml(n)}</option>`).join('');

  $('#filterClient').innerHTML = options(clientNames, 'All clients');
  $('#filterProject').innerHTML = options(projectNames, 'All projects');

  // Put the current filter values back into the inputs.
  $('#filterClient').value = filters.client;
  $('#filterProject').value = filters.project;
  $('#filterStatus').value = filters.status;
  $('#filterPriority').value = filters.priority;
  $('#filterSearch').value = filters.search;
}

/* ---- Tasks table ---- */
function getFilteredTasks() {
  const q = filters.search.trim().toLowerCase();
  return tasks
    .filter((t) => filters.client === 'All' || t.clientName === filters.client)
    .filter((t) => filters.project === 'All' || t.projectName === filters.project)
    .filter((t) => filters.status === 'All' ||
      (filters.status === 'Overdue' ? Utils.isOverdue(t) : t.status === filters.status))
    .filter((t) => filters.priority === 'All' || t.priority === filters.priority)
    .filter((t) => !q || [t.title, t.description, t.clientName, t.projectName]
      .some((field) => String(field || '').toLowerCase().includes(q)))
    // Sort: unfinished first, then by due date, then by priority.
    .sort((a, b) =>
      (a.status === 'Done') - (b.status === 'Done') ||
      (a.dueDate || '9999').localeCompare(b.dueDate || '9999') ||
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}

function renderTasks() {
  const list = getFilteredTasks();
  $('#resultCount').textContent = `Showing ${list.length} of ${tasks.length} task${tasks.length === 1 ? '' : 's'}`;
  $('#taskEmpty').hidden = list.length > 0;
  $('#taskEmpty').textContent = tasks.length ? 'No tasks match your filters.' : 'No tasks yet. Click "+ New Task" to add one.';

  $('#taskTableBody').innerHTML = list.map((t) => {
    const overdue = Utils.isOverdue(t);
    const statusOptions = ['To Do', 'In Progress', 'Done']
      .map((s) => `<option ${s === t.status ? 'selected' : ''}>${s}</option>`).join('');
    return `
      <tr class="${t.status === 'Done' ? 'is-done' : ''}" data-id="${t.id}">
        <td data-label="Task">
          <div class="task-title">${Utils.escapeHtml(t.title)}</div>
          ${t.description ? `<div class="muted small task-desc">${Utils.escapeHtml(t.description)}</div>` : ''}
        </td>
        <td data-label="Client">${Utils.escapeHtml(t.clientName)}</td>
        <td data-label="Project">${Utils.escapeHtml(t.projectName)}</td>
        <td data-label="Priority"><span class="badge priority-${Utils.slug(t.priority)}">${t.priority}</span></td>
        <td data-label="Due date">
          <span class="${overdue ? 'text-danger' : ''}">${Utils.formatDate(t.dueDate)}</span>
          ${overdue ? '<span class="badge badge-overdue">Overdue</span>' : ''}
        </td>
        <td data-label="Status">
          <select class="input status-select status-${Utils.slug(t.status)}" data-action="status" aria-label="Change status">${statusOptions}</select>
        </td>
        <td class="row-actions">
          <button class="icon-btn" data-action="edit" type="button" aria-label="Edit task" title="Edit">✎</button>
          <button class="icon-btn icon-danger" data-action="delete" type="button" aria-label="Delete task" title="Delete">🗑</button>
        </td>
      </tr>`;
  }).join('');
}

/* Suggestions that appear while typing client / project names in the form. */
function renderFormSuggestions() {
  const opt = (n) => `<option value="${Utils.escapeHtml(n)}"></option>`;
  $('#clientOptions').innerHTML = getClients().map((c) => opt(c.name)).join('');
  $('#projectOptions').innerHTML = [...new Set(tasks.map((t) => t.projectName))].sort().map(opt).join('');
}


/* ------------------------------------------------------------------
   6. THE TASK FORM (add & edit)
------------------------------------------------------------------- */
function openTaskForm(task = null, prefill = {}) {
  const form = $('#taskForm');
  form.reset();
  $('#formError').hidden = true;

  $('#dialogTitle').textContent = task ? 'Edit Task' : 'New Task';
  $('#saveTaskBtn').textContent = task ? 'Save Changes' : 'Save Task';

  const data = task || {
    clientName: prefill.clientName || '',
    projectName: prefill.projectName || '',
    title: '', description: '',
    priority: 'Medium',
    dueDate: Utils.daysFromToday(7),
    status: 'To Do'
  };

  $('#taskId').value = task ? task.id : '';
  $('#clientName').value = data.clientName;
  $('#projectName').value = data.projectName;
  $('#taskTitle').value = data.title;
  $('#taskDescription').value = data.description;
  $('#taskPriority').value = data.priority;
  $('#taskDueDate').value = data.dueDate;
  $('#taskStatus').value = data.status;

  $('#taskDialog').showModal();
  // Put the cursor in the first empty required field.
  const firstEmpty = ['#clientName', '#projectName', '#taskTitle'].find((sel) => !$(sel).value);
  $(firstEmpty || '#taskTitle').focus();
}

function closeTaskForm() {
  $('#taskDialog').close();
}

function handleFormSubmit(event) {
  event.preventDefault();   // stop the browser from reloading the page

  const values = {
    clientName: $('#clientName').value.trim(),
    projectName: $('#projectName').value.trim(),
    title: $('#taskTitle').value.trim(),
    description: $('#taskDescription').value.trim(),
    priority: $('#taskPriority').value,
    dueDate: $('#taskDueDate').value,
    status: $('#taskStatus').value
  };

  // Simple checks before saving.
  const missing = [];
  if (!values.clientName) missing.push('Client Name');
  if (!values.projectName) missing.push('Project Name');
  if (!values.title) missing.push('Task Title');
  if (!values.dueDate) missing.push('Due Date');
  if (missing.length) {
    $('#formError').textContent = 'Please fill in: ' + missing.join(', ') + '.';
    $('#formError').hidden = false;
    return;
  }

  const id = $('#taskId').value;
  const now = new Date().toISOString();

  if (id) {
    // EDIT: replace the old task with the updated one.
    tasks = tasks.map((t) => (t.id === id ? { ...t, ...values, updatedAt: now } : t));
    showToast('Task updated');
  } else {
    // ADD: put the new task at the start of the list.
    tasks.unshift({ id: Utils.createId(), ...values, createdAt: now, updatedAt: now });
    showToast('Task added');
  }

  saveTasks();
  closeTaskForm();
  renderAll();
}


/* ------------------------------------------------------------------
   7. TASK ACTIONS (status change, edit, delete, reset)
------------------------------------------------------------------- */
function updateStatus(id, status) {
  tasks = tasks.map((t) => (t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t));
  saveTasks();
  renderAll();
  showToast(`Status changed to "${status}"`);
}

function deleteTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  if (!confirm(`Delete the task "${task.title}"? This cannot be undone.`)) return;
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  renderAll();
  showToast('Task deleted');
}

function resetDemoData() {
  if (!confirm('Replace ALL tasks in this browser with the demo data? Your own tasks will be removed.')) return;
  tasks = createDemoTasks();
  clearFilters(false);
  saveTasks();
  renderAll();
  showToast('Demo data restored');
}

/* Jump to the Tasks section with some filters already applied. */
function viewTasksFor({ client = 'All', project = 'All', status = 'All' } = {}) {
  filters.search = '';
  filters.priority = 'All';
  filters.client = client;
  filters.project = project;
  filters.status = status;
  renderFilterOptions();
  renderTasks();
  goTo('tasks');
}

function clearFilters(redraw = true) {
  Object.assign(filters, { search: '', client: 'All', project: 'All', status: 'All', priority: 'All' });
  if (redraw) { renderFilterOptions(); renderTasks(); }
}


/* ------------------------------------------------------------------
   8. SMALL MESSAGE ("toast")
------------------------------------------------------------------- */
let toastTimer;
function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}


/* ------------------------------------------------------------------
   9. CONNECTING BUTTONS TO FUNCTIONS ("event listeners")
------------------------------------------------------------------- */
function bindEvents() {
  // Menu buttons
  document.querySelectorAll('.nav-link').forEach((btn) =>
    btn.addEventListener('click', () => goTo(btn.dataset.section)));
  window.addEventListener('hashchange', () => showSection(getSectionFromUrl()));

  // Top buttons
  $('#newTaskBtn').addEventListener('click', () => openTaskForm());
  $('#resetDemoBtn').addEventListener('click', resetDemoData);

  // Form
  $('#taskForm').addEventListener('submit', handleFormSubmit);
  $('#taskForm').addEventListener('input', () => { $('#formError').hidden = true; });
  $('#closeDialogBtn').addEventListener('click', closeTaskForm);
  $('#cancelDialogBtn').addEventListener('click', closeTaskForm);
  // Clicking the dark area outside the form closes it.
  $('#taskDialog').addEventListener('click', (e) => { if (e.target.id === 'taskDialog') closeTaskForm(); });

  // Filters
  $('#filterSearch').addEventListener('input', (e) => { filters.search = e.target.value; renderTasks(); });
  $('#filterClient').addEventListener('change', (e) => {
    filters.client = e.target.value;
    filters.project = 'All';
    renderFilterOptions();
    renderTasks();
  });
  $('#filterProject').addEventListener('change', (e) => { filters.project = e.target.value; renderTasks(); });
  $('#filterStatus').addEventListener('change', (e) => { filters.status = e.target.value; renderTasks(); });
  $('#filterPriority').addEventListener('change', (e) => { filters.priority = e.target.value; renderTasks(); });
  $('#clearFiltersBtn').addEventListener('click', () => clearFilters());

  // Task table: one listener handles every row ("event delegation").
  $('#taskTableBody').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = btn.closest('tr').dataset.id;
    if (btn.dataset.action === 'edit') openTaskForm(tasks.find((t) => t.id === id));
    if (btn.dataset.action === 'delete') deleteTask(id);
  });
  $('#taskTableBody').addEventListener('change', (e) => {
    if (e.target.dataset.action === 'status') updateStatus(e.target.closest('tr').dataset.id, e.target.value);
  });

  // Overview stat cards -> open the Tasks section filtered by that status.
  $('#statsGrid').addEventListener('click', (e) => {
    const card = e.target.closest('[data-status-filter]');
    if (card) viewTasksFor({ status: card.dataset.statusFilter });
  });

  // Client & project cards: "View tasks" and "+ Add task".
  // (The browser automatically turns &amp; etc. back into normal text in dataset values.)
  ['#clientGrid', '#projectGrid'].forEach((sel) => {
    $(sel).addEventListener('click', (e) => {
      const view = e.target.closest('[data-view-client]');
      if (view) viewTasksFor({ client: view.dataset.viewClient, project: view.dataset.viewProject || 'All' });
      const add = e.target.closest('[data-add-for-client]');
      if (add) openTaskForm(null, { clientName: add.dataset.addForClient, projectName: add.dataset.addForProject || '' });
    });
  });
}

// Start the app once the page has loaded.
document.addEventListener('DOMContentLoaded', init);
