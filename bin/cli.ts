#!/usr/bin/env node
import { parseComposeFile, parseComposeConfigStdOut } from "../lib/parse";
import { exec } from "child_process";
import { ComposeMermaidGenerator } from "../lib/mermaid";
import { writeMermaidDiagramToFile } from "../lib/mermaid/write";
import { program } from "commander";

program
  .version("1.0.0")
  .option(
    "-c, --config",
    "use docker compose config command instead of reading a config file",
  )
  .argument(
    "[file]",
    "path to docker-compose.yml, reading 'docker-compose.yml' by default",
    "docker-compose.yml",
  )
  .action((file: string, options: { config: boolean }) => {
    if (options.config) {
      exec("docker compose config", (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing command: ${error.message}`);
          process.exit(1);
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          process.exit(1);
        }
        try {
          const composeObj = parseComposeConfigStdOut(stdout);
          // console.dir(composeObj, { depth: null });
          const generatorClass = new ComposeMermaidGenerator(composeObj);
          const diagram = generatorClass.generateMermaidDiagram();
          const result = writeMermaidDiagramToFile(diagram);
          process.stdout.write(result);
        } catch (err: any) {
          console.error(err.message);
          process.exit(1);
        }
      });
    } else {
      // Fallback to using the file directly.
      try {
        const composeObj = parseComposeFile(file);
        const generatorClass = new ComposeMermaidGenerator(composeObj);
        const diagram = generatorClass.generateMermaidDiagram();
        console.log({ diagram });
        const result = writeMermaidDiagramToFile(diagram);
        process.stdout.write(result);
      } catch (err: any) {
        console.error(err.message);
        process.exit(1);
      }
    }
  });

program.parse();
