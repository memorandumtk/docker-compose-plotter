#!/usr/bin/env node
import { parseComposeFile } from "../lib/parse";
import { ComposeMermaidGenerator } from "../lib/mermaid";
import { writeMermaidDiagramToFile } from "../lib/mermaid/write";
import { program } from "commander";

program
  .version('1.0.0')
  .argument('<file>', 'path to docker-compose.yml')
  .action((file: string) => {
    try {
      const composeObj = parseComposeFile(file);
      const generatorClass = new ComposeMermaidGenerator(composeObj);
      const diagram = generatorClass.generateMermaidDiagram()
      console.log({ diagram })
      writeMermaidDiagramToFile(diagram)
    } catch (err: any) {
      console.error(err.message);
      process.exit(1);
    }
  });

program.parse();

