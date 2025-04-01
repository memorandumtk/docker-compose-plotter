#!/usr/bin/env node
import {
  parseComposeFile,
  parseComposeConfigStdOut,
} from "../lib/parse/index.js";
import { exec } from "child_process";
import { ComposeMermaidGenerator } from "../lib/mermaid/index.js";
import { writeMermaidDiagramToFile } from "../lib/mermaid/write.js";
import { program } from "commander";
import { ComposeFileData } from "../types/yaml";
import { run } from "@mermaid-js/mermaid-cli";

/**
 * Convert MMD file content to SVG using Mermaid command
 */
const convertMmdToSvg = async (mmdFilePath: string) => {
  const svgFilePath = mmdFilePath.replace(/\.mmd$/, ".svg");

  try {
    // @ts-expect-error svgFilePath ends svg.
    await run(mmdFilePath, svgFilePath);
  } catch (error) {
    console.error(`\nError executing mermaid CLI API: ${error}\n\n`);
    process.exit(1);
  }
  //
  // // IMPORTANT: to avoid ESM/CommonJS issues, I decided not to install dependencies of mermaid in this package.
  // // This is depends on if you have @mermaid-js/mermaid-cli on your global or local environment.
  // const command = `npx mmdc -i ${mmdFilePath} -o ${svgFilePath}`;
  // exec(command, (error, stdout, stderr) => {
  //   if (error) {
  //     console.error(`\nError executing mmdc: ${error.message}\n\n`);
  //     process.exit(1);
  //   }
  //   if (stderr) {
  //     console.error(`\nstderr: ${stderr}\n\n`);
  //   }
  //   console.log(`\nSVG file successfully created: ${svgFilePath}\n\n`);
  // });
};

program
  .version("1.0.0")
  .option(
    "-c, --config",
    "use docker compose config command instead of reading a config file",
  )
  .option(
    "-S, --not-produce-svg-file",
    "use mmdc command to produce svg file from mmd file, default provide a svg file",
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
    (
      passedFile: string,
      options: { config: boolean; output: string; notProduceSvgFile: boolean },
    ) => {
      /**
       * process diagram
       */
      const processDiagram = (composeObj: ComposeFileData) => {
        const generatorClass = new ComposeMermaidGenerator(composeObj);
        const diagram = generatorClass.generateMermaidDiagram();
        const result = writeMermaidDiagramToFile(diagram, options.output);

        if (!options.notProduceSvgFile) {
          convertMmdToSvg(options.output);
        }
        return result;
      };

      const file = passedFile || "docker-compose.yml";

      if (options.config) {
        const command = file
          ? `docker compose -f ${file} config`
          : "docker compose config";

        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error(`\nError executing command: ${error.message}\n\n`);
            process.exit(1);
          }
          if (stderr) {
            console.error(`\nstderr: ${stderr}\n\n`);
            process.exit(1);
          }
          try {
            const composeObj = parseComposeConfigStdOut(stdout);
            processDiagram(composeObj);
            process.stdout.write(
              `\nConfig of ${passedFile ? passedFile : "Default file: docker-compose.yml"} was successfully saved to ${options.output}\n\n`,
            );
          } catch (err: any) {
            console.error(`\n${err.message}\n\n`);
            process.exit(1);
          }
        });
      } else {
        try {
          const composeObj = parseComposeFile(file);
          processDiagram(composeObj);
          process.stdout.write(
            `\n${passedFile ? passedFile : "Default file: docker-compose.yml"} was successfully saved to ${options.output}\n\n`,
          );
        } catch (err: any) {
          console.error(`\n${err.message}\n\n`);
          process.exit(1);
        }
      }
    },
  );

program.parse();
