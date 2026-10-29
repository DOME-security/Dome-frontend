import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll } from 'vitest';

/** MSW server for the Dome API. Tests add handlers with `server.use(...)`; unhandled requests fail the test. */
export const server = setupServer();

/** Every request the app sent during the current test, in order. */
export const sentRequests: Request[] = [];

server.events.on('request:start', ({ request }) => {
  sentRequests.push(request.clone());
});

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  sentRequests.length = 0;
});
afterAll(() => server.close());
