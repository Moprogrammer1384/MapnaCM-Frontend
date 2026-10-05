/**
 * Wire models of the MapnaCM backend Asset module (Site / PlantType / Plant
 * taxonomy). Field names are the camelCased C# properties of the Response<T>
 * envelope.
 */

export interface Site {
  id: number;
  city: string;
  address: string;
  latitude: string;
  longitude: string;
  location: string;
  elevation: string;
  createdAtUtc?: string | null;
  lastModifiedAtUtc?: string | null;
}

export interface SitePayload {
  city: string;
  address: string;
  latitude: string;
  longitude: string;
  location: string;
  elevation: string;
}

export interface PlantType {
  id: number;
  name: string;
  createdAtUtc?: string | null;
  lastModifiedAtUtc?: string | null;
}

export interface Plant {
  id: number;
  name: string;
  siteId: number;
  plantTypeId: number;
  /** Identity user id carrying the Employer role; null = no employer. */
  employerId?: string | null;
  /** Display snapshot of the employer user's name; null = no employer. */
  employerName?: string | null;
  /** "City (lat, lng)" display label resolved by the backend. */
  siteLabel: string;
  /** Full hierarchy top-down incl. self: "City - TypeName - PlantName". */
  hierarchyLabel: string;
  typeName: string;
  createdAtUtc?: string | null;
  lastModifiedAtUtc?: string | null;
}

export interface PlantPayload {
  name: string;
  siteId: number;
  plantTypeId: number;
  /** Null clears the assignment (plants may have no employer). */
  employerId?: string | null;
  employerName?: string | null;
}

/** One unit of a plant (Unit -> Plant). */
export interface Unit {
  id: number;
  name: string;
  plantId: number;
  plantName: string;
  /** Full ancestor chain top-down: "City - TypeName - PlantName". */
  plantLabel: string;
  /** Ancestor chain + self: "City - TypeName - PlantName - UnitName". */
  hierarchyLabel: string;
  createdAtUtc?: string | null;
  lastModifiedAtUtc?: string | null;
}

export interface UnitPayload {
  name: string;
  plantId: number;
}

/** The UI's "System" taxonomy level (System -> Unit -> Plant). */
export interface AssetSystem {
  id: number;
  name: string;
  unitId: number;
  unitName: string;
  /** Full ancestor chain top-down: "City - TypeName - PlantName - UnitName". */
  unitLabel: string;
  /** Ancestor chain + self: "City - TypeName - PlantName - UnitName - SystemName". */
  hierarchyLabel: string;
  createdAtUtc?: string | null;
  lastModifiedAtUtc?: string | null;
}

export interface SystemPayload {
  name: string;
  unitId: number;
}

/** An asset in the taxonomy (Asset -> System -> Unit -> Plant). */
export interface Asset {
  id: number;
  name: string;
  tag?: string | null;
  systemId: number;
  systemName: string;
  /** Full ancestor chain top-down: "City - TypeName - PlantName - UnitName - SystemName". */
  systemLabel: string;
  /** Ancestor chain + self: "City - TypeName - PlantName - UnitName - SystemName - AssetName". */
  hierarchyLabel: string;
  createdAtUtc?: string | null;
  lastModifiedAtUtc?: string | null;
}

export interface AssetPayload {
  name: string;
  tag?: string;
  systemId: number;
}

/** A component belonging to an asset (Component -> Asset -> System -> Unit -> Plant). */
export interface TaxonomyComponent {
  id: number;
  name: string;
  tag?: string | null;
  assetId: number;
  assetName: string;
  /** Full ancestor chain top-down: "City - TypeName - Plant - Unit - System - AssetName". */
  assetLabel: string;
  /** Ancestor chain + self: "City - TypeName - Plant - Unit - System - Asset - ComponentName". */
  hierarchyLabel: string;
  createdAtUtc?: string | null;
  lastModifiedAtUtc?: string | null;
}

export interface ComponentPayload {
  name: string;
  tag?: string;
  assetId: number;
}

/** A measurement belonging to a component (leaf of the taxonomy). */
export interface TaxonomyMeasurement {
  id: number;
  name: string;
  tag?: string | null;
  /** Null on rows created before measurement types existed. */
  measurementTypeId: number | null;
  /** Type display name, joined by the backend (null on legacy rows). */
  typeName: string | null;
  /** Unit of the measurement type, joined by the backend (null on legacy rows). */
  unit: string | null;
  sensitivity: number | null;
  componentId: number;
  componentName: string;
  /** Full ancestor chain top-down: "City - TypeName - Plant - Unit - System - Asset - ComponentName". */
  componentLabel: string;
  /** Ancestor chain + self: "... - Component - MeasurementName". */
  hierarchyLabel: string;
  createdAtUtc?: string | null;
  lastModifiedAtUtc?: string | null;
}

export interface MeasurementPayload {
  name: string;
  tag?: string;
  measurementTypeId: number;
  sensitivity: number;
  componentId: number;
}

/** The type of a measurement (Name + Unit), managed like plant types. */
export interface MeasurementType {
  id: number;
  name: string;
  unit: string;
  createdAtUtc?: string | null;
  lastModifiedAtUtc?: string | null;
}

export interface MeasurementTypePayload {
  name: string;
  unit: string;
}

/** Row of GET /User/GetUsersByRole (Identity users carrying a role). */
export interface RoleUser {
  id: string;
  userName: string;
  firstName?: string | null;
  lastName?: string | null;
}
