/**
 * Placeholder employer data. The backend has no Employer yet, so each plant's
 * employer is resolved here from its name; units, systems and assets inherit
 * the employer of the plant they belong to. Replace with API data once the
 * backend exposes it.
 */
export const EMPLOYERS = [
  'Tehran Power Generation Co.',
  'Isfahan Power Generation Co.',
  'Khorasan Power Generation Co.',
  'Fars Power Generation Co.',
  'Azarbaijan Power Generation Co.',
  'Khuzestan Power Generation Co.',
  'Hormozgan Power Generation Co.',
  'Kerman Power Generation Co.',
  'Renewable Energy Generation Co.',
];

// Plant name -> employer (one employer per plant).
const PLANT_EMPLOYERS: Record<string, string> = {
  'Parand Combined Cycle Power Plant': 'Tehran Power Generation Co.',
  'Mapna Turbine Engineering (TUGA)': 'Tehran Power Generation Co.',
  'Pars Generator Plant': 'Tehran Power Generation Co.',
  'Qom Combined Cycle Power Plant': 'Tehran Power Generation Co.',
  'Isfahan Combined Cycle Power Plant': 'Isfahan Power Generation Co.',
  'Shazand Power Plant': 'Isfahan Power Generation Co.',
  'Mashhad Gas Power Plant': 'Khorasan Power Generation Co.',
  'Fars Combined Cycle Power Plant': 'Fars Power Generation Co.',
  'Asaluyeh Combined Cycle Power Plant': 'Fars Power Generation Co.',
  'Tabriz Thermal Power Plant': 'Azarbaijan Power Generation Co.',
  'Ahvaz Zargan Power Plant': 'Khuzestan Power Generation Co.',
  'Bandar Abbas Steam Power Plant': 'Hormozgan Power Generation Co.',
  'Kerman Combined Cycle Power Plant': 'Kerman Power Generation Co.',
  'Yazd Solar Power Plant': 'Renewable Energy Generation Co.',
  'Manjil Wind Farm': 'Renewable Energy Generation Co.',
};

// Employers picked in the Add / Edit Plant form. The backend cannot store
// them yet, so they are kept in localStorage and win over the defaults above.
const ASSIGNED_KEY = 'asset-taxonomy-plant-employers';
const assigned: Record<string, string> = loadAssigned();

function loadAssigned(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(ASSIGNED_KEY) || '{}');
  } catch {
    return {};
  }
}

/** Remember the employer chosen for a plant in the Plant form. */
export function assignEmployer(plantName: string, employer: string): void {
  assigned[plantName] = employer;
  try {
    localStorage.setItem(ASSIGNED_KEY, JSON.stringify(assigned));
  } catch {
    // Storage unavailable: the assignment still lasts for this session.
  }
}

/**
 * Employer of the plant named in `text`, which may be a plant name or any
 * label containing it ("Unit 1 - Parand Combined Cycle Power Plant").
 * Unknown plants (e.g. created through the API) get a stable pick from the
 * list, so the same plant always shows the same employer.
 */
export function employerOf(text: string): string {
  if (assigned[text]) {
    return assigned[text];
  }
  const assignedPlant = Object.keys(assigned).find((name) => text.includes(name));
  if (assignedPlant) {
    return assigned[assignedPlant];
  }
  const plant = Object.keys(PLANT_EMPLOYERS).find((name) => text.includes(name));
  if (plant) {
    return PLANT_EMPLOYERS[plant];
  }
  let hash = 0;
  for (const ch of text) {
    hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  }
  return EMPLOYERS[hash % EMPLOYERS.length];
}
