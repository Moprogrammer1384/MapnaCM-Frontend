import type { InheritedEmployer, Plant, TaxonomyParentOption } from '../models/asset-taxonomy.model';

/** Saved parent IDs remain distinct even when their display labels match. */
export function buildParentOptions(parents: readonly Pick<Plant, 'id' | 'name' | 'hierarchyLabel'>[]): TaxonomyParentOption[] {
  const options: TaxonomyParentOption[] = [];
  for (const parent of parents) {
    if (parent.id !== undefined) {
      options.push({ id: parent.id, label: parent.hierarchyLabel ?? parent.name });
    }
  }
  return options.sort((left, right) => left.label.localeCompare(right.label));
}

/** Build a fresh relationship map, preserving zero IDs and skipping blank forms. */
export function buildParentIdMap<T extends { id?: number }>(
  records: readonly T[],
  parentIdOf: (record: T) => number | null
): Record<number, number> {
  const parentIds: Record<number, number> = {};
  for (const record of records) {
    if (record.id !== undefined) {
      const parentId = parentIdOf(record);
      if (parentId !== null) {
        parentIds[record.id] = parentId;
      }
    }
  }
  return parentIds;
}

export function buildPlantEmployerMap(plants: readonly Plant[]): Record<number, InheritedEmployer> {
  const employers: Record<number, InheritedEmployer> = {};
  for (const plant of plants) {
    if (plant.id !== undefined) {
      employers[plant.id] = { id: plant.employerId ?? null, name: plant.employerName || '\u2014' };
    }
  }
  return employers;
}

/** Follow maps from the selected parent towards its Plant; missing links stay unassigned. */
export function resolveInheritedEmployer(
  parentId: number | null,
  employers: Readonly<Record<number, InheritedEmployer>>,
  ...parentIdMaps: readonly Readonly<Record<number, number>>[]
): InheritedEmployer | undefined {
  let plantId: number | undefined = parentId ?? undefined;
  for (const parentIds of parentIdMaps) {
    if (plantId === undefined) {
      return undefined;
    }
    plantId = parentIds[plantId];
  }
  return plantId === undefined ? undefined : employers[plantId];
}
