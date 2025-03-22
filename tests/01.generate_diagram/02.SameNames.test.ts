import { ComposeMermaidGenerator } from '../../lib/mermaid/index';

describe('SameNames', () => {
  let sampleCompose: any;
  let generator: ComposeMermaidGenerator;
  let diagram: string;


  beforeAll(() => {
    sampleCompose = {
      name: 'Having same names of network and volume with a container',
      services: {
        frontend: {
          build: { context: 'frontend', target: 'development' },
          networks: ['frontend'],
          ports: ['3000:3000'],
          volumes: ['./frontend/src:/code/src:ro']
        },
      },
      networks: {
        frontend: { name: 'custom_frontend', driver: 'custom-driver-1' },
      },
      volumes: {
        frontend: {
          external: false,
          driver: "local"
        }
      }
    };

    generator = new ComposeMermaidGenerator(sampleCompose);
    diagram = generator.generateMermaidDiagram();
  });

  test('should include service definitions', () => {
    const serviceNodes = generator.serviceNodesMap;
    expect(serviceNodes.has("frontend")).toBe(true);
    expect(serviceNodes.get("frontend")).toContain("frontend(frontend");
  });

  test('should include network subgraph with correct driver', () => {
    const networkSubgraphs = generator.networkSubgraphs;
    expect(networkSubgraphs.has("frontend")).toBe(true);
    const frontendGraph = networkSubgraphs.get("frontend");
    expect(frontendGraph?.driver).toBe("custom-driver-1");
    expect(frontendGraph?.services).toContain("frontend");
  });

  test('should include volume node definitions', () => {
    const volumeNode = generator.volumeNodesMap.get("frontend");
    expect(volumeNode).toBe(true);
    expect(volumeNode?.labelParts).toContain("volume-frontend");
  });

  // after checking the value of Maps and Arrays, will also check the string generated at the end.
  test('should include service definitions', () => {
    expect(diagram).toContain("frontend(frontend");
  });

  test('should include network definitions', () => {
    expect(diagram).toContain(`sssss`);
  });

  test('should include relationship for volumes', () => {
    expect(diagram).toContain("volume-frontend");
  });

  test('diagram snapshot', () => {
    expect(diagram).toMatchSnapshot();
  });

});

