/*
  utils.js - small helper functions used by the rest of the app.
  Think of this as a toolbox: nothing here touches the page directly.
*/

const Utils = {
  /* Turn a JavaScript Date into text like "2026-11-06" (the format date inputs use). */
  toISODate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  /* Today's date as "YYYY-MM-DD". */
  today() {
    return Utils.toISODate(new Date());
  },

  /* A date N days from today (use a negative number for the past). */
  daysFromToday(n) {
    const date = new Date();
    date.setDate(date.getDate() + n);
    return Utils.toISODate(date);
  },

  /* Show "YYYY-MM-DD" in a friendly way, e.g. "6 Nov 2026". */
  formatDate(iso) {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  },

  /* A task is overdue if it is not finished and its due date is before today.
     Dates in "YYYY-MM-DD" form can be compared as plain text. */
  isOverdue(task) {
    return task.status !== 'Done' && !!task.dueDate && task.dueDate < Utils.today();
  },

  /* Make a unique id for a new task, e.g. "t_lq3k9x2ab". */
  createId() {
    return 't_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  },

  /* SECURITY: before putting text typed by a user into the page as HTML,
     we convert special characters like < and > so they show as text and
     cannot run as code. Always use this for user-entered text. */
  escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  },

  /* Percentage helper that never divides by zero. */
  percent(part, total) {
    return total === 0 ? 0 : Math.round((part / total) * 100);
  },

  /* Turn "In Progress" into "in-progress" so we can use it as a CSS class. */
  slug(text) {
    return String(text).toLowerCase().replace(/\s+/g, '-');
  }
};
