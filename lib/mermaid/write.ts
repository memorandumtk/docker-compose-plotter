
import * as fs from 'fs';

export const writeMermaidDiagramToFile = (diagramText: string) => {
  const FILENAME = "diagram.mmd";
  try {
    fs.writeFileSync(FILENAME, diagramText);
  } catch (e) {
    throw new Error(`Failed to write data to a file: ${FILENAME}`)
  }
}
