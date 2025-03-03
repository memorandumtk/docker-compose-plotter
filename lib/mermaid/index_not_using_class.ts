import { ComposeFileData } from "../../types/yaml";
import { ARROWS_TO_RIGHT, COLORS, FOUR_SPACES, TWO_SPACES } from '../../constants';
import { putEscapeCharactersOnBothSide } from "../../utils";

export function generateMermaidDiagram(composeObject: ComposeFileData): string {
  // Create a Map to hold different sections of the diagram.
  const diagramSections = new Map<string, string[]>();
  diagramSections.set("header", []);
  diagramSections.set("services", []);
  diagramSections.set("dependencies", []);
  diagramSections.set("networks", []);
  diagramSections.set("serviceNetworks", []);
  diagramSections.set("serviceVolumes", []);
  diagramSections.set("volumes", []);
  diagramSections.set("classDefinitions", []);

  const _makeHeader = () => {
    const arrayForHeader = []
    if (composeObject.name) {
      arrayForHeader.push(`---\ntitle: ${composeObject.name}\n---\nclassDiagram`)
    } else {
      arrayForHeader.push("classDiagram")
    }
    diagramSections.get("header")?.push(arrayForHeader.join())
  }
  _makeHeader()

  // Process services
  const servicesObject = composeObject.services || {};
  const mapObjectForServices: Map<string, string[]> = new Map();
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

    // Store the service lines in the Map so you can later add more properties if needed.
    mapObjectForServices.set(serviceName, serviceLines);

    // Handle dependencies for the service
    if (serviceConfig.depends_on) {
      if (Array.isArray(serviceConfig.depends_on)) {
        serviceConfig.depends_on.forEach(dependency => {
          diagramSections.get("dependencies")!.push(
            `${TWO_SPACES}${serviceName} ${ARROWS_TO_RIGHT.composition} ${putEscapeCharactersOnBothSide(dependency)}`
          );
        });
      } else if (typeof serviceConfig.depends_on === "string") {
        diagramSections.get("dependencies")!.push(
          `${TWO_SPACES}${serviceName} ${ARROWS_TO_RIGHT.composition} ${putEscapeCharactersOnBothSide(serviceConfig.depends_on)}`
        );
      }
    }
  });

  // Process networks defined at the root of the compose file
  const networksObject = composeObject.networks || {};
  const mapObjectForNetworks: Map<string, string[]> = new Map();
  if (networksObject) {
    Object.entries(networksObject).forEach(([networkName, networkConfig]) => {

      const networkLines: string[] = []
      networkLines.push(`${TWO_SPACES}class ${networkName}:::network {`)
      if (networkConfig.name) {
        networkLines.push(`${FOUR_SPACES}+name: ${networkConfig.name}`)
      }
      if (networkConfig.driver) {
        networkLines.push(`${FOUR_SPACES}+driver: ${networkConfig.driver}`)
      }
      networkLines.push(`${TWO_SPACES}}`)
      mapObjectForNetworks.set(networkName, networkLines)
    });
    diagramSections.set("networks", [...mapObjectForNetworks.values()].flat())

    // Process service-specific networks
    Object.entries(servicesObject).forEach(([serviceName, serviceConfig]) => {
      if (serviceConfig.networks && Array.isArray(serviceConfig.networks)) {
        serviceConfig.networks.forEach((network: string) => {
          diagramSections.get("serviceNetworks")!.push(
            `${TWO_SPACES}${serviceName} ${ARROWS_TO_RIGHT.dependency} ${putEscapeCharactersOnBothSide(network)}`
          );
        });
      }
    });
  }

  // Process volumes defined at the root
  const volumesObject = composeObject.volumes || {};
  Object.entries(volumesObject).forEach(([volumeName]) => {
    diagramSections.get("volumes")!.push(
      `${TWO_SPACES}class ${volumeName}:::volume { }`
    );
  });

  // Process service-specific volumes
  Object.entries(servicesObject).forEach(([serviceName, serviceConfig]) => {
    if (serviceConfig.volumes && Array.isArray(serviceConfig.volumes)) {
      serviceConfig.volumes.forEach((volume) => {
        let finalizedString = ""
        if (typeof volume === "string") {
          // make a link if volume is linked to a volume config
          // db-data:/var/lib/postgresql/data
          const targetVolumeName = volume.split(':')[0]
          Object.entries(volumesObject).some(([volumeName]) => volumeName === targetVolumeName)
            ? diagramSections.get("serviceVolumes")?.push(`${TWO_SPACES}${serviceName} ${ARROWS_TO_RIGHT.linkdashed} ${putEscapeCharactersOnBothSide(targetVolumeName)}`)
            : finalizedString = `+inner volume: ${FOUR_SPACES}+${volume}`
        } else {
          // If volume is an object, format the key-value pairs.
          const volumeStr = Object.entries(volume)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
          finalizedString = `${FOUR_SPACES}+${(volumeStr)}`
        }
      });
    }
  });

  // Close service class blocks after all properties have been appended.
  mapObjectForServices.forEach((lines, serviceName) => {
    lines.push(`${TWO_SPACES}}`);
  });

  // Set the services section in diagramSections using the Map values converted to an array.
  diagramSections.set("services", [...mapObjectForServices.values()].flat());

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
    ...diagramSections.get("serviceVolumes")!,
    ...diagramSections.get("volumes")!,
    ...diagramSections.get("classDefinitions")!
  ].join("\n");

  return finalDiagram;
}
