export interface ComposeFileData {
  version?: string;
  name?: string;
  services?: {
    [serviceName: string]: {
      image?: string;
      build?: BuildInContainer;
      depends_on?: string[] | string;
      ports?: string[];
      networks?: string[];
      volumes?: VolumeInContainer[];
      [key: string]: any; // Allow other optional properties
    };
  };
  networks?: Network[],
  volumes?: Volume[]
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

export type Network = string | [[networkName: string], { name?: string, driver?: string, [key: string]: any }]

export type Volume = string | [[volumeName: string], { driver?: string, external?: string, [key: string]: any }]

export type StyleClass =
  { color: string, fill: string }

