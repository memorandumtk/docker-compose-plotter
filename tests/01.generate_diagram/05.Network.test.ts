import { TWO_SPACES } from '../../constants';
import { ComposeMermaidGenerator } from '../../lib/mermaid/index';

describe('Network subgraph that does not have any services', () => {
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

  const networkSubgraphs = generator.networkSubgraphs;
  const net1Graph = networkSubgraphs.get("net1");
  const net2Graph = networkSubgraphs.get("net2");

  test('should include subgraph net 1 with correct driver', () => {
    expect(networkSubgraphs.has("net1")).toBe(true);
    expect(net1Graph?.driver).toBe("bridge");
  });

  test('should include subgraph net 2 with correct driver', () => {
    expect(networkSubgraphs.has("net2")).toBe(true);
    expect(net2Graph?.driver).toBe("custom-driver");
  });

  test('class should be included in the returned string', () => {
    expect(diagram).toContain(`class network-net1 network;`);
    expect(diagram).toContain(`class network-net2 network;`);
  });

  test('should have name in the returned string', () => {
    expect(diagram).toContain(`network-net1[<b style=\"font-size:18px\">network-net1</b><br>name: test network<br>driver: bridge]`);
    expect(diagram).toContain(`network-net2[<b style=\"font-size:18px\">network-net2</b><br>name: test custom network<br>driver: custom-driver]`);
  });

  test('should have driver in the returned string', () => {
    expect(diagram).toContain(`subgraph bridge [networks in bridge]`);
  });
});

