"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMermaidDiagram = generateMermaidDiagram;
const constants_1 = require("../../constants");
const utils_1 = require("../../utils");
function generateMermaidDiagram(composeObject) {
    // Create a Map to hold different sections of the diagram.
    const diagramSections = new Map();
    diagramSections.set("header", []);
    diagramSections.set("services", []);
    diagramSections.set("dependencies", []);
    diagramSections.set("networks", []);
    diagramSections.set("serviceNetworks", []);
    diagramSections.set("serviceVolumes", []);
    diagramSections.set("volumes", []);
    diagramSections.set("classDefinitions", []);
    const _makeHeader = () => {
        const arrayForHeader = [];
        if (composeObject.name) {
            arrayForHeader.push(`---\ntitle: ${composeObject.name}\n---\nclassDiagram`);
        }
        else {
            arrayForHeader.push("classDiagram");
        }
        diagramSections.get("header")?.push(arrayForHeader.join());
    };
    _makeHeader();
    // Process services
    const servicesObject = composeObject.services || {};
    const mapObjectForServices = new Map();
    Object.entries(servicesObject).forEach(([serviceName, serviceConfig]) => {
        const serviceLines = [];
        serviceLines.push(`${constants_1.TWO_SPACES}class ${serviceName}:::container {`);
        // Include image or build details
        if (serviceConfig.image) {
            serviceLines.push(`${constants_1.FOUR_SPACES}+image: ${serviceConfig.image}`);
        }
        else if (serviceConfig.build) {
            if (typeof serviceConfig.build === "string") {
                serviceLines.push(`${constants_1.FOUR_SPACES}+build: ${serviceConfig.build}`);
            }
            else {
                const buildStr = Object.entries(serviceConfig.build)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(', ');
                serviceLines.push(`${constants_1.FOUR_SPACES}+build: ${buildStr}`);
            }
        }
        // Include exposed ports
        if (serviceConfig.ports && Array.isArray(serviceConfig.ports)) {
            serviceConfig.ports.forEach(port => {
                serviceLines.push(`${constants_1.FOUR_SPACES}+port: ${port}`);
            });
        }
        // Store the service lines in the Map so you can later add more properties if needed.
        mapObjectForServices.set(serviceName, serviceLines);
        // Handle dependencies for the service
        if (serviceConfig.depends_on) {
            if (Array.isArray(serviceConfig.depends_on)) {
                serviceConfig.depends_on.forEach(dependency => {
                    diagramSections.get("dependencies").push(`${constants_1.TWO_SPACES}${serviceName} ${constants_1.ARROWS_TO_RIGHT.composition} ${(0, utils_1.putEscapeCharactersOnBothSide)(dependency)}`);
                });
            }
            else if (typeof serviceConfig.depends_on === "string") {
                diagramSections.get("dependencies").push(`${constants_1.TWO_SPACES}${serviceName} ${constants_1.ARROWS_TO_RIGHT.composition} ${(0, utils_1.putEscapeCharactersOnBothSide)(serviceConfig.depends_on)}`);
            }
        }
    });
    // Process networks defined at the root of the compose file
    const networksObject = composeObject.networks || {};
    const mapObjectForNetworks = new Map();
    if (networksObject) {
        Object.entries(networksObject).forEach(([networkName, networkConfig]) => {
            const networkLines = [];
            networkLines.push(`${constants_1.TWO_SPACES}class ${networkName}:::network {`);
            if (networkConfig.name) {
                networkLines.push(`${constants_1.FOUR_SPACES}+name: ${networkConfig.name}`);
            }
            if (networkConfig.driver) {
                networkLines.push(`${constants_1.FOUR_SPACES}+driver: ${networkConfig.driver}`);
            }
            networkLines.push(`${constants_1.TWO_SPACES}}`);
            mapObjectForNetworks.set(networkName, networkLines);
        });
        diagramSections.set("networks", [...mapObjectForNetworks.values()].flat());
        // Process service-specific networks
        Object.entries(servicesObject).forEach(([serviceName, serviceConfig]) => {
            if (serviceConfig.networks && Array.isArray(serviceConfig.networks)) {
                serviceConfig.networks.forEach((network) => {
                    diagramSections.get("serviceNetworks").push(`${constants_1.TWO_SPACES}${serviceName} ${constants_1.ARROWS_TO_RIGHT.dependency} ${(0, utils_1.putEscapeCharactersOnBothSide)(network)}`);
                });
            }
        });
    }
    // Process volumes defined at the root
    const volumesObject = composeObject.volumes || {};
    Object.entries(volumesObject).forEach(([volumeName]) => {
        diagramSections.get("volumes").push(`${constants_1.TWO_SPACES}class ${volumeName}:::volume { }`);
    });
    // Process service-specific volumes
    Object.entries(servicesObject).forEach(([serviceName, serviceConfig]) => {
        if (serviceConfig.volumes && Array.isArray(serviceConfig.volumes)) {
            serviceConfig.volumes.forEach((volume) => {
                let finalizedString = "";
                if (typeof volume === "string") {
                    // make a link if volume is linked to a volume config
                    // db-data:/var/lib/postgresql/data
                    const targetVolumeName = volume.split(':')[0];
                    Object.entries(volumesObject).some(([volumeName]) => volumeName === targetVolumeName)
                        ? diagramSections.get("serviceVolumes")?.push(`${constants_1.TWO_SPACES}${serviceName} ${constants_1.ARROWS_TO_RIGHT.linkdashed} ${(0, utils_1.putEscapeCharactersOnBothSide)(targetVolumeName)}`)
                        : finalizedString = `+inner volume: ${constants_1.FOUR_SPACES}+${volume}`;
                }
                else {
                    // If volume is an object, format the key-value pairs.
                    const volumeStr = Object.entries(volume)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(', ');
                    finalizedString = `${constants_1.FOUR_SPACES}+${(volumeStr)}`;
                }
            });
        }
    });
    // Close service class blocks after all properties have been appended.
    mapObjectForServices.forEach((lines, serviceName) => {
        lines.push(`${constants_1.TWO_SPACES}}`);
    });
    // Set the services section in diagramSections using the Map values converted to an array.
    diagramSections.set("services", [...mapObjectForServices.values()].flat());
    // Define class styling
    const classDefinitions = [
        `${constants_1.TWO_SPACES}classDef container fill:${constants_1.COLORS.container.fill},color:${constants_1.COLORS.container.color}`,
        `${constants_1.TWO_SPACES}classDef network fill:${constants_1.COLORS.network.fill},color:${constants_1.COLORS.network.color}`,
        `${constants_1.TWO_SPACES}classDef volume fill:${constants_1.COLORS.volume.fill},color:${constants_1.COLORS.volume.color}`
    ];
    diagramSections.set("classDefinitions", classDefinitions);
    // Build the final diagram by concatenating sections in the desired order.
    const finalDiagram = [
        ...diagramSections.get("header"),
        ...diagramSections.get("services"),
        ...diagramSections.get("dependencies"),
        ...diagramSections.get("networks"),
        ...diagramSections.get("serviceNetworks"),
        ...diagramSections.get("serviceVolumes"),
        ...diagramSections.get("volumes"),
        ...diagramSections.get("classDefinitions")
    ].join("\n");
    return finalDiagram;
}
