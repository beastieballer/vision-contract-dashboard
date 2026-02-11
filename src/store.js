import fs from "node:fs";
import path from "node:path";

const dataDir = path.resolve(process.cwd(), "data");
const dbPath = path.join(dataDir, "db.json");
const seedPath = path.join(dataDir, "db.seed.json");
const settingsPath = path.join(dataDir, "settings.json");
const defaultSettingsPath = path.join(dataDir, "settings.default.json");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function writeJsonFileAtomic(filePath, value) {
  ensureDir(path.dirname(filePath));
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(value, null, 2) + "\n", "utf8");
  fs.renameSync(tmpPath, filePath);
}

function loadDb() {
  ensureDir(dataDir);

  if (!fs.existsSync(dbPath)) {
    const seed = readJsonFile(seedPath);
    if (seed) writeJsonFileAtomic(dbPath, seed);
    else writeJsonFileAtomic(dbPath, { version: 1, leads: [], tasks: [], quotes: [], messages: [] });
  }

  const db = readJsonFile(dbPath);
  if (!db) return { version: 1, leads: [], tasks: [], quotes: [], messages: [] };
  db.version ??= 1;
  db.leads ??= [];
  db.tasks ??= [];
  db.quotes ??= [];
  db.messages ??= [];
  return db;
}

function saveDb(db) {
  writeJsonFileAtomic(dbPath, db);
}

function loadSettings() {
  ensureDir(dataDir);

  if (!fs.existsSync(settingsPath)) {
    const defaults = readJsonFile(defaultSettingsPath);
    if (defaults) writeJsonFileAtomic(settingsPath, defaults);
  }

  const settings = readJsonFile(settingsPath);
  return settings ?? {};
}

function saveSettings(settings) {
  writeJsonFileAtomic(settingsPath, settings);
}

export const Store = {
  loadDb,
  saveDb,
  loadSettings,
  saveSettings
};

