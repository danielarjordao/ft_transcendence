/// Utility function to create a paginated response
export function createPaginatedResponse<T>(
  items: T[],
  total: number,
  limit: number,
  offset: number,
) {
  return {
    items,
    pageInfo: {
      limit,
      offset,
      total,
      hasMore: offset + limit < total,
    },
  };
}
