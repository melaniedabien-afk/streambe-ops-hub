/**
 * Adaptador de persistencia para Streambe Ops Hub.
 *
 * La app fue prototipada dentro de un artifact de Claude, que expone un
 * `window.storage` con una API remota (get/set/delete/list). Para que la
 * app funcione como proyecto standalone (GitHub Pages, Vercel, Netlify,
 * un server propio, etc.) esta capa reimplementa la misma interfaz usando
 * localStorage del navegador, así el resto del código (App.jsx) no
 * necesita tocarse.
 *
 * IMPORTANTE — diferencia de comportamiento vs. la versión original:
 * En el artifact de Claude, las claves marcadas como "shared" se
 * compartían entre todas las personas que abrían el mismo artifact
 * (por ejemplo, para que vos y Vani vieran el mismo calendario).
 * Con localStorage, los datos quedan guardados SOLO en el navegador de
 * cada persona — no hay backend real. Si necesitás que el equipo
 * comparta datos de verdad, hay que sumar un backend (ver README.md).
 */

const PREFIX = "streambe-ops-hub";

function fullKey(key, shared) {
  return `${PREFIX}:${shared ? "shared" : "local"}:${key}`;
}

window.storage = {
  async get(key, shared = false) {
    try {
      const raw = localStorage.getItem(fullKey(key, shared));
      if (raw === null) return null;
      return { key, value: raw, shared };
    } catch (err) {
      console.error("storage.get error", err);
      return null;
    }
  },

  async set(key, value, shared = false) {
    try {
      localStorage.setItem(fullKey(key, shared), value);
      return { key, value, shared };
    } catch (err) {
      console.error("storage.set error", err);
      return null;
    }
  },

  async delete(key, shared = false) {
    try {
      localStorage.removeItem(fullKey(key, shared));
      return { key, deleted: true, shared };
    } catch (err) {
      console.error("storage.delete error", err);
      return null;
    }
  },

  async list(prefix = "", shared = false) {
    try {
      const scope = fullKey("", shared);
      const keys = Object.keys(localStorage)
        .filter((k) => k.startsWith(scope + prefix))
        .map((k) => k.slice(scope.length));
      return { keys, prefix, shared };
    } catch (err) {
      console.error("storage.list error", err);
      return null;
    }
  },
};
