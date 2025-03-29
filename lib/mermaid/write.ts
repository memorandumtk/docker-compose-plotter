import * as fs from "fs";
import path from "path";

export const writeMermaidDiagramToFile = (
  diagramText: string,
  outputFilePath: string = "diagram.mmd",
) => {
  try {
    // Ensure the directory exists
    const dir = path.dirname(outputFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputFilePath, diagramText);
    return `${outputFilePath} was successfully saved.`;
  } catch (e) {
    const error = e as Error; // Type assertion
    throw new Error(
      `Failed to write data to a file: ${outputFilePath}, ${error.message ?? "with unknown error"}`,
    );
  }
};
