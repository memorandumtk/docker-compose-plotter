import { writeMermaidDiagramToFile } from '../../lib/mermaid/write';
import { parseComposeFile } from '../../lib/parse';
import { ComposeMermaidGenerator } from '../../lib/mermaid';
import * as fs from 'fs';
import { exec } from 'child_process';

describe('ConfirmDiagramIsCreated', () => {
  let generator: ComposeMermaidGenerator;
  let diagram: string;
  const outputFilePath = "diagram.mmd";

  const sampleCompose = parseComposeFile("examples/react-rust-postgres/compose.yaml")

  generator = new ComposeMermaidGenerator(sampleCompose);
  diagram = generator.generateMermaidDiagram();
  writeMermaidDiagramToFile(diagram)

  test('an output file should exist', () => {
    expect(fs.existsSync(outputFilePath)).toBeTruthy();
  });

  afterAll((done) => {
    exec('npm run makesvg', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error.message}`);
        return done(error);
      }
      console.log(`Command Output: ${stdout}`);
      done();
    });
  });
});
