import { TWO_SPACES } from '../../constants';
import { ComposeMermaidGenerator } from '../../lib/mermaid/index';

describe('VolumeAvailableProperties', () => {
  let sampleCompose: any;
  let generator: ComposeMermaidGenerator;
  let diagram: string;

  sampleCompose = {
    name: "volume test",
    volumes: { net1: { name: 'test volume', external: false } },
  };

  generator = new ComposeMermaidGenerator(sampleCompose);
  diagram = generator.generateMermaidDiagram();

  test('should include volume node definitions', () => {
    const volumeNodes = generator.volumeNodes;
    expect(volumeNodes.length).toBe(1);
    expect(volumeNodes[0]).toContain("net1");
  });

  test('class should be included', () => {
    expect(diagram).toContain(`class volume-net1 volume`);
  });

  test('should have ', () => {
    expect(diagram).toContain("<br>external: false");
  });

  test('should have name', () => {
    expect(diagram).toContain("<br>name: test volume");
  });

});

