export interface ComposeFileData {
  version?: string;
  services?: {
    [serviceName: string]: {
      image?: string;
      build?: string;
      depends_on?: string[];
      [string]: string
    };
  };
  networks?: {
    [networkName: string]: {
      [string]: string
    }
  };
  volumes?: {
    [volumeName: string]: {
      [string]: string
    }
  }
}


