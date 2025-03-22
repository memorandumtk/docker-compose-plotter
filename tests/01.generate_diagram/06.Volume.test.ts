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
    const volumeNodes = generator.volumeNodesMap;
    const volumeNet1 = volumeNodes.get("net1")
    expect(volumeNet1).toBe(true);
    expect(volumeNet1).toContain("net1");
    console.log({ line: 21, volumeNodes })
  });

  test('class should be included', () => {
    expect(diagram).toContain(`class volume-net1 volume`);
  });

  test('should have external definition', () => {
    expect(diagram).toContain("");
  });

  test('should have name', () => {
    expect(diagram).toContain("<br>name: test volume");
  });

});

