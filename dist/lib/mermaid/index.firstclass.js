"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComposeMermaidGenerator = void 0;
const constants_1 = require("../../constants");
const utils_1 = require("../../utils");
class ComposeMermaidGenerator {
    composeData;
    header = [];
    classDefinitions = [];
    relationships = new Map();
    containers = new Map();
    networks = new Map();
    volumes = new Map();
    constructor(baseCompose, overrideCompose) {
        this.composeData = baseCompose;
        this.processData();
    }
    makeHeader() {
        return this.composeData.name
            ? [`---`, `title: ${this.composeData.name}`, `---`, `classDiagram`]
            : ['classDiagram'];
    }
    processData() {
        const { services = {}, networks = {}, volumes = {} } = this.composeData;
        this.header = this.makeHeader();
        // Process services and their relationships
        Object.entries(services).forEach(([serviceName, serviceConfig]) => {
            const serviceClass = this.buildServiceClass(serviceName, serviceConfig);
            this.containers.set(serviceName, serviceClass);
            this.processServiceRelationships(serviceName, serviceConfig);
        });
        // Process networks
        Object.entries(networks).forEach(([networkName, networkConfig]) => {
            this.networks.set(networkName, this.buildNetworkClass(networkName, networkConfig));
        });
        // Process volumes
        Object.entries(volumes).forEach(([volumeName, volumeConfig]) => {
            this.volumes.set(volumeName, this.buildVolumeClass(volumeName, volumeConfig));
        });
        // Define color styles for the classes
        this.classDefinitions = [
            `${constants_1.TWO_SPACES}classDef container fill:${constants_1.COLORS.container.fill},color:${constants_1.COLORS.container.color}`,
            `${constants_1.TWO_SPACES}classDef network fill:${constants_1.COLORS.network.fill},color:${constants_1.COLORS.network.color}`,
            `${constants_1.TWO_SPACES}classDef volume fill:${constants_1.COLORS.volume.fill},color:${constants_1.COLORS.volume.color}`
        ];
    }
    buildServiceClass(serviceName, serviceConfig) {
        const lines = [`${constants_1.TWO_SPACES}class ${serviceName}:::container {`];
        if (serviceConfig.image) {
            lines.push(`${constants_1.FOUR_SPACES}+image: ${serviceConfig.image}`);
        }
        if (serviceConfig.ports) {
            serviceConfig.ports.forEach((port) => {
                lines.push(`${constants_1.FOUR_SPACES}+port: ${port}`);
            });
        }
        lines.push(`${constants_1.TWO_SPACES}}`);
        return lines;
    }
    processServiceRelationships(serviceName, serviceConfig) {
        if (serviceConfig.depends_on) {
            serviceConfig.depends_on.forEach((dependency) => {
                this.relationships.set(`${constants_1.TWO_SPACES}${serviceName} ${constants_1.ARROWS_TO_RIGHT.composition} ${dependency}`, `${constants_1.TWO_SPACES}${serviceName} --* ${(0, utils_1.putEscapeCharactersOnBothSide)(dependency)}`);
            });
        }
        if (serviceConfig.networks) {
            serviceConfig.networks.forEach((network) => {
                this.relationships.set(`${constants_1.TWO_SPACES}${serviceName} -- ${network}`, `${constants_1.TWO_SPACES}${serviceName} ${constants_1.ARROWS_TO_RIGHT.solidlink} ${network}`);
            });
        }
        if (serviceConfig.volumes) {
            serviceConfig.volumes.forEach((volume) => {
                if (typeof volume === "string") {
                    this.relationships.set(`${constants_1.TWO_SPACES}${serviceName} --o ${volume}`, `${constants_1.TWO_SPACES}${serviceName} ${constants_1.ARROWS_TO_RIGHT.aggregation} ${(0, utils_1.putEscapeCharactersOnBothSide)(volume)}`);
                }
                else {
                    this.relationships.set(`${constants_1.TWO_SPACES}${serviceName} --o ${volume.source}`, `${constants_1.TWO_SPACES}${serviceName} ${constants_1.ARROWS_TO_RIGHT.aggregation} ${(0, utils_1.putEscapeCharactersOnBothSide)(volume.target)}`);
                }
            });
        }
    }
    buildNetworkClass(networkName, networkConfig) {
        const lines = [`${constants_1.TWO_SPACES}class ${networkName}:::network {`];
        if (networkConfig.name) {
            lines.push(`${constants_1.FOUR_SPACES}+name: ${networkConfig.name}`);
        }
        if (networkConfig.driver) {
            lines.push(`${constants_1.FOUR_SPACES}+driver: ${networkConfig.driver}`);
        }
        lines.push(`${constants_1.TWO_SPACES}}`);
        return lines;
    }
    buildVolumeClass(volumeName, volumeConfig) {
        const lines = [`${constants_1.TWO_SPACES}class ${volumeName}:::volume {`];
        if (volumeConfig.external) {
            lines.push(`${constants_1.FOUR_SPACES}+external: ${volumeConfig.external}`);
        }
        if (volumeConfig.driver) {
            lines.push(`${constants_1.FOUR_SPACES}+driver: ${volumeConfig.driver}`);
        }
        lines.push(`${constants_1.TWO_SPACES}}`);
        return lines;
    }
    generateMermaidDiagram() {
        const containersString = [...this.containers.values()].flat().join("\n");
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
exports.ComposeMermaidGenerator = ComposeMermaidGenerator;
