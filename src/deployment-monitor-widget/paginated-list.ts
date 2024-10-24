export interface PaginatedList<T> extends Array<T> {
  value: Array<T>;
  continuationToken: string | null;
}
