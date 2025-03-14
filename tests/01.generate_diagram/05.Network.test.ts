import { TWO_SPACES } from '../../constants';
import { ComposeMermaidGenerator } from '../../lib/mermaid/index';

describe('NetworkAvailableProperties', () => {
  let sampleCompose: any;
  let generator: ComposeMermaidGenerator;
  let diagram: string;

  sampleCompose = {
    name: "network test",
    networks: { net1: { name: 'test network', driver: 'bridge' } },
  };

  generator = new ComposeMermaidGenerator(sampleCompose);
  diagram = generator.generateMermaidDiagram();

  test('class should be included', () => {
    expect(diagram).toContain(`network-net1[\"network-net1\"]`);
  });

  test('should have name', () => {
    expect(diagram).toContain("network-net1[\"network-net1\"]");
  });

  test('should have driver', () => {
    expect(diagram).toContain(`subgraph bridge [\"bridge Networks\"]`);
  });
});

