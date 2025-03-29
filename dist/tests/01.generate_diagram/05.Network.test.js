"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../lib/mermaid/index");
describe("Network subgraph that does not have any services", () => {
    const sampleCompose = {
        name: "network test",
        networks: {
            net1: { name: "test network", driver: "bridge" },
            net2: { name: "test custom network", driver: "custom-driver" },
        },
    };
    const generator = new index_1.ComposeMermaidGenerator(sampleCompose);
    const diagram = generator.generateMermaidDiagram();
    const networkSubgraphs = generator.networkSubgraphs;
    const net1Graph = networkSubgraphs.get("net1");
    const net2Graph = networkSubgraphs.get("net2");
    test("should include subgraph net 1 with correct driver", () => {
        expect(networkSubgraphs.has("net1")).toBe(true);
        expect(net1Graph?.driver).toBe("bridge");
    });
    test("should include subgraph net 2 with correct driver", () => {
        expect(networkSubgraphs.has("net2")).toBe(true);
        expect(net2Graph?.driver).toBe("custom-driver");
    });
    test("class should be included in the returned string", () => {
        expect(diagram).toContain(`class network-net1 network;`);
        expect(diagram).toContain(`class network-net2 network;`);
    });
    test("should have name in the returned string", () => {
        expect(diagram).toContain(
        // eslint-disable-next-line no-useless-escape
        `network-net1[<b style=\"font-size:18px\">network-net1</b><br>name: test network<br>driver: bridge]`);
        expect(diagram).toContain(
        // eslint-disable-next-line no-useless-escape
        `network-net2[<b style=\"font-size:18px\">network-net2</b><br>name: test custom network<br>driver: custom-driver]`);
    });
    test("should have driver in the returned string", () => {
        expect(diagram).toContain(`subgraph bridge [networks in bridge]`);
    });
});
