"use strict";
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }
    : function (o, v) {
        o["default"] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o)
            if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== "default") __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const os_1 = require("os");
const path_1 = require("path");
const fs = __importStar(require("fs"));
const cliPath = (0, path_1.join)(__dirname, "../../dist/bin/cli.js");
const DEFAULT_FILE = "docker-compose.yml";
const DEFAULT_OUTPUT_FILE = "diagram.mmd";
describe("CLI Tests Help", () => {
  it("should return help output", (done) => {
    (0, child_process_1.exec)(
      `node ${cliPath} --help`,
      (error, stdout, stderr) => {
        console.warn({ stderr, stdout });
        expect(error).toBeNull();
        expect(stderr).toBe("");
        expect(stdout).toContain("Usage");
        done();
      },
    );
  });
});
/**
 * Check whether mmd file and svg file are correctly created
 */
const checkFilesAreCorrectlyCreated = (
  mmdFilePath = DEFAULT_OUTPUT_FILE,
  shouldSvgFileGenerated = true,
) => {
  const svgFilePath = mmdFilePath.replace(/\.mmd$/, ".svg");
  const ifFileExists = fs.existsSync(mmdFilePath);
  expect(ifFileExists).toBeTruthy();
  if (shouldSvgFileGenerated) {
    const ifSVGFileExists = fs.existsSync(svgFilePath);
    expect(ifSVGFileExists).toBeTruthy();
    fs.unlinkSync(svgFilePath); // remove the file for the next test.
  } else {
    const ifSVGFileExists = fs.existsSync(svgFilePath);
    expect(ifSVGFileExists).toBeFalsy();
  }
};
describe("CLI Tests for a file 'docker-compose.yml'", () => {
  it("should return the output retrived from the default docker-compose.yml file", (done) => {
    (0, child_process_1.exec)(
      `node ${cliPath} ${DEFAULT_FILE}`,
      (error, stdout, stderr) => {
        console.warn({ stderr, stdout });
        expect(error).toBeNull();
        expect(stderr).toBe("");
        expect(stdout).toContain(
          `${DEFAULT_FILE} was successfully saved to ${DEFAULT_OUTPUT_FILE}`,
        );
        checkFilesAreCorrectlyCreated();
        done();
      },
    );
  });
  it("should return the output retrived from the default docker-compose.yml file and svg file is not generated", (done) => {
    (0, child_process_1.exec)(
      `node ${cliPath} ${DEFAULT_FILE} -S`,
      (error, stdout, stderr) => {
        console.warn({ stderr, stdout });
        expect(error).toBeNull();
        expect(stderr).toBe("");
        expect(stdout).toContain(
          `${DEFAULT_FILE} was successfully saved to ${DEFAULT_OUTPUT_FILE}`,
        );
        checkFilesAreCorrectlyCreated(DEFAULT_OUTPUT_FILE, false);
        done();
      },
    );
  });
  it("should handle missing docker-compose.yml file gracefully", (done) => {
    // Create a temporary directory without a docker-compose.yml
    const tempDir = (0, fs_1.mkdtempSync)(`${(0, os_1.tmpdir)()}/test-`);
    (0, child_process_1.exec)(
      `node ${cliPath}`,
      { cwd: tempDir },
      (error, stdout, stderr) => {
        console.warn({ stderr, stdout });
        expect(error).not.toBeNull();
        expect(stderr).toContain(
          "Failed to parse YAML: ENOENT: no such file or directory, open 'docker-compose.yml'",
        );
        expect(stdout).toBe("");
        (0, fs_1.rmdirSync)(tempDir, { recursive: true }); // Clean up the temp directory
        done();
      },
    );
  });
});
describe("CLI Tests for a specified file", () => {
  it("should return the suceeded output that represents parsing the specified docker file", (done) => {
    const dockerFilePath = "examples/awesome-compose/angular/compose.yaml";
    (0, child_process_1.exec)(
      `node ${cliPath} ${dockerFilePath}`,
      (error, stdout, stderr) => {
        console.warn({ stderr, stdout });
        expect(error).toBeNull();
        expect(stderr).toBe("");
        expect(stdout).toContain(
          `${dockerFilePath} was successfully saved to ${DEFAULT_OUTPUT_FILE}`,
        );
        checkFilesAreCorrectlyCreated();
        done();
      },
    );
  });
  it("should return the suceeded output that represents parsing the specified docker file and svg file is not generated", (done) => {
    const dockerFilePath = "examples/awesome-compose/angular/compose.yaml";
    (0, child_process_1.exec)(
      `node ${cliPath} ${dockerFilePath} -S`,
      (error, stdout, stderr) => {
        console.warn({ stderr, stdout });
        expect(error).toBeNull();
        expect(stderr).toBe("");
        expect(stdout).toContain(
          `${dockerFilePath} was successfully saved to ${DEFAULT_OUTPUT_FILE}`,
        );
        checkFilesAreCorrectlyCreated(DEFAULT_OUTPUT_FILE, false);
        done();
      },
    );
  });
  it("should return the suceeded output that represents parsing the specified docker file then output to a specified file", (done) => {
    const dockerFilePath = "examples/awesome-compose/angular/compose.yaml";
    const outputFilePath = "outputs/02/angular-1.mmd";
    (0, child_process_1.exec)(
      `node ${cliPath} ${dockerFilePath} -o ${outputFilePath}`,
      (error, stdout, stderr) => {
        console.warn({ stderr, stdout });
        expect(error).toBeNull();
        expect(stderr).toBe("");
        expect(stdout).toContain(
          `${dockerFilePath} was successfully saved to ${outputFilePath}`,
        );
        checkFilesAreCorrectlyCreated(outputFilePath);
        done();
      },
    );
  });
  it("should return the suceeded output that represents parsing the specified docker file then output to a specified file and svg file is not generated", (done) => {
    const dockerFilePath = "examples/awesome-compose/angular/compose.yaml";
    const outputFilePath = "outputs/02/angular-1.mmd";
    (0, child_process_1.exec)(
      `node ${cliPath} ${dockerFilePath} -o ${outputFilePath} -S`,
      (error, stdout, stderr) => {
        console.warn({ stderr, stdout });
        expect(error).toBeNull();
        expect(stderr).toBe("");
        expect(stdout).toContain(
          `${dockerFilePath} was successfully saved to ${outputFilePath}`,
        );
        checkFilesAreCorrectlyCreated(outputFilePath, false);
        done();
      },
    );
  });
});
describe("CLI tests for specified docker config", () => {
  it("should return the output retrived from the default docker-compose.yml file with config option", (done) => {
    (0, child_process_1.exec)(`node ${cliPath} -c`, (error, stdout, stderr) => {
      console.warn({ stderr, stdout });
      expect(error).toBeNull();
      expect(stderr).toBe("");
      expect(stdout).toContain(
        `Config of Default file: ${DEFAULT_FILE} was successfully saved to ${DEFAULT_OUTPUT_FILE}`,
      );
      checkFilesAreCorrectlyCreated();
      done();
    });
  });
  it("should return the output retrived from the default docker-compose.yml file with config option and svg file is not generated", (done) => {
    (0, child_process_1.exec)(
      `node ${cliPath} -c -S`,
      (error, stdout, stderr) => {
        console.warn({ stderr, stdout });
        expect(error).toBeNull();
        expect(stderr).toBe("");
        expect(stdout).toContain(
          `Config of Default file: ${DEFAULT_FILE} was successfully saved to ${DEFAULT_OUTPUT_FILE}`,
        );
        checkFilesAreCorrectlyCreated(DEFAULT_OUTPUT_FILE, false);
        done();
      },
    );
  });
  it("should return the suceeded output that represents parsing the specified docker file with config option", (done) => {
    const dockerFilePath = "examples/awesome-compose/angular/compose.yaml";
    (0, child_process_1.exec)(
      `node ${cliPath} ${dockerFilePath} -c`,
      (error, stdout, stderr) => {
        console.warn({ stderr, stdout });
        expect(error).toBeNull();
        expect(stderr).toBe("");
        expect(stdout).toContain(
          `Config of ${dockerFilePath} was successfully saved to ${DEFAULT_OUTPUT_FILE}`,
        );
        checkFilesAreCorrectlyCreated();
        done();
      },
    );
  });
  it("should return the suceeded output that represents parsing the specified docker file with config option and svg file is not generated", (done) => {
    const dockerFilePath = "examples/awesome-compose/angular/compose.yaml";
    (0, child_process_1.exec)(
      `node ${cliPath} ${dockerFilePath} -c -S`,
      (error, stdout, stderr) => {
        console.warn({ stderr, stdout });
        expect(error).toBeNull();
        expect(stderr).toBe("");
        expect(stdout).toContain(
          `Config of ${dockerFilePath} was successfully saved to ${DEFAULT_OUTPUT_FILE}`,
        );
        checkFilesAreCorrectlyCreated(DEFAULT_OUTPUT_FILE, false);
        done();
      },
    );
  });
  it("should return the suceeded output that represents parsing the specified docker file with config option then output to a specified file", (done) => {
    const dockerFilePath = "examples/awesome-compose/angular/compose.yaml";
    const outputFilePath = "outputs/02/angular-2.mmd";
    (0, child_process_1.exec)(
      `node ${cliPath} ${dockerFilePath} -c -o ${outputFilePath}`,
      (error, stdout, stderr) => {
        console.warn({ stderr, stdout });
        expect(error).toBeNull();
        expect(stderr).toBe("");
        expect(stdout).toContain(
          `Config of ${dockerFilePath} was successfully saved to ${outputFilePath}`,
        );
        checkFilesAreCorrectlyCreated(outputFilePath);
        done();
      },
    );
  });
  it("should return the suceeded output that represents parsing the specified docker file with config option then output to a specified file and svg file not generated", (done) => {
    const dockerFilePath = "examples/awesome-compose/angular/compose.yaml";
    const outputFilePath = "outputs/02/angular-2.mmd";
    (0, child_process_1.exec)(
      `node ${cliPath} ${dockerFilePath} -c -o ${outputFilePath} -S`,
      (error, stdout, stderr) => {
        console.warn({ stderr, stdout });
        expect(error).toBeNull();
        expect(stderr).toBe("");
        expect(stdout).toContain(
          `Config of ${dockerFilePath} was successfully saved to ${outputFilePath}`,
        );
        checkFilesAreCorrectlyCreated(outputFilePath, false);
        done();
      },
    );
  });
  it("should handle missing docker-compose.yml file gracefully, even with config option", (done) => {
    // Create a temporary directory without a docker-compose.yml
    const tempDir = (0, fs_1.mkdtempSync)(`${(0, os_1.tmpdir)()}/test-`);
    (0, child_process_1.exec)(
      `node ${cliPath} -c`,
      { cwd: tempDir },
      (error, stdout, stderr) => {
        console.warn({ stderr, stdout });
        expect(error).not.toBeNull();
        expect(stderr).toContain(
          "Error executing command: Command failed: docker compose -f docker-compose.yml config",
        );
        expect(stdout).toBe("");
        (0, fs_1.rmdirSync)(tempDir, { recursive: true }); // Clean up the temp directory
        done();
      },
    );
  });
});
