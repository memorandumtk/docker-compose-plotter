import { ComposeMermaidGenerator } from '../../lib/mermaid/index';

describe('VolumeRelationship', () => {
  let sampleCompose: any;
  let generator: ComposeMermaidGenerator;
  let diagram: string;

  sampleCompose = {
    name: "Volume relationship",
    services: {
      frontend: {
        build: { context: 'frontend', target: 'development' },
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
    volumes: { 'backend-cache': {} }
  }

  generator = new ComposeMermaidGenerator(sampleCompose);
  diagram = generator.generateMermaidDiagram();

  test('should include service definitions', () => {
    expect(diagram).toContain("class frontend");
    expect(diagram).toContain("class backend");
  });

  test('should include relationship for volume defined in volume section', () => {
    expect(diagram).toContain("backend");
    expect(diagram).toContain("backend-cache");
  });

  test('should include relationship for volume define in its container', () => {
    expect(diagram).toContain("frontend");
    expect(diagram).toContain("+volumes: ./frontend/src:/code/src:ro");
  });
});
