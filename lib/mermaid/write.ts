
import * as fs from 'fs';

export const writeMermaidDiagramToFile = (diagramText: string, filename: string = "diagram.mmd") => {
  try {
    fs.writeFileSync(filename, diagramText);
  } catch (e) {
    throw new Error(`Failed to write data to a file: ${filename}`)
  }
}
