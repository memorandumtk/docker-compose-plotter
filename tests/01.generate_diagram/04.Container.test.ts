import { ComposeMermaidGenerator } from '../../lib/mermaid/index';

describe('ContainerAvailableProperties', () => {
  let sampleCompose: any;
  let generator: ComposeMermaidGenerator;
  let diagram: string;

  sampleCompose = {
    name: "ContainerAvailableProperties",
    services: {
      serviceA: {
        name: "service a",
        image: "nginx:latest",
        ports: ["80:80"],
        depends_on: ["serviceB"],
        networks: ["net1"],
        volumes: ["vol1"]
      },
    },
  };

  generator = new ComposeMermaidGenerator(sampleCompose);
  diagram = generator.generateMermaidDiagram();
  test('should include service definitions', () => {
    expect(diagram).toContain("serviceA(");
  });

  test('should have name', () => {
    expect(diagram).toContain("<br>name: service a<br>");
  });

  test('should have ports', () => {
    expect(diagram).toContain("<br>ports: 80:80<br>");
  });

  test('should have depends_on', () => {
    expect(diagram).toContain("<br>depends_on: serviceB<br>");
  });

  test('should have volumes at the end', () => {
    expect(diagram).toContain("<br>volumes: vol1)");
  });
});

