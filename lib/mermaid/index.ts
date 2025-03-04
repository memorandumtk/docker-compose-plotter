import { ComposeFileData, VolumeInContainer } from "../../types/yaml";
import { ARROWS_TO_RIGHT, COLORS, FOUR_SPACES, TWO_SPACES } from '../../constants';
import { putEscapeCharactersOnBothSide } from "../../utils";


export class ComposeMermaidGenerator {
  private composeData: ComposeFileData;
  private header: string[] = [];
  private classDefinitions: string[] = [];
  private relationships: Map<string, string> = new Map();
  private containers: Map<string, string[]> = new Map();
  private networks: Map<string, string[]> = new Map();
  private volumes: Map<string, string[]> = new Map();

  constructor(baseCompose: ComposeFileData, overrideCompose?: ComposeFileData) {
    this.composeData = baseCompose;
    this.processData();
    // console.dir(this.composeData, {depth: null})
  }

  private makeHeader(): string[] {
    return this.composeData.name
      ? [`---`, `title: ${this.composeData.name}`, `---`, `classDiagram`]
      : ['classDiagram'];
  }

  private processData(): void {
    const { services = {}, networks = {}, volumes = {} } = this.composeData;
    this.header = this.makeHeader();

    // Process networks
    Object.entries(networks).forEach(([networkName, networkConfig]) => {
      this.networks.set(`${networkName}`, this.buildNetworkClass(networkName, networkConfig));
    });

    // Process volumes
    Object.entries(volumes).forEach(([volumeName, volumeConfig]) => {
      this.volumes.set(`${volumeName}`, this.buildVolumeClass(volumeName, volumeConfig));
    });

    // Process services and their relationships
    Object.entries(services).forEach(([serviceName, serviceConfig]) => {
      const serviceClass = this.buildServiceClass(serviceName, serviceConfig);
      this.containers.set(serviceName, serviceClass);
      this.processServiceRelationships(serviceName, serviceConfig);
    });

    // Define color styles for the classes
    this.classDefinitions = [
      `${TWO_SPACES}classDef container fill:${COLORS.container.fill},color:${COLORS.container.color}`,
      `${TWO_SPACES}classDef network fill:${COLORS.network.fill},color:${COLORS.network.color}`,
      `${TWO_SPACES}classDef volume fill:${COLORS.volume.fill},color:${COLORS.volume.color}`
    ];
  }

  private buildServiceClass(serviceName: string, serviceConfig: any): string[] {
    const lines: string[] = [`${TWO_SPACES}class ${serviceName}:::container {`];
    if (serviceConfig.image) {
      lines.push(`${FOUR_SPACES}+image: ${serviceConfig.image}`);
    }
    if (serviceConfig.ports) {
      serviceConfig.ports.forEach((port: string) => {
        lines.push(`${FOUR_SPACES}+port: ${port}`);
      });
    }
    lines.push(`${TWO_SPACES}}`);
    return lines;
  }

  private processServiceRelationships(serviceName: string, serviceConfig: any): void {
    if (serviceConfig.depends_on) {
      serviceConfig.depends_on.forEach((dependency: string) => {
        this.relationships.set(
          `${TWO_SPACES}${serviceName} ${ARROWS_TO_RIGHT.composition} ${dependency}`,
          `${TWO_SPACES}${serviceName} --* ${putEscapeCharactersOnBothSide(dependency)}`
        );
      });
    }
    if (serviceConfig.networks) {
      serviceConfig.networks.forEach((network: string) => {
        this.relationships.set(
          `${TWO_SPACES}${serviceName} -- ${network}`,
          `${TWO_SPACES}${serviceName} ${ARROWS_TO_RIGHT.solidlink} network-${network}`
        );
      });
    }
    if (serviceConfig.volumes) {
      serviceConfig.volumes.forEach((volume: VolumeInContainer) => {
        if (typeof volume === "string") {
          const source = volume.split(":")[0]
          const target = volume.split(":")[1]
          const name = this.volumes.has(source) ? `volume-${source}` : this.volumes.has(target) ? `volume${target}` : volume
          this.relationships.set(
            `${TWO_SPACES}${serviceName} --o ${name}`,
            `${TWO_SPACES}${serviceName} ${ARROWS_TO_RIGHT.aggregation} ${putEscapeCharactersOnBothSide(name)}`
          );
        } else {
          this.relationships.set(
            `${TWO_SPACES}${serviceName} --o ${volume.source}`,
            `${TWO_SPACES}${serviceName} ${ARROWS_TO_RIGHT.aggregation} ${putEscapeCharactersOnBothSide("volume-" + volume.source)}`
          );
        }
      });
    }
  }

  private buildNetworkClass(networkName: string, networkConfig: any): string[] {
    const lines: string[] = [`${TWO_SPACES}class network-${networkName}:::network {`];
    if (networkConfig.name) {
      lines.push(`${FOUR_SPACES}+name: ${networkConfig.name}`);
    }
    if (networkConfig.driver) {
      lines.push(`${FOUR_SPACES}+driver: ${networkConfig.driver}`);
    }
    lines.push(`${TWO_SPACES}}`);
    return lines;
  }

  private buildVolumeClass(volumeName: string, volumeConfig: any): string[] {
    // const lines: string[] = [`${TWO_SPACES}class ${volumeName}:::volume {`];
    const lines: string[] = [`${TWO_SPACES}class volume-${volumeName}:::volume {`];
    if (volumeConfig.external) {
      lines.push(`${FOUR_SPACES}+external: ${volumeConfig.external}`);
    }
    if (volumeConfig.driver) {
      lines.push(`${FOUR_SPACES}+driver: ${volumeConfig.driver}`);
    }
    lines.push(`${TWO_SPACES}}`);
    return lines;
  }

  public generateMermaidDiagram(): string {
    const containersString = [...this.containers.values()].flat().join("\n");
    console.log("containersString")
    console.log(containersString)
    const relationshipsString = [...this.relationships.values()].flat().join("\n");
    const networksString = [...this.networks.values()].flat().join("\n");
    const volumesString = [...this.volumes.values()].flat().join("\n");

    return [
      ...this.header,
      containersString,
      relationshipsString,
      networksString,
      volumesString,
      ...this.classDefinitions,
    ].join("\n");
  }
}
