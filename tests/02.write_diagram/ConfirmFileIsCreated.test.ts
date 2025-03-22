import { writeMermaidDiagramToFile } from '../../lib/mermaid/write';
import { parseComposeFile } from '../../lib/parse';
import { ComposeMermaidGenerator } from '../../lib/mermaid';
import * as fs from 'fs';
import { exec } from 'child_process';
import path from "path";

function findFilesRecursively(dir: string, targetFile: string): string[] {
  let foundFiles: string[] = [];

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
function execPromise(command: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}


describe('ConfirmDiagramIsCreated', () => {

  const testFiles = findFilesRecursively("examples/awesome-compose", "compose.yaml");
  const fileMap = new Map<number, { outputFilePath: string; svgFilePath: string }>();


  testFiles.forEach((filePath, index) => {

    const outputFilePath = `outputs/diagram_${index}.mmd`;
    const svgFilePath = `outputs/diagram_${index}.svg`;

    // Store file paths in the map
    fileMap.set(index, { outputFilePath, svgFilePath });

    try {
      let generator: ComposeMermaidGenerator;
      let diagram: string;

      const sampleCompose = parseComposeFile(filePath)

      generator = new ComposeMermaidGenerator(sampleCompose);
      diagram = generator.generateMermaidDiagram();
      writeMermaidDiagramToFile(diagram, outputFilePath)

      test(`Testing creating diagram of ${filePath} with index: ${index}`, async () => {
        expect(fs.existsSync(outputFilePath)).toBeTruthy();
      });

    } catch (e) {
      console.error(e)
    }
  });

  afterEach((done) => {
    // Retrieve output and svg file paths using test index
    const currentTestIndex = expect.getState().currentTestName?.match(/index: (\d+)/)?.[1];
    if (!currentTestIndex) return;

    const index = parseInt(currentTestIndex, 10);
    const filePaths = fileMap.get(index);

    if (!filePaths) return;
    const { outputFilePath, svgFilePath } = filePaths;

    exec(`npm run custommakesvg ${outputFilePath} ${svgFilePath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error.message}`);
        return done(error);
      }
      console.log(`Succeeded Command Output: ${stdout}`);
      done();
    });
  });
});
