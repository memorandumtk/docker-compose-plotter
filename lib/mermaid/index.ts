import { ComposeFileData, VolumeInContainer } from "../../types/yaml";
import { ARROWS_TO_RIGHT, COLORS, DescriptionOfColors, FOUR_SPACES, TWO_SPACES } from '../../constants';
import { putEscapeCharactersOnBothSide } from "../../utils";

export class ComposeMermaidGenerator {
  private composeData: ComposeFileData;
  private header: string[] = [];
  private serviceNodes: Map<string, string> = new Map();
  private relationships: string[] = [];
  private networkSubgraphs: Map<string, { details: string[], services: string[] }> = new Map();
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
      `graph LR`
    ];
  }

  private processData(): void {
    const { services = {}, networks = {}, volumes = {} } = this.composeData;
    this.header = this.makeHeader();

    // Initialize subgraphs for defined networks
    Object.entries(networks).forEach(([networkName, networkConfig]) => {
      const details: string[] = [];
      if (networkConfig.name) {
        details.push(`name: ${networkConfig.name}`);
      }
      if (networkConfig.driver) {
        details.push(`driver: ${networkConfig.driver}`);
      }
      this.networkSubgraphs.set(networkName, { details, services: [] });
    });

    // Process volumes
    Object.entries(volumes).forEach(([volumeName, volumeConfig]) => {
      const node = this.buildVolumeNode(volumeName, volumeConfig);
      this.volumeNodes.push(node);
    });

    // Process services and their relationships
    Object.entries(services).forEach(([serviceName, serviceConfig]) => {
      const node = this.buildServiceNode(serviceName, serviceConfig);

      // Register the service inside each network subgraph it belongs to
      if (serviceConfig.networks) {
        serviceConfig.networks.forEach((network: string) => {
          const netSubgraph = this.networkSubgraphs.get(network);
          if (netSubgraph) {
            netSubgraph.services.push(serviceName);
          }
        });
      }

      const labelArray = this.processServiceRelationships(serviceName, serviceConfig, node);

      const nodeString = this.putEdgeStringsForServiceNode(serviceName, labelArray.join("<br>"))
      this.serviceNodes.set(serviceName, nodeString);
    });
  }

  /**
  * Put a string of serviceName and brakets
  */
  private putEdgeStringsForServiceNode(serviceName: string, label: string) {
    return `  ${serviceName}[${label}]`;
  }

  // Build a flowchart node for a service.
  private buildServiceNode(serviceName: string, serviceConfig: any): string[] {
    const details: string[] = [];
    if (serviceConfig.name) {
      details.push(`name: ${serviceConfig.name}`);
    }
    if (serviceConfig.image) {
      details.push(`image: ${serviceConfig.image}`);
    }
    if (serviceConfig.ports) {
      const portsArray: string[] = []
      serviceConfig.ports.forEach((port: string) => {
        portsArray.push(port)
      });
      details.push(`ports: ${portsArray.join(", ")}`);
    }
    if (serviceConfig.depends_on) {
      details.push(`depends_on: ${serviceConfig.depends_on.join(", ")}`);
    }
    details.unshift(serviceName)
    return details
  }

  private processServiceRelationships(serviceName: string, serviceConfig: any, node: string[]): string[] {
    // Process depends_on relationships
    if (serviceConfig.depends_on) {
      serviceConfig.depends_on.forEach((dependency: string) => {
        this.relationships.push(`  ${serviceName} -- "dependency" --> ${dependency}`);
      });
    }

    // Process network relationships (optional, since they're now shown via subgraphs)
    // if (serviceConfig.networks) {
    //   serviceConfig.networks.forEach((network: string) => {
    //     // You can still show an arrow from service to network if desired:
    //     this.relationships.push(`  ${serviceName} -- "network" --> network-${network}`);
    //   });
    // }

    // Process volumes
    if (serviceConfig.volumes) {
      const arrayToPushContainerVolume: string[] = []
      serviceConfig.volumes.forEach((volume: VolumeInContainer) => {
        if (typeof volume === "string") {
          const parts = volume.split(":");
          const source = parts[0];
          const target = parts[1];
          // Check if volume node exists by looking for a matching identifier in volumeNodes array
          if (this.volumeNodes.find(node => node.includes(`volume-${source}`))) {
            this.relationships.push(`  ${serviceName} -- "volume" --> volume-${source}`);
          } else if (this.volumeNodes.find(node => node.includes(`volume-${target}`))) {
            this.relationships.push(`  ${serviceName} -- "volume" --> volume-${target}`);
          } else {
            arrayToPushContainerVolume.push(volume)
            console.log(arrayToPushContainerVolume)
          }
        } else {
          this.relationships.push(`  ${serviceName} -- "volume" --> volume-${volume.source}`);
        }
      });
      if (arrayToPushContainerVolume.length > 0) {
        console.log(this.serviceNodes)
        node.push(`volumes: ${arrayToPushContainerVolume.join(', ')}`)
      }
    }
    return node
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

  // Generate subgraph definitions for networks. Each subgraph has a header with details and contains its related services.
  private generateNetworkSubgraphs(): string[] {
    const subgraphs: string[] = [];
    this.networkSubgraphs.forEach((data, networkName) => {
      const headerLabel = `network-${networkName}${data.details.length ? "<br>" + data.details.join("<br>") : ""}`;
      // Start subgraph block; note that Mermaid requires the "subgraph" keyword on its own line.
      let subgraphBlock = `  subgraph network-${networkName} [${headerLabel}]`;
      // Add all service nodes belonging to this network. They are indented inside the subgraph.
      data.services.forEach(serviceName => {
        const node = this.serviceNodes.get(serviceName);
        if (node) {
          // Ensure proper indentation inside subgraph
          subgraphBlock += `\n    ${node.trim()}`;
        }
      });
      subgraphBlock += `\n  end`;
      subgraphs.push(subgraphBlock);
    });
    return subgraphs;
  }

  public generateMermaidDiagram(): string {
    // Gather nodes for services that are not part of any network subgraph.
    const servicesNotInSubgraph: string[] = [];
    this.serviceNodes.forEach((node, serviceName) => {
      // Check if the service is not referenced in any network subgraph.
      const isInSubgraph = Array.from(this.networkSubgraphs.values()).some(subgraphData => subgraphData.services.includes(serviceName));
      if (!isInSubgraph) {
        servicesNotInSubgraph.push(node);
      }
    });

    const styleDefinitions = [
      `classDef container fill:${COLORS.container.fill},color:${COLORS.container.color};`,
      `classDef network fill:${COLORS.network.fill},color:${COLORS.network.color};`,
      `classDef volume fill:${COLORS.volume.fill},color:${COLORS.volume.color};`
    ];

    return [
      ...this.header,
      // Output services not inside any subgraph
      ...servicesNotInSubgraph,
      // Output network subgraphs
      ...this.generateNetworkSubgraphs(),
      // Output volume nodes
      ...this.volumeNodes,
      // Output relationships between nodes
      ...this.relationships,
      // Output style definitions
      ...styleDefinitions
    ].join("\n");
  }
}
