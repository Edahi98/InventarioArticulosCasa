// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyDb = any;

export interface IDatabaseAdapter {
  readonly db: AnyDb;
}
