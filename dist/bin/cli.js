#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parse_1 = require("../lib/parse");
const child_process_1 = require("child_process");
const mermaid_1 = require("../lib/mermaid");
const write_1 = require("../lib/mermaid/write");
const commander_1 = require("commander");
commander_1.program
    .version("1.0.0")
    .option("-c, --config", "use docker compose config command instead of reading a config file")
    .option("-o, --output <path>", "specify output file for the Mermaid diagram", "diagram.mmd")
    .argument("[file]", "path to docker-compose.yml, reading 'docker-compose.yml' by default")
    .action((passedFile, options) => {
    /**
     * process diagram
     */
    const processDiagram = (composeObj) => {
        const generatorClass = new mermaid_1.ComposeMermaidGenerator(composeObj);
        const diagram = generatorClass.generateMermaidDiagram();
        const result = (0, write_1.writeMermaidDiagramToFile)(diagram, options.output);
        return result;
    };
    const file = passedFile || "docker-compose.yml";
    if (options.config) {
        const command = file
            ? `docker compose -f ${file} config`
            : "docker compose config";
        (0, child_process_1.exec)(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing command: ${error.message}`);
                process.exit(1);
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
                process.exit(1);
            }
            try {
                const composeObj = (0, parse_1.parseComposeConfigStdOut)(stdout);
                processDiagram(composeObj);
                process.stdout.write(`Config of ${passedFile ? passedFile : "Default file: docker-compose.yml"} was successfully saved to ${options.output} `);
            }
            catch (err) {
                console.error(err.message);
                process.exit(1);
            }
        });
    }
    else {
        try {
            const composeObj = (0, parse_1.parseComposeFile)(file);
            processDiagram(composeObj);
            process.stdout.write(`${passedFile ? passedFile : "Default file: docker-compose.yml"} was successfully saved to ${options.output} `);
        }
        catch (err) {
            console.error(err.message);
            process.exit(1);
        }
    }
});
commander_1.program.parse();
