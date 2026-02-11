import { Store } from "./store.js";
import { nowIso } from "./time.js";

let cached = null;

export function getSettings() {
  cached ??= Store.loadSettings();
  return cached;
}

export function patchSettings(patch) {
  const current = { ...getSettings() };
  const next = { ...current, ...patch, updatedAt: nowIso() };
  cached = next;
  Store.saveSettings(next);
  return next;
}

