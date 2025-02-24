import { ComposeFileData } from "../../types/yaml";
import { ARROWS_TO_RIGHT, COLORS, FOUR_SPACES, TWO_SPACES } from '../../constants';
import { putEscapeCharactersOnBothSide } from "../../utils";

export function generateMermaidDiagram(composeObject: ComposeFileData): string {
  // Create a Map to hold different sections of the diagram.
  const diagramSections = new Map<string, string[]>();
  diagramSections.set("header", ["classDiagram"]);
  diagramSections.set("services", []);
  diagramSections.set("dependencies", []);
  diagramSections.set("networks", []);
  diagramSections.set("serviceNetworks", []);
  diagramSections.set("volumes", []);
  diagramSections.set("classDefinitions", []);

  // Process services
  const servicesObject = composeObject.services || {};
  Object.entries(servicesObject).forEach(([serviceName, serviceConfig]) => {
    const serviceLines: string[] = [];
    serviceLines.push(`${TWO_SPACES}class ${serviceName}:::container {`);

    // Include image or build details
    if (serviceConfig.image) {
      serviceLines.push(`${FOUR_SPACES}+image: ${serviceConfig.image}`);
    } else if (serviceConfig.build) {
      if (typeof serviceConfig.build === "string") {
        serviceLines.push(`${FOUR_SPACES}+build: ${serviceConfig.build}`);
      } else {
        const buildStr = Object.entries(serviceConfig.build)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        serviceLines.push(`${FOUR_SPACES}+build: ${buildStr}`);
      }
    }

    // Include exposed ports
    if (serviceConfig.ports && Array.isArray(serviceConfig.ports)) {
      serviceConfig.ports.forEach(port => {
        serviceLines.push(`${FOUR_SPACES}+port: ${port}`);
      });
    }
    serviceLines.push(`${TWO_SPACES}}`);

    // Add the service block to the "services" section
    diagramSections.get("services")!.push(serviceLines.join("\n"));

    // Handle dependencies for the service
    if (serviceConfig.depends_on) {
      if (Array.isArray(serviceConfig.depends_on)) {
        serviceConfig.depends_on.forEach(dependency => {
          diagramSections.get("dependencies")!.push(`${TWO_SPACES}${serviceName} ${ARROWS_TO_RIGHT.composition} ${putEscapeCharactersOnBothSide(dependency)}`);
        });
      } else if (typeof serviceConfig.depends_on === "string") {
        diagramSections.get("dependencies")!.push(`${TWO_SPACES}${serviceName} ${ARROWS_TO_RIGHT.composition} ${putEscapeCharactersOnBothSide(serviceConfig.depends_on)}`);
      }
    }
  });

  // Process networks defined at the root of the compose file
  const networksObject = composeObject.networks || {};
  Object.entries(networksObject).forEach(([networkName]) => {
    diagramSections.get("networks")!.push(`${TWO_SPACES}class ${networkName}:::network { }`);
  });

  // Process service-specific networks
  Object.entries(servicesObject).forEach(([serviceName, serviceConfig]) => {
    console.log({ network: serviceConfig.networks })
    if (serviceConfig.networks && Array.isArray(serviceConfig.networks)) {
      serviceConfig.networks.forEach((network: string) => {
        diagramSections.get("serviceNetworks")!.push(`${TWO_SPACES}${serviceName} ${ARROWS_TO_RIGHT.solidlink} ${putEscapeCharactersOnBothSide(network)}`);
      });
    }
  });

  // Process volumes defined at the root
  const volumesObject = composeObject.volumes || {};
  Object.entries(volumesObject).forEach(([volumeName]) => {
    diagramSections.get("volumes")!.push(`${TWO_SPACES}class ${volumeName}:::volume { }`);
  });

  // Process service-specific volumes
  Object.entries(servicesObject).forEach(([serviceName, serviceConfig]) => {
    if (serviceConfig.volumes && Array.isArray(serviceConfig.volumes)) {
      serviceConfig.volumes.forEach((volume) => {
        if (typeof volume === "string") {
          if (diagramSections.get("services")) console.log({ servs: diagramSections.get("services") })
          diagramSections.get("volumes")!.push(`${TWO_SPACES}${serviceName} ${ARROWS_TO_RIGHT.association} ${putEscapeCharactersOnBothSide(volume)}`);
        } else {
          // If volume is an object, format the key-value pairs.
          const volumeStr = Object.entries(volume)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
          diagramSections.get("volumes")!.push(`${TWO_SPACES}${serviceName} ${ARROWS_TO_RIGHT.association} ${putEscapeCharactersOnBothSide(volumeStr)}`);
        }
      });
    }
  });

  // Define class styling
  const classDefinitions = [
    `${TWO_SPACES}classDef container fill:${COLORS.container.fill},color:${COLORS.container.color}`,
    `${TWO_SPACES}classDef network fill:${COLORS.network.fill},color:${COLORS.network.color}`,
    `${TWO_SPACES}classDef volume fill:${COLORS.volume.fill},color:${COLORS.volume.color}`
  ];
  diagramSections.set("classDefinitions", classDefinitions);

  // Build the final diagram by concatenating sections in the desired order.
  const finalDiagram = [
    ...diagramSections.get("header")!,
    ...diagramSections.get("services")!,
    ...diagramSections.get("dependencies")!,
    ...diagramSections.get("networks")!,
    ...diagramSections.get("serviceNetworks")!,
    ...diagramSections.get("volumes")!,
    ...diagramSections.get("classDefinitions")!
  ].join("\n");

  return finalDiagram;
}

