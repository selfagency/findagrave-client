// Manual mock for @urql/core
export const mockQuery = jest.fn();

export const Client = jest.fn().mockImplementation(() => ({
  query: mockQuery,
}));

export const cacheExchange = jest.fn();
export const fetchExchange = jest.fn();
export const gql = jest.fn(query => query); // Return the query string as-is
