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
  const serviceNodes = generator.serviceNodesMap;
  const serviceA = serviceNodes.get("serviceA")

  test('should include service definitions', () => {
    expect(serviceNodes.has("serviceA")).toBe(true);
  });

  test('should have header', () => {
    expect(serviceA?.labelParts.get("header")).toBe(`<b style="font-size:20px">serviceA</b>`)
  });

  test('should have name', () => {
    expect(serviceA?.labelParts.get("name")).toBe(`<b style=\"font-size:16px\">name: </b>service a`)
  });

  test('should have image', () => {
    expect(serviceA?.labelParts.get("image")).toBe(`<b style="font-size:16px">image: </b>nginx:latest`)
  });

  test('should have ports', () => {
    expect(serviceA?.labelParts.get("ports")).toBe(`<b style=\"font-size:16px\">ports: </b>80:80`)
  });

  test('should have volumes at the end', () => {
    expect(serviceA?.labelParts.get("volumes")).toBe(`<b style=\"font-size:16px\">volumes: </b>vol1`)
  });
});

