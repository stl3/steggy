export const INVERT_VALUE = -1;
// Sort
export const UP = 1;
// [LABEL,VALUE]
export const VALUE = 1;
// Standard value
export const ARRAY_OFFSET = 1;
// array[number +- increment]
export const INCREMENT = 1;
// Generic one-ness
export const SINGLE = 1;
// Sorting
export const SAME = 0;
// [LABEL,VALUE]
export const LABEL = 0;
// Generic start of something
export const START = 0;
export const FIRST = 0;

// Testing of indexes
export const NOT_FOUND = -1;
// Sorting
export const DOWN = -1;
export const MINUTE = 60_000;
export const SECOND = 1000;

/**
 * Defaults to 1000 (1 second)
 *
 * @example await sleep(5000);
 */
export const sleep = (ms: number = SECOND): Promise<void> =>
  new Promise((done) => setTimeout(() => done(), ms));

export function PEAT<T extends unknown = number>(
  length: number,
  fill?: T,
): T[] {
  return Array.from({ length }).map(
    (item, index) => fill ?? ((index + ARRAY_OFFSET) as T),
  );
}
