/**
 * Shared DARP taxonomy entities used by API data, tables and editable forms.
 * An absent ID represents a new record; nullable selections represent blank forms.
 * Joined labels/audit fields are optional and are excluded from API writes.
 */

export interface Site {
  id?: number;
  city: string;
  address: string;
  latitude: string;
  longitude: string;
  location: string;
  elevation: number | null;
  createdAtUtc?: string | null;
  lastModifiedAtUtc?: string | null;
}

export interface PlantType {
  id?: number;
  name: string;
  createdAtUtc?: string | null;
  lastModifiedAtUtc?: string | null;
}

export interface Plant {
  id?: number;
  name: string;
  siteId: number | null;
  plantTypeId: number | null;
  /** Identity user id carrying the Employer role; null = no employer. */
  employerId?: string | null;
  /** Display snapshot of the employer user's name; null = no employer. */
  employerName?: string | null;
  /** "City (lat, lng)" display label resolved by the backend. */
  siteLabel?: string;
  /** Full hierarchy top-down incl. self: "City - TypeName - PlantName". */
  hierarchyLabel?: string;
  typeName?: string;
  createdAtUtc?: string | null;
  lastModifiedAtUtc?: string | null;
}

/** One unit of a plant (Unit -> Plant). */
export interface Unit {
  id?: number;
  name: string;
  plantId: number | null;
  plantName?: string;
  /** Full ancestor chain top-down: "City - TypeName - PlantName". */
  plantLabel?: string;
  /** Ancestor chain + self: "City - TypeName - PlantName - UnitName". */
  hierarchyLabel?: string;
  createdAtUtc?: string | null;
  lastModifiedAtUtc?: string | null;
  /** Employer inherited from the ancestor Plant for display/filtering. */
  employerId?: string | null;
  employerName?: string | null;
}

/** The UI's "System" taxonomy level (System -> Unit -> Plant). */
export interface AssetSystem {
  id?: number;
  name: string;
  unitId: number | null;
  unitName?: string;
  /** Full ancestor chain top-down: "City - TypeName - PlantName - UnitName". */
  unitLabel?: string;
  /** Ancestor chain + self: "City - TypeName - PlantName - UnitName - SystemName". */
  hierarchyLabel?: string;
  createdAtUtc?: string | null;
  lastModifiedAtUtc?: string | null;
  /** Employer inherited from the ancestor Plant for display/filtering. */
  employerId?: string | null;
  employerName?: string | null;
}

/** An asset in the taxonomy (Asset -> System -> Unit -> Plant). */
export interface Asset {
  id?: number;
  name: string;
  tag?: string | null;
  systemId: number | null;
  systemName?: string;
  /** Full ancestor chain top-down: "City - TypeName - PlantName - UnitName - SystemName". */
  systemLabel?: string;
  /** Ancestor chain + self: "City - TypeName - PlantName - UnitName - SystemName - AssetName". */
  hierarchyLabel?: string;
  createdAtUtc?: string | null;
  lastModifiedAtUtc?: string | null;
  /** Employer inherited from the ancestor Plant for display/filtering. */
  employerId?: string | null;
  employerName?: string | null;
}

/** A component belonging to an asset (Component -> Asset -> System -> Unit -> Plant). */
export interface Component {
  id?: number;
  name: string;
  tag?: string | null;
  assetId: number | null;
  assetName?: string;
  /** Full ancestor chain top-down: "City - TypeName - Plant - Unit - System - AssetName". */
  assetLabel?: string;
  /** Ancestor chain + self: "City - TypeName - Plant - Unit - System - Asset - ComponentName". */
  hierarchyLabel?: string;
  createdAtUtc?: string | null;
  lastModifiedAtUtc?: string | null;
  /** Employer inherited from the ancestor Plant for display/filtering. */
  employerId?: string | null;
  employerName?: string | null;
}

/** A measurement belonging to a component (leaf of the taxonomy). */
export interface Measurement {
  id?: number;
  name: string;
  tag?: string | null;
  /** Null on rows created before measurement types existed. */
  measurementTypeId: number | null;
  /** Type display name, joined by the backend (null on legacy rows). */
  typeName?: string | null;
  /** Unit of the measurement type, joined by the backend (null on legacy rows). */
  unit?: string | null;
  sensitivity: number | null;
  componentId: number | null;
  componentName?: string;
  /** Full ancestor chain top-down: "City - TypeName - Plant - Unit - System - Asset - ComponentName". */
  componentLabel?: string;
  /** Ancestor chain + self: "... - Component - MeasurementName". */
  hierarchyLabel?: string;
  createdAtUtc?: string | null;
  lastModifiedAtUtc?: string | null;
  /** Employer inherited from the ancestor Plant for display/filtering. */
  employerId?: string | null;
  employerName?: string | null;
}

/** The type of a measurement (Name + Unit), managed like plant types. */
export interface MeasurementType {
  id?: number;
  name: string;
  unit: string;
  createdAtUtc?: string | null;
  lastModifiedAtUtc?: string | null;
}

/** Row of GET /User/GetUsersByRole (Identity users carrying a role). */
export interface RoleUser {
  id: string;
  userName: string;
  firstName?: string | null;
  lastName?: string | null;
}

/** Numeric parent selection with its display-only hierarchy label. */
export interface TaxonomyParentOption {
  id: number;
  label: string;
}

/** Selectable Identity user for Plant assignment and taxonomy employer filters. */
export interface EmployerOption {
  id: string;
  name: string;
}

/** Employer snapshot inherited from a Plant; the assignment can be absent. */
export interface InheritedEmployer {
  id: string | null;
  name: string;
}
