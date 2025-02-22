import * as fs from 'fs';
import * as yaml from 'js-yaml';
import type { ComposeFileData } from '../types/yaml';

export const parseComposeFile = (filePath: string): ComposeFileData => {
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data = yaml.load(fileContents);
    console.log(data)
    if (!data) {
      console.log({ notExpectedDataType: data })
      throw new Error("data's type was not expected.")
    } else {
      return data
    }
  } catch (e: any) {
    throw new Error(`Failed to parse YAML: ${e.message}`);
  }
}

export function generateMermaidDiagram(composeObject: ComposeFileData) {
  let diagram = 'graph LR\n';
  const services = composeObject.services || {};
  Object.keys(services).forEach(serviceName => {
    diagram += `  ${serviceName}[${serviceName}]\n`;
  });

  Object.entries(services).forEach(([serviceName, serviceConfig]) => {
    if (serviceConfig.depends_on) {
      serviceConfig.depends_on.forEach((dependency: string) => {
        diagram += `  ${dependency} --> ${serviceName}\n`;
      });
    }
  });
  return diagram;
}

export const writeMermaidDiagramToFile = (diagramText: string) => {
  const FILENAME = "diagram.mmd";
  try {
    fs.writeFileSync(FILENAME, diagramText);
  } catch (e) {
    throw new Error(`Failed to write data to a file: ${FILENAME}`)
  }
}
