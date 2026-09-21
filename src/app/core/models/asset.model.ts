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
  /** "City (lat, lng)" display label resolved by the backend. */
  siteLabel: string;
  typeName: string;
  createdAtUtc?: string | null;
  lastModifiedAtUtc?: string | null;
}

export interface PlantPayload {
  name: string;
  siteId: number;
  plantTypeId: number;
}
