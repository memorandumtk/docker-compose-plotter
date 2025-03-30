"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const write_1 = require("../../lib/mermaid/write");
const parse_1 = require("../../lib/parse");
const mermaid_1 = require("../../lib/mermaid");
const fs = __importStar(require("fs"));
const child_process_1 = require("child_process");
const path_1 = __importStar(require("path"));
function findFilesRecursively(dir, targetFile) {
    const foundFiles = [];
    function searchDirectory(directory) {
        const entries = fs.readdirSync(directory, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path_1.default.join(directory, entry.name);
            if (entry.isDirectory()) {
                searchDirectory(fullPath); // Recursive call
            }
            else if (entry.name === targetFile) {
                foundFiles.push(fullPath);
            }
        }
    }
    searchDirectory(dir);
    return foundFiles;
}
/**
 * function for executing `exec` in `test` function directly
 */
// function execPromise(command: string): Promise<{ stdout: string; stderr: string }> {
//   return new Promise((resolve, reject) => {
//     exec(command, (error, stdout, stderr) => {
//       if (error) {
//         reject(error);
//       } else {
//         resolve({ stdout, stderr });
//       }
//     });
//   });
// }
const cliPath = (0, path_1.join)(__dirname, "../../dist/bin/cli.js");
// this test is for checking the examples in examples/awesome-compose directory can be rendered as svg correctly.
// awesome-compose projects are copied from:
// https://github.com/docker/awesome-compose
describe("ConfirmDiagramIsCreated", () => {
    const testFiles = findFilesRecursively("examples/awesome-compose", "compose.yaml");
    const fileMap = new Map();
    const configFileMap = new Map();
    testFiles.forEach((filePath, index) => {
        const outputFilePath = `outputs/03/diagram_${index}.mmd`;
        const svgFilePath = `outputs/03/diagram_${index}.svg`;
        const outputConfigFilePath = `outputs/03/config/diagram_${index}.mmd`;
        const svgConfigFilePath = `outputs/03/config/diagram_${index}.svg`;
        /**
         * file paths in the map
         */
        fileMap.set(index, { outputFilePath, svgFilePath });
        /**
         * file paths for config option case
         */
        configFileMap.set(index, {
            outputFilePath: outputConfigFilePath,
            svgFilePath: svgConfigFilePath,
        });
        try {
            const sampleCompose = (0, parse_1.parseComposeFile)(filePath);
            test(`Testing creating diagram of ${filePath} with index: ${index}`, () => {
                const generator = new mermaid_1.ComposeMermaidGenerator(sampleCompose);
                const diagram = generator.generateMermaidDiagram();
                (0, write_1.writeMermaidDiagramToFile)(diagram, outputFilePath);
                expect(fs.existsSync(outputFilePath)).toBeTruthy();
            });
            test(`Testing creating diagram of ${filePath} with config option with index: ${index}`, (done) => {
                (0, child_process_1.exec)(`node ${cliPath} ${filePath} -c -o ${outputConfigFilePath}`, (error, stdout, stderr) => {
                    console.warn({ stderr, stdout });
                    expect(error).toBeNull();
                    expect(stderr).toBe("");
                    expect(stdout).toContain(`was successfully saved`); // made this opaque so that it does not break the test
                    done();
                });
            });
        }
        catch (e) {
            console.error(e);
        }
    });
    /**
     * This is testing whether each produced mmd files can be converted to svg file.
     */
    afterEach((done) => {
        // Retrieve output and svg file paths using test index
        const currentTestIndex = expect
            .getState()
            .currentTestName?.match(/index: (\d+)/)?.[1];
        if (!currentTestIndex)
            return;
        const index = parseInt(currentTestIndex, 10);
        const filePaths = fileMap.get(index);
        const configFilePaths = configFileMap.get(index);
        if (!filePaths)
            return;
        if (!configFilePaths)
            return;
        const { outputFilePath, svgFilePath } = filePaths;
        const outputConfigFilePath = configFilePaths.outputFilePath;
        const svgConfigFilePath = configFilePaths.svgFilePath;
        (0, child_process_1.exec)(`npm run custommakesvg ${outputFilePath} ${svgFilePath}`, 
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing command: ${error.message}`);
                return done(error);
            }
            console.log(`Succeeded Command Output: ${stdout}`);
        });
        (0, child_process_1.exec)(`npm run custommakesvg ${outputConfigFilePath} ${svgConfigFilePath}`, 
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing command: ${error.message}`);
                return done(error);
            }
            console.log(`Succeeded Command Output Of Config: ${stdout}`);
            done();
        });
    });
});
