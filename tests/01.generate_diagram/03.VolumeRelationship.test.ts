import { ComposeMermaidGenerator } from '../../lib/mermaid/index';

describe('VolumeRelationship', () => {
  let sampleCompose: any;
  let generator: ComposeMermaidGenerator;
  let diagram: string;

  sampleCompose = {
    name: "Volume relationship",
    services: {
      frontend: {
        networks: ['client-side'],
        ports: ['3000:3000'],
        volumes: ['./frontend/src:/code/src:ro']
      },
      backend: {
        build: { context: 'backend', target: 'development' },
        networks: ['client-side', 'server-side'],
        volumes: ['./backend/src:/code/src', 'backend-cache:/code/target'],
      },
    },
    networks: { "client-side": null, "server-side": null },
    volumes: { 'backend-cache': {} }
  }

  generator = new ComposeMermaidGenerator(sampleCompose);
  diagram = generator.generateMermaidDiagram();


  test('should include service definitions', () => {
    const serviceNodes = generator.serviceNodesMap;
    expect(serviceNodes.has("frontend")).toBe(true);
    expect(serviceNodes.get("frontend")).toContain("  frontend(frontend<br>ports: 3000:3000<br>volumes: ./frontend/src:/code/src:ro)\n  class frontend container;");
    expect(serviceNodes.has("backend")).toBe(true);
    expect(serviceNodes.get("backend")).toContain("  backend(backend<br>volumes: ./backend/src:/code/src)\n  class backend container");
  });

  test('should include volume node definitions', () => {
    const volumeNodes = generator.volumeNodes;
    expect(volumeNodes.length).toBe(1);
    expect(volumeNodes[0]).toContain("backend-cache");
  });


  test('should include relationship for volume defined in volume section', () => {
    expect(diagram).toContain("volume-backend-cache");
    expect(diagram).toContain(`backend -- "volume" --> volume-backend-cache`);
  });

  test('should include relationship for volume define in its container', () => {
    // TODO: Should it check the array within the process to produce the mermaid string?
    expect(diagram).toContain(`frontend(frontend<br>ports: 3000:3000<br>volumes: ./frontend/src:/code/src:ro)`);
  });
});
