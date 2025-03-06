export interface ComposeFileData {
  version?: string;
  name?: string;
  services?: {
    [serviceName: string]: {
      image?: string;
      build?: BuildInContainer;
      depends_on?: string[];
      ports?: string[];
      networks?: string[];
      volumes?: VolumeInContainer[];
      [key: string]: any; // Allow other optional properties
    };
  };
  networks?: NetworkObject,
  volumes?: VolumeObject
}

export type VolumeInContainer = string | {
  type?: string;
  source?: string;
  target?: string;
  read_only?: boolean;
}

export type BuildInContainer = string | {
  context: string;
  target: string
  [key: string]: any
}

export type NetworkObject = {
  [networkName: string]: {
    name?: string;
    driver?: string;
    [key: string]: any;
  };
};


export type VolumeObject = {
  [volumeName: string]: {
    driver?: string;
    name?: string;
    external?: string;
    [key: string]: any
  }
}

export type StyleClass =
  { color: string, fill: string }

