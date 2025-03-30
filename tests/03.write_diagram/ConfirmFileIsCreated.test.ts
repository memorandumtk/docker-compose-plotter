import { writeMermaidDiagramToFile } from "../../lib/mermaid/write";
import { parseComposeFile } from "../../lib/parse";
import { ComposeMermaidGenerator } from "../../lib/mermaid";
import * as fs from "fs";
import { exec } from "child_process";
import path, { join } from "path";

function findFilesRecursively(dir: string, targetFile: string): string[] {
  const foundFiles: string[] = [];

  function searchDirectory(directory: string) {
    const entries = fs.readdirSync(directory, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        searchDirectory(fullPath); // Recursive call
      } else if (entry.name === targetFile) {
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

const cliPath = join(__dirname, "../../dist/bin/cli.js");

// this test is for checking the examples in examples/awesome-compose directory can be rendered as svg correctly.
// awesome-compose projects are copied from:
// https://github.com/docker/awesome-compose

describe("ConfirmDiagramIsCreated", () => {
  const testFiles = findFilesRecursively(
    "examples/awesome-compose",
    "compose.yaml",
  );
  const fileMap = new Map<
    number,
    { outputFilePath: string; svgFilePath: string }
  >();
  const configFileMap = new Map<
    number,
    { outputFilePath: string; svgFilePath: string }
  >();

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
      const sampleCompose = parseComposeFile(filePath);

      test(`Testing creating diagram of ${filePath} with index: ${index}`, () => {
        const generator = new ComposeMermaidGenerator(sampleCompose);
        const diagram = generator.generateMermaidDiagram();
        writeMermaidDiagramToFile(diagram, outputFilePath);

        expect(fs.existsSync(outputFilePath)).toBeTruthy();
      });

      test(`Testing creating diagram of ${filePath} with config option with index: ${index}`, (done) => {
        exec(
          `node ${cliPath} ${filePath} -c -o ${outputConfigFilePath}`,
          (error, stdout, stderr) => {
            console.warn({ stderr, stdout });

            expect(error).toBeNull();
            expect(stderr).toBe("");
            expect(stdout).toContain(`was successfully saved`); // made this opaque so that it does not break the test

            done();
          },
        );
      });
    } catch (e) {
      console.error(e);
    }
  });

  /**
   * This is testing whether each produced mmd files can be converted to svg file.
   */
  afterEach(() => {
    // Retrieve output and svg file paths using test index
    const currentTestIndex = expect
      .getState()
      .currentTestName?.match(/index: (\d+)/)?.[1];
    if (!currentTestIndex) return;

    const index = parseInt(currentTestIndex, 10);
    const filePaths = fileMap.get(index);
    const configFilePaths = configFileMap.get(index);

    if (!filePaths) return;
    if (!configFilePaths) return;
    const { outputFilePath, svgFilePath } = filePaths;
    const outputConfigFilePath = configFilePaths.outputFilePath;
    const svgConfigFilePath = configFilePaths.svgFilePath;

    expect(fs.existsSync(outputFilePath)).toBe(true);
    expect(fs.existsSync(svgFilePath)).toBe(true);

    expect(fs.existsSync(outputConfigFilePath)).toBe(true);
    expect(fs.existsSync(svgConfigFilePath)).toBe(true);

    // exec(
    //   `npm run custommakesvg ${outputFilePath} ${svgFilePath}`,
    //   // eslint-disable-next-line @typescript-eslint/no-unused-vars
    //   (error, stdout, stderr) => {
    //     if (error) {
    //       console.error(`Error executing command: ${error.message}`);
    //       return done(error);
    //     }
    //     console.log(`Succeeded Command Output: ${stdout}`);
    //   },
    // );
    //
    // exec(
    //   `npm run custommakesvg ${outputConfigFilePath} ${svgConfigFilePath}`,
    //   // eslint-disable-next-line @typescript-eslint/no-unused-vars
    //   (error, stdout, stderr) => {
    //     if (error) {
    //       console.error(`Error executing command: ${error.message}`);
    //       return done(error);
    //     }
    //     console.log(`Succeeded Command Output Of Config: ${stdout}`);
    //     done();
    //   },
    // );
  });
});
