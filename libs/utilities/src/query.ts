import { is } from './is';

export type FilterValueType =
  | string
  | boolean
  | number
  | Date
  | RegExp
  | unknown
  | Record<string, string>;
export enum FILTER_OPERATIONS {
  // "elemMatch" functionality in mongo
  // eslint-disable-next-line unicorn/prevent-abbreviations
  elem = 'elem',
  regex = 'regex',
  in = 'in',
  nin = 'nin',
  lt = 'lt',
  lte = 'lte',
  gt = 'gt',
  gte = 'gte',
  ne = 'ne',
  eq = 'eq',
}
export class ComparisonDTO {
  public operation?: FILTER_OPERATIONS;
  public value?: FilterValueType | FilterValueType[];
}

export class FilterDTO extends ComparisonDTO {
  public exists?: boolean;
  public field?: string;
}

export class ResultControlDTO {
  public filters?: Set<FilterDTO>;
  public limit?: number;
  public select?: string[];
  public skip?: number;
  public sort?: string[];
}

export function controlToQuery(
  value: Readonly<ResultControlDTO>,
): Record<string, string> {
  const out = new Map<string, string>();
  if (value?.limit) {
    out.set('limit', value.limit.toString());
  }
  if (value?.skip) {
    out.set('skip', value.skip.toString());
  }
  if (value?.sort) {
    out.set('sort', value.sort.join(','));
  }
  if (value?.select) {
    out.set('select', value.select.join(','));
  }
  value?.filters?.forEach(f => {
    let field = f.field;
    if (f.operation && f.operation !== FILTER_OPERATIONS.eq) {
      field = `${field}__${f.operation}`;
    }
    let value = f.value;
    if (Array.isArray(value)) {
      value = value.join(',');
    }
    if (value instanceof Date) {
      value = value.toISOString();
    }
    if (value === null) {
      value = 'null';
    }
    out.set(field, value.toString());
  });
  return Object.fromEntries(out.entries());
}

export function buildFilter(
  key: string,
  value: FilterValueType | FilterValueType[],
): FilterDTO {
  const [name, operation] = key.split('__') as [string, FILTER_OPERATIONS];
  switch (operation) {
    case 'in':
    case 'nin':
      if (!Array.isArray(value)) {
        value = is.string(value) ? value.split(',') : [value];
      }
      return {
        field: name,
        operation,
        value: value,
      };
    case 'elem':
      return {
        field: name,
        operation,
        value: is.string(value) ? JSON.parse(value) : value,
      };
    default:
      return {
        field: name,
        operation,
        value,
      };
  }
}

export function queryToControl(
  value: Readonly<Record<string, string>>,
): ResultControlDTO {
  const out: ResultControlDTO = {
    filters: new Set(),
  };
  const parameters = new Map<string, string>(Object.entries(value));
  parameters.forEach((value, key) => {
    const [name, operation] = key.split('__') as [string, FILTER_OPERATIONS];
    switch (key) {
      case 'select':
        out.select = value.split(',');
        return;
      case 'sort':
        out.sort = value.split(',');
        return;
      case 'limit':
        out.limit = Number(value);
        return;
      case 'skip':
        out.skip = Number(value);
        return;
    }
    switch (operation) {
      case 'in':
      case 'nin':
        out.filters.add({
          field: name,
          operation,
          value: value.split(','),
        });
        return;
      case 'elem':
        out.filters.add({
          field: name,
          operation,
          value: JSON.parse(value),
        });
        return;
      default:
        out.filters.add({
          field: name,
          operation,
          value,
        });
    }
  });
  return out;
}