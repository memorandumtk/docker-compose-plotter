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
    expect(diagram).toContain("title: Header");
  });

  test('should have graph LR decralation', () => {
    expect(diagram).toContain("graph LR")
  });
});

