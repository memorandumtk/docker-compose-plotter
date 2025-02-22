#!/usr/bin/env node
import { parseComposeFile, generateMermaidDiagram, writeMermaidDiagramToFile } from "../lib";
import { program } from "commander";

program
  .version('1.0.0')
  .argument('<file>', 'path to docker-compose.yml')
  .action((file: string) => {
    try {
      const composeObj = parseComposeFile(file);
      const diagram = generateMermaidDiagram(composeObj);
      writeMermaidDiagramToFile(diagram)
    } catch (err: any) {
      console.error(err.message);
      process.exit(1);
    }
  });

program.parse();

