import { HttpParams } from '@angular/common/http';
import { QueryCriteria } from '../models/user-management.model';

/**
 * Serializes Shared.Core QueryCriteria into the ASP.NET [FromQuery] binding
 * syntax: Skip/Take plus indexed Filters[i]/Sorts[i] entries, e.g.
 * `?Skip=0&Take=15&Filters[0].PropertyName=Email&Filters[0].Operation=Conatains`
 * (enum values bind by name server-side; the "Conatains" spelling is the
 * backend enum's own).
 */
export function criteriaToHttpParams(criteria: QueryCriteria): HttpParams {
  let params = new HttpParams()
    .set('Skip', String(criteria.skip ?? 0))
    .set('Take', String(criteria.take ?? 0));

  (criteria.filters || []).forEach((filter, index) => {
    params = params
      .set(`Filters[${index}].PropertyName`, filter.propertyName)
      .set(`Filters[${index}].Operation`, filter.operation)
      .set(`Filters[${index}].Value`, filter.value ?? '');

    if (filter.logicalOperator) {
      params = params.set(`Filters[${index}].LogicalOperator`, filter.logicalOperator);
    }
  });

  (criteria.sorts || []).forEach((sort, index) => {
    params = params
      .set(`Sorts[${index}].PropertyName`, sort.propertyName)
      .set(`Sorts[${index}].IsAscending`, String(sort.isAscending !== false));
  });

  return params;
}
