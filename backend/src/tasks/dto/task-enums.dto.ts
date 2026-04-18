// This ensures our API boundary relies on internal TypeScript enums,
// completely decoupled from the Prisma database client.
export enum ApiTaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum TaskSortOrder {
  ASC = 'asc',
  DESC = 'desc',
}
