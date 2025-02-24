import * as fs from 'fs';
import { ComposeFileData } from "../../types/yaml";
import { ARROWS_TO_RIGHT, COLORS, FOUR_SPACES, TWO_SPACES } from '../../constants';


export function generateMermaidDiagram(composeObject: ComposeFileData): string {
  const diagram: string[] = [];
  // const config = `---\nconfig:\n${TWO_SPACES}theme: dark\n---`
  // diagram.push(config)
  diagram.push("classDiagram");

  const servicesObject = composeObject.services || {};
  const networksObject = composeObject.networks || {};
  const volumesObject = composeObject.volumes || {};

  const services = Object.entries(servicesObject)
  const networks = Object.entries(networksObject)
  const volumes = Object.entries(volumesObject)

  services.forEach(([serviceName, serviceConfig]) => {
    const containerClassString: string[] = [];
    containerClassString.push(`${TWO_SPACES}class ${serviceName}:::container {`);

    // Include image or build
    if (serviceConfig.image) {
      containerClassString.push(`${FOUR_SPACES}+image: ${serviceConfig.image}`);
    } else if (serviceConfig.build) {
      const buildObj = serviceConfig.build
      let formattedString = ""
      if (typeof buildObj === "string") {
        formattedString = buildObj
      } else {
        formattedString = Object.entries(buildObj).map(([key, value]) => {
          return `${key}: ${value}`
        }).join(', ')
        // }
        containerClassString.push(`${FOUR_SPACES}+build: ${formattedString}`);
      }
    }

    // Include exposed ports
    if (serviceConfig.ports) {
      serviceConfig.ports.forEach(port => {
        containerClassString.push(`${FOUR_SPACES}+port: ${port}`);
      });
    }

    containerClassString.push("  }");
    diagram.push(containerClassString.join("\n"));

    // for dependencies
    if (serviceConfig.depends_on) {
      if (typeof serviceConfig.depends_on === "string") {
        diagram.push(`${TWO_SPACES}${serviceName} ${ARROWS_TO_RIGHT.composition} ${serviceConfig.depends_on}`);
      } else if (typeof serviceConfig.depends_on.length) {
        serviceConfig.depends_on.forEach((dependency: string) => {
          diagram.push(`${TWO_SPACES}${serviceName} ${ARROWS_TO_RIGHT.composition} ${dependency}`);
        });
      }
    };
  });

  // for networks
  networks.forEach(network => {
    if (network) {
      if (typeof network === "string") {
        diagram.push(`${TWO_SPACES}class ${network}::: network { }`);
      } else {
        diagram.push(`${TWO_SPACES}class ${network[0]}::: network { }`);
      }
    }
  });

  services.forEach(([serviceName, serviceConfig]) => {
    if (serviceConfig.networks) {
      serviceConfig.networks.forEach((network: string) => {
        diagram.push(`${TWO_SPACES}${serviceName} ${ARROWS_TO_RIGHT.solidlink} ${network}`);
      });
    }
  });

  // for volumes
  volumes.forEach(volume => {
    if (volume) {
      if (typeof volume === "string") {
        diagram.push(`${TWO_SPACES}class ${volume}:::volume { }`);
      } else {
        diagram.push(`${TWO_SPACES}class ${volume[0]}:::volume { }`);
      }
    }
  });

  services.forEach(([serviceName, serviceConfig]) => {
    if (serviceConfig.volumes) {
      const volumesValue = serviceConfig.volumes
      let formattedString = ""
      if (typeof volumesValue === "string") {
        formattedString = volumesValue
        diagram.push(`${TWO_SPACES}${serviceName} ${ARROWS_TO_RIGHT.association} ${volumesValue}`);
      } else {
        formattedString = Object.entries(volumesValue).map(([key, value]) => {
          return `${key}: ${value}`
        }).join(', ')
      }
    }
  });

  const classDifForContainer = `${TWO_SPACES}classDef container fill:${COLORS.container.fill},color${COLORS.container.color}`
  const classDifForNetwork = `${TWO_SPACES}classDef network fill:${COLORS.network.fill},color${COLORS.network.color}`
  const classDifForVolume = `${TWO_SPACES}classDef volume fill:${COLORS.volume.fill},color${COLORS.volume.color}`

  diagram.push(classDifForContainer)
  diagram.push(classDifForNetwork)
  diagram.push(classDifForVolume)

  return diagram.join("\n");
}


export const writeMermaidDiagramToFile = (diagramText: string) => {
  const FILENAME = "diagram.mmd";
  try {
    fs.writeFileSync(FILENAME, diagramText);
  } catch (e) {
    throw new Error(`Failed to write data to a file: ${FILENAME}`)
  }
}
