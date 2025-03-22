export interface ComposeFileData {
  version?: string;
  name?: string;
  services?: {
    [serviceName: string]: {
      name?: string;
      image?: string;
      build?: BuildInContainer;
      depends_on?: string[] | { [key: string]: any };
      ports?: string[];
      networks?: string[] | NetworkInContainer
      volumes?: VolumeInContainer[] | { [key: string]: any };
      [key: string]: any; // Allow other optional properties
    };
  };
  networks?: NetworkObject,
  volumes?: VolumeObject
}

export type NetworkInContainer = {
  [key: string]: {
    ipv4_address: string
  }
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
  [networkName: string]: null | {
    name?: string;
    driver?: string;
    [key: string]: any;
  };
};


export type VolumeObject = {
  [volumeName: string]: null | {
    driver?: string;
    name?: string;
    external?: string;
    [key: string]: any
  }
}

export type StyleClass =
  { color: string, fill: string }

