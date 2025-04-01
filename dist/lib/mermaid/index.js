export class ComposeMermaidGenerator {
  composeData;
  header = [];
  serviceNodes = new Map();
  relationships = [];
  networkSubgraphsMap = new Map();
  volumeNodes = new Map();
  constructor(baseCompose) {
    this.composeData = baseCompose;
    this.processData();
    // console.dir(this.composeData, { depth: null });
  }
  // Getters for testing and inspection.
  get networkSubgraphs() {
    return new Map(this.networkSubgraphsMap);
  }
  get volumeNodesMap() {
    return new Map(this.volumeNodes);
  }
  get serviceNodesMap() {
    return new Map(this.serviceNodes);
  }
  get relationshipList() {
    return [...this.relationships];
  }
  get headerList() {
    return [...this.header];
  }
  makeHeader() {
    const titleStr = this.composeData.name
      ? `title: ${this.composeData.name}`
      : "";
    return [
      `---`,
      `${titleStr}`,
      `---`,
      `%%{init: {'theme':'forest'}}%%`,
      `graph LR`,
    ];
  }
  processData() {
    const { services = {}, networks = {}, volumes = {} } = this.composeData;
    this.header = this.makeHeader();
    // Initialize subgraphs for defined networks.
    Object.entries(networks).forEach(([networkName, networkConfig]) => {
      const details = new Map();
      if (networkConfig && networkConfig.name) {
        details.set("name", this.escapeEnvVariables(networkConfig.name));
      }
      let driver = "bridge";
      if (networkConfig && networkConfig.driver) {
        details.set("driver", this.escapeEnvVariables(networkConfig.driver));
        driver = networkConfig.driver;
      }
      // Store both details and services as Maps.
      this.networkSubgraphsMap.set(networkName, {
        details,
        services: new Map(),
        driver,
      });
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
          serviceConfig.networks.forEach((network) => {
            const netSubgraph = this.networkSubgraphsMap.get(network);
            if (netSubgraph) {
              netSubgraph.services.set(serviceName, serviceName);
            }
          });
        } else if (typeof serviceConfig.networks === "object") {
          Object.keys(serviceConfig.networks).forEach((network) => {
            const netSubgraph = this.networkSubgraphsMap.get(network);
            if (netSubgraph) {
              netSubgraph.services.set(serviceName, serviceName);
            }
          });
        }
      }
      const processedLabelParts = this.processServiceRelationships(
        serviceName,
        serviceConfig,
        labelParts,
      );
      // Create a Mermaid node for the service.
      const mermaidNode = {
        id: serviceName,
        labelParts: new Map([
          ["header", this.putBoldTag(serviceName, 20)],
          ...Array.from(processedLabelParts),
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
  escapeEnvVariables(input) {
    try {
      if (input === null) return "";
      if (typeof input === "number") return input.toString();
      return input.replace(/\$\{([^}]+)\}/g, "#36;#123;$1#125;");
    } catch (e) {
      console.warn(e);
      console.warn(input);
      return "";
    }
  }
  putBoldTag(name, fontSize = 18) {
    return `<b style="font-size:${fontSize}px">${name}</b>`;
  }
  // Build label parts for a service node as a Map.
  buildServiceNode(serviceName, serviceConfig) {
    const labelParts = new Map();
    if (serviceConfig.name) {
      labelParts.set(
        "name",
        `${this.putBoldTag("name: ", 16)}${this.escapeEnvVariables(serviceConfig.name)}`,
      );
    }
    if (serviceConfig.image) {
      labelParts.set(
        "image",
        `${this.putBoldTag("image: ", 16)}${this.escapeEnvVariables(serviceConfig.image)}`,
      );
    }
    if (serviceConfig.ports) {
      const ports = serviceConfig.ports;
      const portsArray = [];
      if (Array.isArray(ports)) {
        ports.forEach((port) => {
          if (typeof port === "string") {
            portsArray.push(this.escapeEnvVariables(port));
          } else {
            portsArray.push(
              this.escapeEnvVariables(port.target ?? "") +
                ":" +
                this.escapeEnvVariables(port.published ?? ""),
            );
          }
        });
      }
      labelParts.set(
        "ports",
        `${this.putBoldTag("ports: ", 16)}${portsArray.join(", ")}`,
      );
    }
    return labelParts;
  }
  processServiceRelationships(serviceName, serviceConfig, labelParts) {
    // Process depends_on relationships.
    if (serviceConfig.depends_on) {
      if (Array.isArray(serviceConfig.depends_on)) {
        serviceConfig.depends_on.forEach((dependency) => {
          this.relationships.push(
            `  ${serviceName} -- "depends on" --> ${dependency}`,
          );
        });
      } else if (typeof serviceConfig.depends_on === "object") {
        const dependency = Object.keys(serviceConfig.depends_on)[0];
        this.relationships.push(
          `  ${serviceName} -- "depends on" --> ${dependency}`,
        );
      }
    }
    // Process volumes.
    if (serviceConfig.volumes) {
      const volumeSet = new Set();
      serviceConfig.volumes.forEach((volume) => {
        const inlineVolume = [];
        let source, target;
        if (typeof volume === "string") {
          [source, target] = volume.split(":");
        } else {
          source = volume.source;
          target = volume.target;
        }
        if (source && !volumeSet.has(source)) {
          if (
            Array.from(this.volumeNodes.values()).find((node) =>
              node.id.includes(source),
            )
          ) {
            this.relationships.push(
              `  ${serviceName} -. "volume" .-> volume-${source}`,
            );
          }
          inlineVolume.push(this.escapeEnvVariables(source));
        }
        if (target && !volumeSet.has(target)) {
          if (
            Array.from(this.volumeNodes.values()).find((node) =>
              node.id.includes(target),
            )
          ) {
            this.relationships.push(
              `  ${serviceName} -. "volume" .-> volume-${target}`,
            );
          }
          inlineVolume.push(this.escapeEnvVariables(target));
        }
        volumeSet.add(inlineVolume.join(": "));
      });
      if (volumeSet.size > 0) {
        labelParts.set(
          "volumes",
          `${this.putBoldTag("volumes: ", 16)}${Array.from(volumeSet).join(", ")}`,
        );
      }
    }
    return labelParts;
  }
  // Build a Mermaid node for a volume using a Map for labelParts.
  buildVolumeNode(volumeName, volumeConfig) {
    const labelParts = new Map();
    labelParts.set("header", this.putBoldTag("volume-" + volumeName));
    if (volumeConfig) {
      if (volumeConfig.external !== undefined) {
        labelParts.set(
          "external",
          `${this.putBoldTag("external: ", 16)}${volumeConfig.external ? "true" : "false"}`,
        );
      }
      if (volumeConfig.driver) {
        labelParts.set(
          "driver",
          `${this.putBoldTag("driver: ", 16)}${this.escapeEnvVariables(volumeConfig.driver)}`,
        );
      }
      if (volumeConfig.name) {
        labelParts.set(
          "name",
          `${this.putBoldTag("name: ", 16)}${this.escapeEnvVariables(volumeConfig.name)}`,
        );
      }
    }
    return {
      id: `volume-${volumeName}`,
      labelParts,
      className: "volume",
    };
  }
  // Generate network visualizations.
  generateNetworkSubgraphs() {
    const networkVisuals = [];
    const driverGroups = new Map();
    this.networkSubgraphsMap.forEach((data, networkName) => {
      // Create a header using the details map.
      const detailStr = Array.from(data.details.entries())
        .map(([key, value]) => `${key}: ${value}`)
        .join("<br>");
      // If if has service nodes, make it a node,
      // otherwise, make it a subgraph
      if (data.services.size === 0) {
        const boldName =
          this.putBoldTag(`network-${networkName}`) +
          (detailStr ? `<br>${detailStr}` : "");
        const networkNode = `    network-${networkName}[${boldName}]\n      class network-${networkName} network;`;
        const driver = data.driver;
        if (!driverGroups.has(driver)) {
          driverGroups.set(driver, []);
        }
        driverGroups.get(driver)?.push(networkNode);
      } else {
        // // this is for case that wants to include the network name
        // const headerLabel =
        //   this.putBoldTag(`network-${networkName}`) +
        //   (detailStr ? `<br>${detailStr}` : "");
        // let subgraphBlock = `    subgraph network-${networkName} [${headerLabel}]`;
        let subgraphBlock = `    subgraph network-${networkName}`;
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
      subgraphs.forEach((block) => {
        outerBlock += `\n${block}`;
      });
      outerBlock += `\n  end`;
      networkVisuals.push(outerBlock);
    });
    return networkVisuals;
  }
  // Helper: Convert a MermaidNode object to its string representation.
  convertMermaidNodeToString(node) {
    const label = Array.from(node.labelParts.values()).join("<br>");
    return `  ${node.id}(${label})\n  class ${node.id} ${node.className};`;
  }
  generateMermaidDiagram() {
    const servicesNotInSubgraph = [];
    this.serviceNodes.forEach((node, serviceName) => {
      const isInSubgraph = Array.from(this.networkSubgraphsMap.values()).some(
        (subgraphData) => subgraphData.services.has(serviceName),
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
      ...Array.from(this.volumeNodes.values()).map(
        this.convertMermaidNodeToString.bind(this),
      ),
      ...this.relationships,
      ...styleDefinitions,
    ].join("\n");
  }
}
