import { ComposeFileData, VolumeInContainer } from "../../types/yaml";

interface NetworkSubgraphData {
  details: string[];
  services: string[];
  driver: string;
}

export class ComposeMermaidGenerator {
  private composeData: ComposeFileData;
  private header: string[] = [];
  private serviceNodes: Map<string, string> = new Map();
  private relationships: string[] = [];
  private networkSubgraphsMap: Map<string, NetworkSubgraphData> = new Map();
  private volumeNodesArray: string[] = [];

  constructor(baseCompose: ComposeFileData, overrideCompose?: ComposeFileData) {
    this.composeData = baseCompose;
    this.processData();
    console.dir(this.composeData, { depth: null });
  }

  // Getters for testing and inspection.
  public get networkSubgraphs(): Map<string, NetworkSubgraphData> {
    // Optionally return a copy if you want to protect internal state.
    return new Map(this.networkSubgraphsMap);
  }

  public get volumeNodes(): string[] {
    return [...this.volumeNodesArray];
  }

  public get serviceNodesMap(): Map<string, string> {
    return new Map(this.serviceNodes);
  }

  public get relationshipList(): string[] {
    return [...this.relationships];
  }

  public get headerList(): string[] {
    return [...this.header];
  }

  private makeHeader(): string[] {
    const titleStr = this.composeData.name ? `title: ${this.composeData.name}` : "";
    return [
      `---`,
      `${titleStr}`,
      `---`,
      `%%{init: {'theme':'forest'}}%%`,
      `graph LR`,
    ];
  }

  private processData(): void {
    const { services = {}, networks = {}, volumes = {} } = this.composeData;
    this.header = this.makeHeader();

    // Initialize subgraphs for defined networks.
    // For networks without a driver, default the driver to "bridge".
    Object.entries(networks).forEach(([networkName, networkConfig]) => {
      const details: string[] = [];
      if (networkConfig && networkConfig.name) {
        details.push(`name: ${networkConfig.name}`);
      }
      let driver = "bridge";
      if (networkConfig && networkConfig.driver) {
        details.push(`driver: ${networkConfig.driver}`);
        driver = networkConfig.driver;
      }
      this.networkSubgraphsMap.set(networkName, { details, services: [], driver });
    });

    // Process volumes.
    Object.entries(volumes).forEach(([volumeName, volumeConfig]) => {
      const node = this.buildVolumeNode(volumeName, volumeConfig);
      this.volumeNodesArray.push(node);
    });

    // Process services and their relationships.
    Object.entries(services).forEach(([serviceName, serviceConfig]) => {
      const node = this.buildServiceNode(serviceName, serviceConfig);
      // Register the service inside each network subgraph it belongs to.
      if (serviceConfig.networks) {
        serviceConfig.networks.forEach((network: string) => {
          const netSubgraph = this.networkSubgraphsMap.get(network);
          if (netSubgraph) {
            netSubgraph.services.push(serviceName);
          }
        });
      }
      const labelArray = this.processServiceRelationships(serviceName, serviceConfig, node);
      const nodeString = this.putEdgeStringsForServiceNode(serviceName, labelArray.join("<br>"));
      this.serviceNodes.set(serviceName, nodeString);
    });
  }

  private putBoldTag(name: string, fontSize: number = 18): string {
    return `<b style="font-size:${fontSize}px">${name}</b>`
  }

  /**
   * Wrap the service name with its label.
   */
  private putEdgeStringsForServiceNode(serviceName: string, label: string): string {
    const formattedLabel = `${this.putBoldTag(serviceName)}<br>${label}`;
    return `  ${serviceName}(${formattedLabel})\n  class ${serviceName} container;`;
  }

  // Build a flowchart node for a service.
  // Returns an array of strings representing parts of the label.
  private buildServiceNode(serviceName: string, serviceConfig: any): string[] {
    const details: string[] = [];
    if (serviceConfig.name) {
      details.push(`${this.putBoldTag("name: ", 16)}${serviceConfig.name}`);
    }
    if (serviceConfig.image) {
      details.push(`${this.putBoldTag("image: ", 16)}${serviceConfig.image}`);
    }
    if (serviceConfig.ports) {
      const portsArray: string[] = [];
      serviceConfig.ports.forEach((port: string) => {
        portsArray.push(port);
      });
      details.push(`${this.putBoldTag("ports: ", 16)}${portsArray.join(", ")}`);
    }
    if (serviceConfig.depends_on) {
      details.push(`${this.putBoldTag("depends_on: ", 16)}${serviceConfig.depends_on.join(", ")}`);
    }
    return details;
  }


