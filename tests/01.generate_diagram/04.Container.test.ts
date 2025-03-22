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
    const serviceNodes = generator.serviceNodesMap;
    expect(serviceNodes.has("serviceA")).toBe(true);
    expect(serviceNodes.get("serviceA")).toContain("  serviceA(<b style=\"font-size:20px\">serviceA</b><br><b style=\"font-size:16px\">name: </b>service a<br><b style=\"font-size:16px\">image: </b>nginx:latest<br><b style=\"font-size:16px\">ports: </b>80:80<br><b style=\"font-size:16px\">volumes: </b>vol1)\n  class serviceA container;");
  });

  test('should include service definitions', () => {
    expect(diagram).toContain("serviceA(");
  });

  test('should have name', () => {
    expect(diagram).toContain("<b style=\"font-size:16px\">name: </b>service a");
  });

  test('should have ports', () => {
    expect(diagram).toContain("<b style=\"font-size:16px\">ports: </b>80:80");
  });

  test('should have depends_on', () => {
    expect(diagram).toContain("serviceA -- \"depends on\" --> serviceB");
  });

  test('should have volumes at the end', () => {
    expect(diagram).toContain("<b style=\"font-size:16px\">volumes: </b>vol1");
  });
});

