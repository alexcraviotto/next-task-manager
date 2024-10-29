/**
 * @jest-environment node
 */

import { GET } from "../route";

describe("GET /api/hello-world", () => {
  it("should return a JSON response with a message", async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ message: "Hello, World!" });
  });
});
