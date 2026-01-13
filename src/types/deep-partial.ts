/**
 * Utility type for creating deeply partial versions of types.
 * Makes all properties optional recursively, while preserving functions.
 * Useful for configuration overrides and partial updates.
 *
 * @example
 * ```typescript
 * interface Config {
 *   a: { b: { c: number } };
 *   fn: () => void;
 * }
 *
 * type PartialConfig = DeepPartial<Config>;
 * // { a?: { b?: { c?: number } }, fn?: () => void }
 * ```
 */
export type DeepPartial<T> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [P in keyof T]?: T[P] extends (...args: any[]) => any
    ? T[P]
    : T[P] extends ReadonlyArray<infer U>
      ? ReadonlyArray<DeepPartial<U>>
      : T[P] extends Array<infer U>
        ? Array<DeepPartial<U>>
        : T[P] extends object
          ? DeepPartial<T[P]>
          : T[P];
};
