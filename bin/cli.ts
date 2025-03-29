#!/usr/bin/env node
import { parseComposeFile, parseComposeConfigStdOut } from "../lib/parse";
import { exec } from "child_process";
import { ComposeMermaidGenerator } from "../lib/mermaid";
import { writeMermaidDiagramToFile } from "../lib/mermaid/write";
import { program } from "commander";
import { ComposeFileData } from "../types/yaml";

program
  .version("1.0.0")
  .option(
    "-c, --config",
    "use docker compose config command instead of reading a config file",
  )
  .option(
    "-o, --output <path>",
    "specify output file for the Mermaid diagram",
    "diagram.mmd",
  )
  .argument(
    "[file]",
    "path to docker-compose.yml, reading 'docker-compose.yml' by default",
  )
  .action(
    (passedFile: string, options: { config: boolean; output: string }) => {
      /**
       * process diagram
       */
      const processDiagram = (composeObj: ComposeFileData) => {
        const generatorClass = new ComposeMermaidGenerator(composeObj);
        const diagram = generatorClass.generateMermaidDiagram();
        const result = writeMermaidDiagramToFile(diagram, options.output);
        return result;
      };

      const file = passedFile || "docker-compose.yml";

      if (options.config) {
        const command = file
          ? `docker compose -f ${file} config`
          : "docker compose config";

        exec(command, (error, stdout, stderr) => {
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
            processDiagram(composeObj);
            process.stdout.write(
              `Config of ${passedFile ? passedFile : "Default file: docker-compose.yml"} was successfully saved to ${options.output} `,
            );
          } catch (err: any) {
            console.error(err.message);
            process.exit(1);
          }
        });
      } else {
        try {
          const composeObj = parseComposeFile(file);
          processDiagram(composeObj);
          process.stdout.write(
            `${passedFile ? passedFile : "Default file: docker-compose.yml"} was successfully saved to ${options.output} `,
          );
        } catch (err: any) {
          console.error(err.message);
          process.exit(1);
        }
      }
    },
  );

program.parse();
