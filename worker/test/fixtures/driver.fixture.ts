/**
 * Driver test fixtures
 */

import type { Driver } from "../../../shared/types";

let driverIdCounter = 1;

// Real-ish F1 driver data for realistic tests
const F1_DRIVERS = [
  {
    code: "VER",
    name: "Max Verstappen",
    number: 1,
    team: "Red Bull Racing",
    teamColor: "#3671C6",
  },
  {
    code: "PER",
    name: "Sergio Perez",
    number: 11,
    team: "Red Bull Racing",
    teamColor: "#3671C6",
  },
  {
    code: "HAM",
    name: "Lewis Hamilton",
    number: 44,
    team: "Ferrari",
    teamColor: "#E8002D",
  },
  {
    code: "LEC",
    name: "Charles Leclerc",
    number: 16,
    team: "Ferrari",
    teamColor: "#E8002D",
  },
  {
    code: "NOR",
    name: "Lando Norris",
    number: 4,
    team: "McLaren",
    teamColor: "#FF8000",
  },
  {
    code: "PIA",
    name: "Oscar Piastri",
    number: 81,
    team: "McLaren",
    teamColor: "#FF8000",
  },
  {
    code: "RUS",
    name: "George Russell",
    number: 63,
    team: "Mercedes",
    teamColor: "#27F4D2",
  },
  {
    code: "ANT",
    name: "Kimi Antonelli",
    number: 12,
    team: "Mercedes",
    teamColor: "#27F4D2",
  },
  {
    code: "ALO",
    name: "Fernando Alonso",
    number: 14,
    team: "Aston Martin",
    teamColor: "#229971",
  },
  {
    code: "STR",
    name: "Lance Stroll",
    number: 18,
    team: "Aston Martin",
    teamColor: "#229971",
  },
];

export interface CreateDriverOptions {
  id?: number;
  seasonId?: number;
  code?: string;
  name?: string;
  number?: number;
  team?: string;
  teamColor?: string;
  createdAt?: string;
}

export function createDriver(options: CreateDriverOptions = {}): Driver {
  const id = options.id ?? driverIdCounter++;
  // Use realistic F1 data based on ID
  const templateIndex = (id - 1) % F1_DRIVERS.length;
  const template = F1_DRIVERS[templateIndex];

  return {
    id,
    season_id: options.seasonId ?? 1,
    code: options.code ?? template.code,
    name: options.name ?? template.name,
    number: options.number ?? template.number,
    team: options.team ?? template.team,
    team_color: options.teamColor ?? template.teamColor,
    created_at: options.createdAt ?? new Date().toISOString(),
  };
}

export function createDrivers(
  count: number,
  options: CreateDriverOptions = {},
): Driver[] {
  return Array.from({ length: count }, () => createDriver(options));
}

export function resetDriverIdCounter(): void {
  driverIdCounter = 1;
}
