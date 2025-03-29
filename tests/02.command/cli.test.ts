import { exec } from "child_process";
import { mkdtempSync, rmdirSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const cliPath = join(__dirname, "../../dist/bin/cli.js"); // Adjust path if needed
const DEFAULT_OUTPUT_FILE = "diagram.mmd";

describe("CLI Tests Help", () => {
  it("should return help output", (done) => {
    exec(`node ${cliPath} --help`, (error, stdout, stderr) => {
      console.warn({ stderr, stdout });
      expect(error).toBeNull();
      expect(stderr).toBe("");
      expect(stdout).toContain("Usage");
      done();
    });
  });
});

describe("CLI Tests to contents of a file 'docker-compose.yml'", () => {
  it("should return the output retrived from the default docker-compose.yml file", (done) => {
    const defaultFile = "docker-compose.yml";
    exec(`node ${cliPath} ${defaultFile}`, (error, stdout, stderr) => {
      console.warn({ stderr, stdout });
      expect(error).toBeNull();
      expect(stderr).toBe("");
      expect(stdout).toContain("diagram.mmd was successfully saved");
      done();
    });
  });

  it("should handle missing docker-compose.yml file gracefully", (done) => {
    // Create a temporary directory without a docker-compose.yml
    const tempDir = mkdtempSync(`${tmpdir()}/test-`);
    exec(`node ${cliPath}`, { cwd: tempDir }, (error, stdout, stderr) => {
      console.warn({ stderr, stdout });
      expect(error).not.toBeNull();
      expect(stderr).toContain(
        "Failed to parse YAML: ENOENT: no such file or directory, open 'docker-compose.yml'",
      );
      expect(stdout).toBe("");
      rmdirSync(tempDir, { recursive: true }); // Clean up the temp directory
      done();
    });
  });
});

describe("CLI Tests to parse and write contents of a specified file", () => {
  it("should return the suceeded output that represents parsing the specified docker file", (done) => {
    const dockerFilePath = "examples/awesome-compose/angular/compose.yaml";
    exec(`node ${cliPath} ${dockerFilePath}`, (error, stdout, stderr) => {
      console.warn({ stderr, stdout });
      expect(error).toBeNull();
      expect(stderr).toBe("");
      expect(stdout).toContain(`${DEFAULT_OUTPUT_FILE} was successfully saved`);
      done();
    });
  });

  it("should return the suceeded output that represents parsing the specified docker file then output to a specified file", (done) => {
    const dockerFilePath = "examples/awesome-compose/angular/compose.yaml";
    const outputFilePath = "outputs/02/angular-1.mmd";
    exec(
      `node ${cliPath} ${dockerFilePath} -o ${outputFilePath}`,
      (error, stdout, stderr) => {
        console.warn({ stderr, stdout });
        expect(error).toBeNull();
        expect(stderr).toBe("");
        expect(stdout).toContain(`${outputFilePath} was successfully saved`);
        done();
      },
    );
  });
});

describe("CLI tests to parse and write contents of docker config", () => {
  it("should return the output retrived from the default docker-compose.yml file with config option", (done) => {
    exec(`node ${cliPath} -c`, (error, stdout, stderr) => {
      console.warn({ stderr, stdout });
      expect(error).toBeNull();
      expect(stderr).toBe("");
      expect(stdout).toContain(`${DEFAULT_OUTPUT_FILE} was successfully saved`);
      done();
    });
  });

  it("should return the suceeded output that represents parsing the specified docker file with config option", (done) => {
    const dockerFilePath = "examples/awesome-compose/angular/compose.yaml";
    exec(`node ${cliPath} ${dockerFilePath} -c`, (error, stdout, stderr) => {
      console.warn({ stderr, stdout });
      expect(error).toBeNull();
      expect(stderr).toBe("");
      expect(stdout).toContain(`${DEFAULT_OUTPUT_FILE} was successfully saved`);
      done();
    });
  });

  it("should return the suceeded output that represents parsing the specified docker file with config option then output to a specified file", (done) => {
    const dockerFilePath = "examples/awesome-compose/angular/compose.yaml";
    const outputFilePath = "outputs/02/angular-2.mmd";
    exec(
      `node ${cliPath} ${dockerFilePath} -c -o ${outputFilePath}`,
      (error, stdout, stderr) => {
        console.warn({ stderr, stdout });
        expect(error).toBeNull();
        expect(stderr).toBe("");
        expect(stdout).toContain(`${outputFilePath} was successfully saved`);
        done();
      },
    );
  });

  it("should handle missing docker-compose.yml file gracefully, even with config option", (done) => {
    // Create a temporary directory without a docker-compose.yml
    const tempDir = mkdtempSync(`${tmpdir()}/test-`);
    exec(`node ${cliPath} -c`, { cwd: tempDir }, (error, stdout, stderr) => {
      console.warn({ stderr, stdout });
      expect(error).not.toBeNull();
      expect(stderr).toContain(
        "Error executing command: Command failed: docker compose -f docker-compose.yml config",
      );
      expect(stdout).toBe("");
      rmdirSync(tempDir, { recursive: true }); // Clean up the temp directory
      done();
    });
  });
});
