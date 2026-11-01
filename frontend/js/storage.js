(function () {
  const KEY = "schoolstock-demo-v1";
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function load() {
    try {
      const saved = localStorage.getItem(KEY);
      if (!saved) {
        const initial = clone(window.SchoolStockSeed);
        localStorage.setItem(KEY, JSON.stringify(initial));
        return initial;
      }
      const parsed = JSON.parse(saved);
      for (const key of Object.keys(window.SchoolStockSeed)) {
        if (!(key in parsed) || !Array.isArray(parsed[key]) && key !== "settings") parsed[key] = clone(window.SchoolStockSeed[key]);
      }
      parsed.users = parsed.users.map((user, index) => {
        const seedUser = window.SchoolStockSeed.users.find(seed => seed.username === user.username);
        return {
          ...user,
          email: user.email || seedUser?.email || `demo.user${index + 1}@example.test`,
          phone: user.phone || seedUser?.phone || "Not provided",
          createdAt: user.createdAt || seedUser?.createdAt || "2026-01-01T09:00:00.000Z"
        };
      });
      return parsed;
    } catch (error) {
      console.error("Unable to load TrackNStock demo data.", error);
      throw new Error("Your browser could not load the demo data. Enable localStorage or reset site data.");
    }
  }
  let state = load();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (error) {
      console.error("Unable to save TrackNStock demo data.", error);
      throw new Error("The browser could not save changes. Check available storage and browser privacy settings.");
    }
  }
  window.SchoolStock = {
    get: () => state,
    save,
    reset() { state = clone(window.SchoolStockSeed); save(); },
    nextId(collection) { return Math.max(0, ...state[collection].map(item => Number(item.id) || 0)) + 1; }
  };
})();
