import * as fs from 'fs';
import * as yaml from 'js-yaml';
import type { ComposeFileData } from '../../types/yaml';

export const parseComposeFile = (filePath: string): ComposeFileData => {
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data = yaml.load(fileContents);
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
