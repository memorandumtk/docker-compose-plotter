"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const os_1 = require("os");
const path_1 = require("path");
const cliPath = (0, path_1.join)(__dirname, "../../dist/bin/cli.js"); // Adjust path if needed
const DEFAULT_FILE = "docker-compose.yml";
const DEFAULT_OUTPUT_FILE = "diagram.mmd";
describe("CLI Tests Help", () => {
    it("should return help output", (done) => {
        (0, child_process_1.exec)(`node ${cliPath} --help`, (error, stdout, stderr) => {
            console.warn({ stderr, stdout });
            expect(error).toBeNull();
            expect(stderr).toBe("");
            expect(stdout).toContain("Usage");
            done();
        });
    });
});
describe("CLI Tests for a file 'docker-compose.yml'", () => {
    it("should return the output retrived from the default docker-compose.yml file", (done) => {
        (0, child_process_1.exec)(`node ${cliPath} ${DEFAULT_FILE}`, (error, stdout, stderr) => {
            console.warn({ stderr, stdout });
            expect(error).toBeNull();
            expect(stderr).toBe("");
            expect(stdout).toContain(`${DEFAULT_FILE} was successfully saved to ${DEFAULT_OUTPUT_FILE}`);
            done();
        });
    });
    it("should handle missing docker-compose.yml file gracefully", (done) => {
        // Create a temporary directory without a docker-compose.yml
        const tempDir = (0, fs_1.mkdtempSync)(`${(0, os_1.tmpdir)()}/test-`);
        (0, child_process_1.exec)(`node ${cliPath}`, { cwd: tempDir }, (error, stdout, stderr) => {
            console.warn({ stderr, stdout });
            expect(error).not.toBeNull();
            expect(stderr).toContain("Failed to parse YAML: ENOENT: no such file or directory, open 'docker-compose.yml'");
            expect(stdout).toBe("");
            (0, fs_1.rmdirSync)(tempDir, { recursive: true }); // Clean up the temp directory
            done();
        });
    });
});
describe("CLI Tests for a specified file", () => {
    it("should return the suceeded output that represents parsing the specified docker file", (done) => {
        const dockerFilePath = "examples/awesome-compose/angular/compose.yaml";
        (0, child_process_1.exec)(`node ${cliPath} ${dockerFilePath}`, (error, stdout, stderr) => {
            console.warn({ stderr, stdout });
            expect(error).toBeNull();
            expect(stderr).toBe("");
            expect(stdout).toContain(`${dockerFilePath} was successfully saved to ${DEFAULT_OUTPUT_FILE}`);
            done();
        });
    });
    it("should return the suceeded output that represents parsing the specified docker file then output to a specified file", (done) => {
        const dockerFilePath = "examples/awesome-compose/angular/compose.yaml";
        const outputFilePath = "outputs/02/angular-1.mmd";
        (0, child_process_1.exec)(`node ${cliPath} ${dockerFilePath} -o ${outputFilePath}`, (error, stdout, stderr) => {
            console.warn({ stderr, stdout });
            expect(error).toBeNull();
            expect(stderr).toBe("");
            expect(stdout).toContain(`${dockerFilePath} was successfully saved to ${outputFilePath}`);
            done();
        });
    });
});
describe("CLI tests for specified docker config", () => {
    it("should return the output retrived from the default docker-compose.yml file with config option", (done) => {
        (0, child_process_1.exec)(`node ${cliPath} -c`, (error, stdout, stderr) => {
            console.warn({ stderr, stdout });
            expect(error).toBeNull();
            expect(stderr).toBe("");
            expect(stdout).toContain(`Config of Default file: ${DEFAULT_FILE} was successfully saved to ${DEFAULT_OUTPUT_FILE}`);
            done();
        });
    });
    it("should return the suceeded output that represents parsing the specified docker file with config option", (done) => {
        const dockerFilePath = "examples/awesome-compose/angular/compose.yaml";
        (0, child_process_1.exec)(`node ${cliPath} ${dockerFilePath} -c`, (error, stdout, stderr) => {
            console.warn({ stderr, stdout });
            expect(error).toBeNull();
            expect(stderr).toBe("");
            expect(stdout).toContain(`Config of ${dockerFilePath} was successfully saved to ${DEFAULT_OUTPUT_FILE}`);
            done();
        });
    });
    it("should return the suceeded output that represents parsing the specified docker file with config option then output to a specified file", (done) => {
        const dockerFilePath = "examples/awesome-compose/angular/compose.yaml";
        const outputFilePath = "outputs/02/angular-2.mmd";
        (0, child_process_1.exec)(`node ${cliPath} ${dockerFilePath} -c -o ${outputFilePath}`, (error, stdout, stderr) => {
            console.warn({ stderr, stdout });
            expect(error).toBeNull();
            expect(stderr).toBe("");
            expect(stdout).toContain(`Config of ${dockerFilePath} was successfully saved to ${outputFilePath}`);
            done();
        });
    });
    it("should handle missing docker-compose.yml file gracefully, even with config option", (done) => {
        // Create a temporary directory without a docker-compose.yml
        const tempDir = (0, fs_1.mkdtempSync)(`${(0, os_1.tmpdir)()}/test-`);
        (0, child_process_1.exec)(`node ${cliPath} -c`, { cwd: tempDir }, (error, stdout, stderr) => {
            console.warn({ stderr, stdout });
            expect(error).not.toBeNull();
            expect(stderr).toContain("Error executing command: Command failed: docker compose -f docker-compose.yml config");
            expect(stdout).toBe("");
            (0, fs_1.rmdirSync)(tempDir, { recursive: true }); // Clean up the temp directory
            done();
        });
    });
});
