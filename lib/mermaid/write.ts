import * as fs from "fs";

export const writeMermaidDiagramToFile = (
  diagramText: string,
  filename: string = "diagram.mmd",
) => {
  try {
    fs.writeFileSync(filename, diagramText);
    return `${filename} was successfully saved.`;
  } catch (e) {
    const error = e as Error; // Type assertion
    throw new Error(
      `Failed to write data to a file: ${filename}, ${error.message ?? "with unknown error"}`,
    );
  }
};
