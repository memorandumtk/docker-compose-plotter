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


  test('should include service definition for frontend', () => {
    const serviceNodes = generator.serviceNodesMap;
    expect(serviceNodes.has("frontend")).toBe(true);
    const fronend = serviceNodes.get("frontend")
    expect(fronend?.labelParts.get("volumes")).toBe(`<b style="font-size:16px">volumes: </b>./frontend/src: /code/src`);
  });

  test('should include service definition for backend', () => {
    const serviceNodes = generator.serviceNodesMap;
    expect(serviceNodes.has("backend")).toBe(true);
    const fronend = serviceNodes.get("backend")
    expect(fronend?.labelParts.get("volumes")).toBe(`<b style=\"font-size:16px\">volumes: </b>./backend/src: /code/src: backend-cache: /code/target`);
  });

  test('should include volume node definitions', () => {
    const volumeNodes = generator.volumeNodesMap;
    expect(volumeNodes.has("backend-cache")).toBe(true);
    const volumeBackendCache = volumeNodes.get("backend-cache")
    expect(volumeBackendCache?.id).toBe("volume-backend-cache");
  });

  test('should include relationship for volume defined in volume section of service', () => {
    const relation = generator.relationshipList
    expect(relation).toContain(`  backend -. "volume" .-> volume-backend-cache`)
  });
});