  private processServiceRelationships(serviceName: string, serviceConfig: any, node: string[]): string[] {
    // Process depends_on relationships.
    if (serviceConfig.depends_on) {
      serviceConfig.depends_on.forEach((dependency: string) => {
        this.relationships.push(`  ${serviceName} -- "depends on" --> ${dependency}`);
      });
    }

    // Process volumes.
    if (serviceConfig.volumes) {
      const inlineVolumes: string[] = [];
      serviceConfig.volumes.forEach((volume: VolumeInContainer) => {
        if (typeof volume === "string") {
          const parts = volume.split(":");
          const source = parts[0];
          const target = parts[1];
          if (this.volumeNodesArray.find(node => node.includes(`volume-${source}`))) {
            this.relationships.push(`  ${serviceName} -- "volume" --> volume-${source}`);
          } else if (this.volumeNodesArray.find(node => node.includes(`volume-${target}`))) {
            this.relationships.push(`  ${serviceName} -- "volume" --> volume-${target}`);
          } else {
            inlineVolumes.push(volume);
          }
        } else {
          this.relationships.push(`  ${serviceName} -- "volume" --> volume-${volume.source}`);
        }
      });
      if (inlineVolumes.length > 0) {
        node.push(`${this.putBoldTag("volumes: ", 16)}${inlineVolumes.join(', ')}`);
      }
    }
    return node;
  }

  // Build a flowchart node for a volume.
  private buildVolumeNode(volumeName: string, volumeConfig: any): string {
    const details: string[] = [];
    if (volumeConfig.external !== undefined) {
      details.push(`${this.putBoldTag("external: ", 16)}${volumeConfig.external ? "true" : "false"}`);
    }
    if (volumeConfig.driver) {
      details.push(`${this.putBoldTag("driver: ", 16)}${volumeConfig.driver}`);
    }
    if (volumeConfig.name) {
      details.push(`${this.putBoldTag("name: ", 16)}${volumeConfig.name}`);
    }
    const label = `${this.putBoldTag("volume-" + volumeName)}<br>${details.join("<br>")}`;
    return `  volume-${volumeName}[(${label})]\n  class volume-${volumeName} volume`;
  }


  // Generate network visualizations.
  private generateNetworkSubgraphs(): string[] {
    const networkVisuals: string[] = [];
    const driverGroups: Map<string, string[]> = new Map();

    this.networkSubgraphsMap.forEach((data, networkName) => {
      if (data.services.length === 0) {
        const boldName = this.putBoldTag(`network-${networkName}`)
        const networkClass = `    network-${networkName}[${boldName}]\n    class network-${networkName} network;`;
        const driver = data.driver;
        if (!driverGroups.has(driver)) {
          driverGroups.set(driver, []);
        }
        driverGroups.get(driver)?.push(networkClass);
      } else {
        const boldName = this.putBoldTag(`network-${networkName}`)
        let subgraphBlock = `    subgraph network-${networkName} [${boldName}]`;
        data.services.forEach(serviceName => {
          const node = this.serviceNodes.get(serviceName);
          if (node) {
            subgraphBlock += `\n      ${node.trim()}`;
          }
        });
        subgraphBlock += `\n    end`;

        const driver = data.driver;
        if (!driverGroups.has(driver)) {
          driverGroups.set(driver, []);
        }
        driverGroups.get(driver)?.push(subgraphBlock);
      }
    });

    driverGroups.forEach((subgraphs, driver) => {
      // TODO: make this name bold if possible
      const boldName = `${driver} networks`
      let outerBlock = `  subgraph ${driver} [${boldName}]`;
      subgraphs.forEach(block => {
        outerBlock += `\n${block}`;
      });
      outerBlock += `\n  end`;
      networkVisuals.push(outerBlock);
    });

    return networkVisuals;
  }

  public generateMermaidDiagram(): string {
    const servicesNotInSubgraph: string[] = [];
    this.serviceNodes.forEach((node, serviceName) => {
      const isInSubgraph = Array.from(this.networkSubgraphsMap.values()).some(
        subgraphData => subgraphData.services.includes(serviceName)
      );
      if (!isInSubgraph) {
        servicesNotInSubgraph.push(node);
      }
    });

    const styleDefinitions = [
      `classDef container fill:coral,color:white,text-align:left;`,
      `classDef network fill:#cdffb2,color:black,stroke:#6eaa49;`,
      `classDef volume fill:skyblue,color:white;`,
    ];

    return [
      ...this.header,
      ...servicesNotInSubgraph,
      ...this.generateNetworkSubgraphs(),
      ...this.volumeNodesArray,
      ...this.relationships,
      ...styleDefinitions,
    ].join("\n");
  }
}
