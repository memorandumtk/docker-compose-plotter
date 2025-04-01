import * as fs from "fs";
import * as yaml from "js-yaml";
export const parseComposeFile = (filePath) => {
  try {
    const fileContents = fs.readFileSync(filePath, "utf8");
    const data = yaml.load(fileContents);
    if (!data) {
      console.log({ notExpectedDataType: data });
      throw new Error("data's type was not expected.");
    } else {
      return data;
    }
  } catch (e) {
    throw new Error(`Failed to parse YAML: ${e.message}`);
  }
};
export const parseComposeConfigStdOut = (stdout) => {
  try {
    const data = yaml.load(stdout);
    if (!data) {
      console.log({ notExpectedDataType: data });
      throw new Error("data's type was not expected.");
    } else {
      return data;
    }
  } catch (e) {
    throw new Error(`Failed to parse YAML: ${e.message}`);
  }
};
