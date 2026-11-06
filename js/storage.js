/*
  storage.js - saving and loading tasks.

  IMPORTANT: localStorage is a small storage box INSIDE ONE BROWSER on ONE
  device. It is NOT a shared database:
    - Your teammates will NOT see your tasks.
    - A different browser (e.g. Chrome vs Safari) or device starts empty.
    - Clearing browser data / site data will erase the tasks.
  A shared database can be added in a later version.
*/

const HubStorage = {
  /* The name ("key") our data is saved under. "v1" lets us change the
     format later without mixing up old and new data. */
  KEY: 'markitalHub.tasks.v1',

  /* Returns the saved list of tasks, or null if nothing is saved yet
     (or if the saved data is unreadable). */
  load() {
    try {
      const raw = localStorage.getItem(HubStorage.KEY);
      if (raw === null) return null;
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : null;
    } catch (error) {
      console.warn('Could not load saved tasks:', error);
      return null;
    }
  },

  /* Saves the list of tasks. Returns true if it worked, false if the
     browser refused (for example in some private-browsing modes). */
  save(tasks) {
    try {
      localStorage.setItem(HubStorage.KEY, JSON.stringify(tasks));
      return true;
    } catch (error) {
      console.warn('Could not save tasks:', error);
      return false;
    }
  }
};
