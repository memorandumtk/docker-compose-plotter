import { DescriptionOfColors } from '../../constants';
import { ComposeMermaidGenerator } from '../../lib/mermaid/index';

describe('Header', () => {
  let sampleCompose: any;
  let generator: ComposeMermaidGenerator;
  let diagram: string;

  sampleCompose = {
    name: "Header",
  };

  generator = new ComposeMermaidGenerator(sampleCompose);
  diagram = generator.generateMermaidDiagram();
  test('should have name', () => {
    expect(diagram).toContain("Header");
  });

  test('should have color description in title', () => {
    expect(diagram).toContain(DescriptionOfColors);
  });

});

