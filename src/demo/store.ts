import { buildDemoData, type DemoData } from "./data";
import { DEFAULT_DEMO_SCENARIO, type DemoScenarioId } from "./scenarios";

const DEMO_STATE_KEY = "f1_picks_2026_demo_state";
const DEMO_DATA_PREFIX = "f1_picks_2026_demo_data_";

const cache = new Map<DemoScenarioId, DemoData>();

const canUseStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const readStorage = (key: string) => {
  if (!canUseStorage()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key: string, value: string) => {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures in demo mode
  }
};

const removeStorage = (key: string) => {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage failures in demo mode
  }
};

export const isDemoMode = () => {
  if (typeof import.meta === "undefined") return false;
  const env = (import.meta as ImportMeta).env;
  return !!env && env.VITE_DEMO_MODE === "true";
};

export const getDemoScenario = (): DemoScenarioId => {
  const stored = readStorage(DEMO_STATE_KEY);
  if (
    stored === "showcase" ||
    stored === "fresh" ||
    stored === "locked" ||
    stored === "admin"
  ) {
    return stored;
  }
  return DEFAULT_DEMO_SCENARIO;
};

export const setDemoScenario = (scenario: DemoScenarioId) => {
  writeStorage(DEMO_STATE_KEY, scenario);
  cache.delete(scenario);
};

const getDemoDataKey = (scenario: DemoScenarioId) =>
  `${DEMO_DATA_PREFIX}${scenario}`;

export const resetDemoData = (scenario?: DemoScenarioId) => {
  const target = scenario ?? getDemoScenario();
  cache.delete(target);
  removeStorage(getDemoDataKey(target));
};

const readDemoData = (scenario: DemoScenarioId): DemoData | null => {
  const stored = readStorage(getDemoDataKey(scenario));
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored) as DemoData;
    if (parsed && parsed.scenario === scenario) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
};

const writeDemoData = (scenario: DemoScenarioId, data: DemoData) => {
  writeStorage(getDemoDataKey(scenario), JSON.stringify(data));
};

export const getDemoData = (): DemoData => {
  const scenario = getDemoScenario();
  const cached = cache.get(scenario);
  if (cached) return cached;

  const stored = readDemoData(scenario);
  if (stored) {
    cache.set(scenario, stored);
    return stored;
  }

  const fresh = buildDemoData(scenario);
  cache.set(scenario, fresh);
  writeDemoData(scenario, fresh);
  return fresh;
};

export const updateDemoData = (
  updater: (current: DemoData) => DemoData,
): DemoData => {
  const scenario = getDemoScenario();
  const current = getDemoData();
  const next = updater(current);
  cache.set(scenario, next);
  writeDemoData(scenario, next);
  return next;
};
