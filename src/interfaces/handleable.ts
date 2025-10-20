export interface IHandleable {
  toJSON(): Record<string, unknown>;
  get handled(): boolean;
  set handled(value: boolean);
}
