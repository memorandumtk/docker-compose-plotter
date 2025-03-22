import { ComposeFileData, VolumeInContainer } from "../../types/yaml";

interface NetworkSubgraphData {
  details: Map<string, string>;
  services: Map<string, string>;
  driver: string;
}

interface MermaidNode {
  id: string;
  labelParts: Map<string, string>;
  className: string;
}

export class ComposeMermaidGenerator {
  private composeData: ComposeFileData;
  private header: string[] = [];
  private serviceNodes: Map<string, MermaidNode> = new Map();
  private relationships: string[] = [];
  private networkSubgraphsMap: Map<string, NetworkSubgraphData> = new Map();
  private volumeNodes: Map<string, MermaidNode> = new Map();

  constructor(baseCompose: ComposeFileData, overrideCompose?: ComposeFileData) {
    this.composeData = baseCompose;
    this.processData();
    console.dir(this.composeData, { depth: null });
  }

  // Getters for testing and inspection.
  public get networkSubgraphs(): Map<string, NetworkSubgraphData> {
    return new Map(this.networkSubgraphsMap);
  }

  public get volumeNodesMap(): Map<string, MermaidNode> {
    return new Map(this.volumeNodes);
  }

  public get serviceNodesMap(): Map<string, MermaidNode> {
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
    Object.entries(networks).forEach(([networkName, networkConfig]) => {
      const details = new Map<string, string>();
      if (networkConfig && networkConfig.name) {
        details.set("name", this.escapeEnvVariables(networkConfig.name));
      }
      let driver = "bridge";
      if (networkConfig && networkConfig.driver) {
        details.set("driver", this.escapeEnvVariables(networkConfig.driver));
        driver = networkConfig.driver;
      }
      // Store both details and services as Maps.
      this.networkSubgraphsMap.set(networkName, { details, services: new Map<string, string>(), driver });
    });

    // Process volumes: store each volume node in the volumeNodes Map.
    Object.entries(volumes).forEach(([volumeName, volumeConfig]) => {
      const node = this.buildVolumeNode(volumeName, volumeConfig);
      this.volumeNodes.set(volumeName, node);
    });

    // Process services.
    Object.entries(services).forEach(([serviceName, serviceConfig]) => {
      const labelParts = this.buildServiceNode(serviceName, serviceConfig);
      // Register the service in each network subgraph.
      if (serviceConfig.networks) {
        if (Array.isArray(serviceConfig.networks)) {
          serviceConfig.networks.forEach((network: string) => {
            const netSubgraph = this.networkSubgraphsMap.get(network);
            if (netSubgraph) {
              netSubgraph.services.set(serviceName, serviceName);
            }
          });
        } else if (typeof serviceConfig.networks === "object") {
          Object.keys(serviceConfig.networks).forEach((network: string) => {
            const netSubgraph = this.networkSubgraphsMap.get(network);
            if (netSubgraph) {
              netSubgraph.services.set(serviceName, serviceName);
            }
          });
        }
      }
      const processedLabelParts = this.processServiceRelationships(serviceName, serviceConfig, labelParts);
      // Create a Mermaid node for the service.
      const mermaidNode: MermaidNode = {
        id: serviceName,
        labelParts: new Map<string, string>([
          ["header", this.putBoldTag(serviceName, 20)],
          ...Array.from(processedLabelParts)
        ]),
        className: "container",
      };
      this.serviceNodes.set(serviceName, mermaidNode);
    });
  }

