import "@testing-library/jest-dom";

if (!globalThis.crypto) {
  globalThis.crypto = {
    randomUUID: () => "test-uuid"
  };
}
