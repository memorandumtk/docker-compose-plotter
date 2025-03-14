import { ComposeFileData, VolumeInContainer } from "../../types/yaml";
import { ARROWS_TO_RIGHT, COLORS, DescriptionOfColors, FOUR_SPACES, TWO_SPACES } from '../../constants';
import { putEscapeCharactersOnBothSide } from "../../utils";

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
  // Now include a driver property for each network subgraph.
  private networkSubgraphs: Map<string, NetworkSubgraphData> = new Map();
  private volumeNodes: string[] = [];

  constructor(baseCompose: ComposeFileData, overrideCompose?: ComposeFileData) {
    this.composeData = baseCompose;
    this.processData();
    console.dir(this.composeData, { depth: null });
  }

  private makeHeader(): string[] {
    const titleStr = this.composeData.name ? `title: ${this.composeData.name}` : "";
    return [
      `---`,
      `${titleStr}${TWO_SPACES}${DescriptionOfColors}`,
      `---`,
      `%%{init: {'theme':'forest'}}%%`,
      `graph LR`
    ];
  }

  private processData(): void {
    const { services = {}, networks = {}, volumes = {} } = this.composeData;
    this.header = this.makeHeader();

    // Initialize subgraphs for defined networks.
    // For networks without a driver, default the driver to "bridge".
    Object.entries(networks).forEach(([networkName, networkConfig]) => {
      const details: string[] = [];
      if (networkConfig.name) {
        details.push(`name: ${networkConfig.name}`);
      }
      let driver = "bridge";
      if (networkConfig.driver) {
        details.push(`driver: ${networkConfig.driver}`);
        driver = networkConfig.driver;
      }
      this.networkSubgraphs.set(networkName, { details, services: [], driver });
    });

    // Process volumes.
    Object.entries(volumes).forEach(([volumeName, volumeConfig]) => {
      const node = this.buildVolumeNode(volumeName, volumeConfig);
      this.volumeNodes.push(node);
    });

    // Process services and their relationships.
    Object.entries(services).forEach(([serviceName, serviceConfig]) => {
      const node = this.buildServiceNode(serviceName, serviceConfig);
      // Register the service inside each network subgraph it belongs to.
      if (serviceConfig.networks) {
        serviceConfig.networks.forEach((network: string) => {
          const netSubgraph = this.networkSubgraphs.get(network);
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

  /**
   * Wrap the service name with its label.
   */
  private putEdgeStringsForServiceNode(serviceName: string, label: string) {
    return `  ${serviceName}:::container[${label}]`;
  }

  // Build a flowchart node for a service.
  // Returns an array of strings representing parts of the label.
  private buildServiceNode(serviceName: string, serviceConfig: any): string[] {
    const details: string[] = [];
    if (serviceConfig.name) {
      details.push(`name: ${serviceConfig.name}`);
    }
    if (serviceConfig.image) {
      details.push(`image: ${serviceConfig.image}`);
    }
    if (serviceConfig.ports) {
      const portsArray: string[] = [];
      serviceConfig.ports.forEach((port: string) => {
        portsArray.push(port);
      });
      details.push(`ports: ${portsArray.join(", ")}`);
    }
    if (serviceConfig.depends_on) {
      details.push(`depends_on: ${serviceConfig.depends_on.join(", ")}`);
    }
    details.unshift(serviceName);
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
          if (this.volumeNodes.find(node => node.includes(`volume-${source}`))) {
            this.relationships.push(`  ${serviceName} -- "volume" --> volume-${source}`);
          } else if (this.volumeNodes.find(node => node.includes(`volume-${target}`))) {
            this.relationships.push(`  ${serviceName} -- "volume" --> volume-${target}`);
          } else {
            inlineVolumes.push(volume);
          }
        } else {
          this.relationships.push(`  ${serviceName} -- "volume" --> volume-${volume.source}`);
        }
      });
      if (inlineVolumes.length > 0) {
        node.push(`volumes: ${inlineVolumes.join(', ')}`);
      }
    }
    return node;
  }

  // Build a flowchart node for a volume.
  private buildVolumeNode(volumeName: string, volumeConfig: any): string {
    const details: string[] = [];
    if (volumeConfig.external !== undefined) {
      details.push(`external: ${volumeConfig.external ? "true" : "false"}`);
    }
    if (volumeConfig.driver) {
      details.push(`driver: ${volumeConfig.driver}`);
    }
    if (volumeConfig.name) {
      details.push(`name: ${volumeConfig.name}`);
    }
    const label = `volume-${volumeName}<br>${details.join("<br>")}`;
    return `  volume-${volumeName}[${label}]\n  class volume-${volumeName} volume`;
  }

  // Generate network visualizations: subgraphs for networks with services, and simple nodes for empty networks.
  private generateNetworkSubgraphs(): string[] {
    const networkVisuals: string[] = [];
    const driverGroups: Map<string, string[]> = new Map();

    this.networkSubgraphs.forEach((data, networkName) => {
      if (data.services.length === 0) {
        // If the network has no services, create a simple network node instead of a subgraph.
        // networkVisuals.push(`  network-${networkName}["network-${networkName}"]\n  class network-${networkName} network;`);
        const networkClass = `    network-${networkName}["network-${networkName}"]\n    class network-${networkName} network;`
        const driver = data.driver;
        if (!driverGroups.has(driver)) {
          driverGroups.set(driver, []);
        }
        driverGroups.get(driver)?.push(networkClass);
      } else {
        // Otherwise, create a subgraph for networks with services.
        let subgraphBlock = `    subgraph network-${networkName} ["network-${networkName}"]`;
        data.services.forEach(serviceName => {
          const node = this.serviceNodes.get(serviceName);
          if (node) {
            subgraphBlock += `\n      ${node.trim()}`;
          }
        });
        subgraphBlock += `\n    end`;

        // Group subgraphs by network driver type
        const driver = data.driver;
        if (!driverGroups.has(driver)) {
          driverGroups.set(driver, []);
        }
        driverGroups.get(driver)?.push(subgraphBlock);
      }
    });

    // Wrap network subgraphs by driver type
    driverGroups.forEach((subgraphs, driver) => {
      let outerBlock = `  subgraph ${driver} ["${driver} Networks"]`;
      subgraphs.forEach(block => {
        outerBlock += `\n${block}`;
      });
      outerBlock += `\n  end`;
      networkVisuals.push(outerBlock);
    });

    return networkVisuals;
  }

  public generateMermaidDiagram(): string {
    // Gather nodes for services that are not part of any network subgraph.
    const servicesNotInSubgraph: string[] = [];
    this.serviceNodes.forEach((node, serviceName) => {
      const isInSubgraph = Array.from(this.networkSubgraphs.values()).some(subgraphData => subgraphData.services.includes(serviceName));
      if (!isInSubgraph) {
        servicesNotInSubgraph.push(node);
      }
    });

    const styleDefinitions = [
      `classDef container fill:${COLORS.container.fill},color:${COLORS.container.color};`,
      `classDef network fill:#cdffb2,color:#000,stroke:#6eaa49;`,
      `classDef volume fill:${COLORS.volume.fill},color:${COLORS.volume.color};`,
    ];

    return [
      ...this.header,
      // Services not inside any subgraph.
      ...servicesNotInSubgraph,
      // Outer subgraphs grouping network subgraphs by driver.
      ...this.generateNetworkSubgraphs(),
      // Volume nodes.
      ...this.volumeNodes,
      // Relationships.
      ...this.relationships,
      // Style definitions.
      ...styleDefinitions
    ].join("\n");
  }
}

