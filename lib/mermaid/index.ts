import { ComposeFileData, VolumeInContainer } from "../../types/yaml";
import { ARROWS_TO_RIGHT, COLORS, DescriptionOfColors, FOUR_SPACES, TWO_SPACES } from '../../constants';
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
    console.dir(this.composeData, { depth: null })
  }

  private makeHeader(): string[] {
    const titleStr = this.composeData.name ? `title: ${this.composeData.name}` : ""
    return [`---`, `${titleStr}${TWO_SPACES}${DescriptionOfColors}`, `---`, `classDiagram`]
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
      // put "}" after all proccess for container (service) is done
      this.containers.get(serviceName)?.push(`${TWO_SPACES}}`);
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
    if (serviceConfig.name) {
      lines.push(`${FOUR_SPACES}+name: ${serviceConfig.name}`);
    }
    if (serviceConfig.image) {
      lines.push(`${FOUR_SPACES}+image: ${serviceConfig.image}`);
    }
    if (serviceConfig.ports) {
      serviceConfig.ports.forEach((port: string) => {
        lines.push(`${FOUR_SPACES}+ports: ${port}`);
      });
    }
    if (serviceConfig.depends_on) {
      serviceConfig.depends_on.forEach((dep: string) => {
        lines.push(`${FOUR_SPACES}+depends_on: ${dep}`);
      });
    }
    return lines;
  }

  private processServiceRelationships(serviceName: string, serviceConfig: any): void {
    if (serviceConfig.depends_on) {
      serviceConfig.depends_on.forEach((dependency: string) => {
        this.relationships.set(
          `${TWO_SPACES}${serviceName} ${ARROWS_TO_RIGHT.composition} ${dependency}: dependency`,
          `${TWO_SPACES}${serviceName} ${ARROWS_TO_RIGHT.composition} ${putEscapeCharactersOnBothSide(dependency)} : dependency`
        );
      });
    }
    if (serviceConfig.networks) {
      const inlineNetworks: string[] = []
      serviceConfig.networks.forEach((network: string) => {
        const setRelationshipOfNetwork = (name: string) => {
          this.relationships.set(
            `${TWO_SPACES}${serviceName} ${ARROWS_TO_RIGHT.association} ${name}: network`,
            `${TWO_SPACES}${serviceName} ${ARROWS_TO_RIGHT.association} ${putEscapeCharactersOnBothSide(name)}: network`
          );
        }
        if (this.networks.has(network)) {
          setRelationshipOfNetwork(`network-${network}`)
        } else {
          inlineNetworks.push(`${FOUR_SPACES}+networks: ${network}`)
        }
      });
      if (inlineNetworks.length > 0) {
        this.containers.get(serviceName)?.push(inlineNetworks.join("\n"))
      }
    }
    if (serviceConfig.volumes) {
      const inlineVolumes: string[] = []
      serviceConfig.volumes.forEach((volume: VolumeInContainer) => {
        if (typeof volume === "string") {
          const source = volume.split(":")[0]
          const target = volume.split(":")[1]
          const setRelationshipOfVolume = (name: string) => {
            this.relationships.set(
              `${TWO_SPACES}${serviceName} ${ARROWS_TO_RIGHT.realization} ${name}: volume`,
              `${TWO_SPACES}${serviceName} ${ARROWS_TO_RIGHT.realization} ${putEscapeCharactersOnBothSide(name)}: volume`
            );
          }
          if (this.volumes.has(source)) {
            setRelationshipOfVolume(`volume-${source}`)
          } else if (this.volumes.has(target)) {
            setRelationshipOfVolume(`volume-${target}`)
          } else {
            inlineVolumes.push(`${FOUR_SPACES}+volumes: ${volume}`)
          }
        } else {
          this.relationships.set(
            `${TWO_SPACES}${serviceName} ${ARROWS_TO_RIGHT.realization} ${volume.source}: volume`,
            `${TWO_SPACES}${serviceName} ${ARROWS_TO_RIGHT.realization} ${putEscapeCharactersOnBothSide("volume-" + volume.source)}: volume`
          );
        }
      });
      if (inlineVolumes.length > 0) {
        this.containers.get(serviceName)?.push(inlineVolumes.join("\n"))
      }
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
    if (volumeConfig.external !== undefined) { // might be false so needed to check only if undefined
      lines.push(`${FOUR_SPACES}+external: ${volumeConfig.external ? "true" : "false"}`);
    }
    if (volumeConfig.driver) {
      lines.push(`${FOUR_SPACES}+driver: ${volumeConfig.driver}`);
    }
    if (volumeConfig.name) {
      lines.push(`${FOUR_SPACES}+name: ${volumeConfig.name}`);
    }
    lines.push(`${TWO_SPACES}}`);
    return lines;
  }

  public generateMermaidDiagram(): string {
    const containersString = [...this.containers.values()].flat().join("\n");
    // console.log("containersString")
    // console.log(containersString)
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