  /**
   * Escape any environment variable patterns like ${SAMPLE_VALUE} by replacing them
   * with a sequence that Mermaid will render literally.
   */
  private escapeEnvVariables(input: string): string {
    return input.replace(/\$\{([^}]+)\}/g, '#36;#123;$1#125;');
  }

  private putBoldTag(name: string, fontSize: number = 18): string {
    return `<b style="font-size:${fontSize}px">${name}</b>`;
  }

  // Build label parts for a service node as a Map.
  private buildServiceNode(serviceName: string, serviceConfig: any): Map<string, string> {
    const labelParts = new Map<string, string>();
    if (serviceConfig.name) {
      labelParts.set("name", `${this.putBoldTag("name: ", 16)}${this.escapeEnvVariables(serviceConfig.name)}`);
    }
    if (serviceConfig.image) {
      labelParts.set("image", `${this.putBoldTag("image: ", 16)}${this.escapeEnvVariables(serviceConfig.image)}`);
    }
    if (serviceConfig.ports) {
      const portsArray: string[] = [];
      serviceConfig.ports.forEach((port: string) => {
        portsArray.push(this.escapeEnvVariables(port));
      });
      labelParts.set("ports", `${this.putBoldTag("ports: ", 16)}${portsArray.join(", ")}`);
    }
    return labelParts;
  }

  private processServiceRelationships(serviceName: string, serviceConfig: any, labelParts: Map<string, string>): Map<string, string> {
    // Process depends_on relationships.
    if (serviceConfig.depends_on) {
      if (Array.isArray(serviceConfig.depends_on)) {
        serviceConfig.depends_on.forEach((dependency: string) => {
          this.relationships.push(`  ${serviceName} -- "depends on" --> ${dependency}`);
        });
      } else if (typeof serviceConfig.depends_on === "object") {
        const dependency = Object.keys(serviceConfig.depends_on)[0];
        this.relationships.push(`  ${serviceName} -- "depends on" --> ${dependency}`);
      }
    }

    // Process volumes.
    if (serviceConfig.volumes) {
      const volumeSet = new Set<string>();
      serviceConfig.volumes.forEach((volume: VolumeInContainer) => {
        let source: string | undefined, target: string | undefined;
        if (typeof volume === "string") {
          [source, target] = volume.split(":");
        } else {
          source = volume.source;
          target = volume.target;
        }
        if (source && !volumeSet.has(source)) {
          if (Array.from(this.volumeNodes.values()).find(node => node.id.includes(source))) {
            this.relationships.push(`  ${serviceName} -. "volume" .-> volume-${source}`);
          }
          volumeSet.add(this.escapeEnvVariables(source));
        }
        if (target && !volumeSet.has(target)) {
          if (Array.from(this.volumeNodes.values()).find(node => node.id.includes(target))) {
            this.relationships.push(`  ${serviceName} -. "volume" .-> volume-${target}`);
          }
          volumeSet.add(this.escapeEnvVariables(target));
        }
      });
      if (volumeSet.size > 0) {
        labelParts.set("volumes", `${this.putBoldTag("volumes: ", 16)}${Array.from(volumeSet).join(": ")}`);
      }
    }
    return labelParts;
  }

  // Build a Mermaid node for a volume using a Map for labelParts.
  private buildVolumeNode(volumeName: string, volumeConfig: any): MermaidNode {
    const labelParts = new Map<string, string>();
    labelParts.set("header", this.putBoldTag("volume-" + volumeName));
    if (volumeConfig) {
      if (volumeConfig.external !== undefined) {
        labelParts.set("external", `${this.putBoldTag("external: ", 16)}${volumeConfig.external ? "true" : "false"}`);
      }
      if (volumeConfig.driver) {
        labelParts.set("driver", `${this.putBoldTag("driver: ", 16)}${this.escapeEnvVariables(volumeConfig.driver)}`);
      }
      if (volumeConfig.name) {
        labelParts.set("name", `${this.putBoldTag("name: ", 16)}${this.escapeEnvVariables(volumeConfig.name)}`);
      }
    }
    return {
      id: `volume-${volumeName}`,
      labelParts,
      className: "volume",
    };
  }

  // Generate network visualizations.
  public generateNetworkSubgraphs(): string[] {
    const networkVisuals: string[] = [];
    const driverGroups: Map<string, string[]> = new Map();

    this.networkSubgraphsMap.forEach((data, networkName) => {
      // Create a header using the details map.
      const detailStr = Array.from(data.details.entries())
        .map(([key, value]) => `${key}: ${value}`)
        .join("<br>");
      // If if has service nodes, make it a node,
      // otherwise, make it a subgraph
      if (data.services.size === 0) {
        const boldName = this.putBoldTag(`network-${networkName}`) + (detailStr ? `<br>${detailStr}` : "");
        const networkNode = `    network-${networkName}[${boldName}]\n    class network-${networkName} network;`;
        const driver = data.driver;
        if (!driverGroups.has(driver)) {
          driverGroups.set(driver, []);
        }
        driverGroups.get(driver)?.push(networkNode);
      } else {
        const headerLabel = this.putBoldTag(`network-${networkName}`) + (detailStr ? `<br>${detailStr}` : "");
        let subgraphBlock = `    subgraph network-${networkName} [${headerLabel}]`;
        data.services.forEach((serviceName) => {
          const node = this.serviceNodes.get(serviceName);
          if (node) {
            subgraphBlock += `\n      ${this.convertMermaidNodeToString(node).trim()}`;
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
      const boldName = `networks in ${driver}`;
      let outerBlock = `  subgraph ${driver} [${boldName}]`;
      subgraphs.forEach(block => {
        outerBlock += `\n${block}`;
      });
      outerBlock += `\n  end`;
      networkVisuals.push(outerBlock);
    });

    return networkVisuals;
  }

  // Helper: Convert a MermaidNode object to its string representation.
  private convertMermaidNodeToString(node: MermaidNode): string {
    const label = Array.from(node.labelParts.values()).join("<br>");
    return `  ${node.id}(${label})\n  class ${node.id} ${node.className};`;
  }

  public generateMermaidDiagram(): string {
    const servicesNotInSubgraph: string[] = [];
    this.serviceNodes.forEach((node, serviceName) => {
      const isInSubgraph = Array.from(this.networkSubgraphsMap.values()).some(
        subgraphData => subgraphData.services.has(serviceName)
      );
      if (!isInSubgraph) {
        servicesNotInSubgraph.push(this.convertMermaidNodeToString(node));
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
      ...Array.from(this.volumeNodes.values()).map(this.convertMermaidNodeToString.bind(this)),
      ...this.relationships,
      ...styleDefinitions,
    ].join("\n");
  }
}
