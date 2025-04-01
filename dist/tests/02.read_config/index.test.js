"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
// Mock exec from child_process.
jest.mock("child_process", () => ({
    exec: jest.fn(),
}));
// If your CLI module uses other modules (like YAML or your custom generators),
// you can mock them similarly if needed.
// For example, if you want to test that your mermaid generator is called,
// you could do something like:
// jest.mock('../lib/mermaid', () => ({
//   ComposeMermaidGenerator: jest.fn().mockImplementation(() => ({
//     generateMermaidDiagram: jest.fn(() => 'fake diagram'),
//   })),
// }));
describe("CLI with --config option", () => {
    // Reset modules and mocks before each test.
    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
    });
    it('should run "docker compose config" and process the output', (done) => {
        // Fake output from "docker compose config"
        const fakeOutput = `
      services:
        app:
          image: node:14
    `;
        // Set up the mock implementation for exec.
        child_process_1.exec.mockImplementation((command, callback) => {
            // You can verify that the command is what you expect.
            expect(command).toBe("docker compose config");
            // Simulate a successful execution:
            callback(null, fakeOutput, "");
        });
        // Simulate passing the --config flag to your CLI.
        // For example, if your CLI file is "index.ts" and it reads process.argv,
        // override process.argv here:
        process.argv = ["node", "index.js", "--config"];
        // Import (or require) your CLI module after setting process.argv.
        // This causes the module to run with the test arguments.
        require("../path/to/index");
        // Since exec is asynchronous, wait for the next tick.
        setImmediate(() => {
            // Verify that exec was called.
            expect(child_process_1.exec).toHaveBeenCalledWith("docker compose config", expect.any(Function));
            // Optionally, if you have additional logic (e.g., calling writeMermaidDiagramToFile),
            // you can verify those calls by mocking the respective modules.
            done();
        });
    });
    it("should handle exec errors", (done) => {
        // Simulate an error from exec.
        const fakeError = new Error("command failed");
        child_process_1.exec.mockImplementation((command, callback) => {
            callback(fakeError, "", "");
        });
        // Override process.argv to use --config.
        process.argv = ["node", "index.js", "--config"];
        // Spy on console.error to verify error logging.
        const errorSpy = jest.spyOn(console, "error").mockImplementation(() => { });
        // Optionally, if your code calls process.exit on error,
        // you might want to spy on that too:
        const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => {
            // Do nothing so the test doesn't exit.
            return undefined;
        });
        require("../path/to/index");
        setImmediate(() => {
            // Ensure exec was called.
            expect(child_process_1.exec).toHaveBeenCalledWith("docker compose config", expect.any(Function));
            // Verify that an error was logged.
            expect(errorSpy).toHaveBeenCalledWith("command failed");
            // Verify that process.exit was called with a non-zero code.
            expect(exitSpy).toHaveBeenCalledWith(1);
            // Clean up the spies.
            errorSpy.mockRestore();
            exitSpy.mockRestore();
            done();
        });
    });
});
