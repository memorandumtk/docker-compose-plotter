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
    expect(diagram).toContain("class serviceA");
  });

  test('should have name', () => {
    expect(diagram).toContain("+name: service a");
  });

  test('should have ports', () => {
    expect(diagram).toContain("+ports: 80:80");
  });

  test('should have depends_on', () => {
    expect(diagram).toContain("+depends_on: serviceB");
  });

  test('should have networks', () => {
    expect(diagram).toContain("+networks: net1");
  });

  test('should have volumes', () => {
    expect(diagram).toContain("+volumes: vol1");
  });
});

