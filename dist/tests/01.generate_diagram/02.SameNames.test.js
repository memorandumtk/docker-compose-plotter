"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../lib/mermaid/index");
describe("SameNames", () => {
    let sampleCompose;
    let generator;
    let diagram;
    beforeAll(() => {
        sampleCompose = {
            name: "Having same names of network and volume with a container",
            services: {
                frontend: {
                    build: { context: "frontend", target: "development" },
                    networks: ["frontend"],
                    ports: ["3000:3000"],
                    volumes: ["./frontend/src:/code/src:ro"],
                },
            },
            networks: {
                frontend: { name: "custom_frontend", driver: "custom-driver-1" },
            },
            volumes: {
                frontend: {
                    external: false,
                    driver: "local",
                },
            },
        };
        generator = new index_1.ComposeMermaidGenerator(sampleCompose);
        diagram = generator.generateMermaidDiagram();
    });
    test("should have service definitions", () => {
        const serviceNodes = generator.serviceNodesMap;
        expect(serviceNodes.has("frontend")).toBe(true);
        const frontend = serviceNodes.get("frontend");
        expect(frontend?.id).toBe("frontend");
        expect(frontend?.labelParts.get("header")).toBe(`<b style="font-size:20px">frontend</b>`);
    });
    test("should have network subgraph with correct driver", () => {
        const networkSubgraphs = generator.networkSubgraphs;
        expect(networkSubgraphs.has("frontend")).toBe(true);
    });
    test("should have network subgraph definition in returned string", () => {
        expect(diagram).toContain("subgraph network-frontend");
    });
    test("should have volume node definitions", () => {
        const volumes = generator.volumeNodesMap;
        expect(volumes.has("frontend")).toBe(true);
        const volumeNode = volumes.get("frontend");
        expect(volumeNode?.id).toBe("volume-frontend");
    });
});
