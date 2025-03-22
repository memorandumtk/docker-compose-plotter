import { TWO_SPACES } from '../../constants';
import { ComposeMermaidGenerator } from '../../lib/mermaid/index';

describe('NetworkAvailableProperties', () => {
  let sampleCompose: any;
  let generator: ComposeMermaidGenerator;
  let diagram: string;

  sampleCompose = {
    name: "network test",
    networks: {
      net1: { name: 'test network', driver: 'bridge' },
      net2: { name: 'test custom network', driver: 'custom-driver' }
    },
  };

  generator = new ComposeMermaidGenerator(sampleCompose);
  diagram = generator.generateMermaidDiagram();

  test('should include network subgraph with correct driver', () => {
    const networkSubgraphs = generator.networkSubgraphs;
    expect(networkSubgraphs.has("net1")).toBe(true);
    const net1Graph = networkSubgraphs.get("net1");
    expect(net1Graph?.driver).toBe("bridge");
  });

  test('should include network subgraph with custom driver', () => {
    const networkSubgraphs = generator.networkSubgraphs;
    expect(networkSubgraphs.has("net2")).toBe(true);
    const net2Graph = networkSubgraphs.get("net2");
    expect(net2Graph?.driver).toBe("custom-driver");
  });

  test('class should be included', () => {
    expect(diagram).toContain(`class network-net1 network;`);
  });

  test('should have name', () => {
    expect(diagram).toContain(`network-net1[<b style=\"font-size:18px\">network-net1</b>]`);
  });

  test('should have driver', () => {
    expect(diagram).toContain(` subgraph bridge [bridge networks]`);
  });
});

