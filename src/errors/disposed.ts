export class DisposedError extends Error {
  constructor() {
    super('Object has been disposed');
    this.name = 'DisposedError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
