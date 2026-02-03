export type DemoScenarioId = "showcase" | "fresh" | "locked" | "admin";

export type DemoScenario = {
  id: DemoScenarioId;
  label: string;
  description: string;
};

export const DEFAULT_DEMO_SCENARIO: DemoScenarioId = "showcase";

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "showcase",
    label: "Showcase",
    description: "Open pick window with mixed race states.",
  },
  {
    id: "fresh",
    label: "New Player",
    description: "No picks yet, clean slate.",
  },
  {
    id: "locked",
    label: "Locked Picks",
    description: "Qualifying passed, picks locked.",
  },
  {
    id: "admin",
    label: "Admin",
    description: "Admin user with pending races.",
  },
];
