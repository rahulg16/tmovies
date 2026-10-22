import "@testing-library/jest-dom";
import "./test-utils/env";
import { server } from "./test-utils/mswServer";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterEach(() => {
  server.resetHandlers();
  server.events.removeAllListeners();
});

afterAll(() => server.close());

beforeEach(() => {
  // jsdom does not implement scrolling and logs "Not implemented" for it.
  // `src/Pages/InfoPage/InfoPage.jsx` scrolls to the top on every id change.
  window.scrollTo = jest.fn();
});
