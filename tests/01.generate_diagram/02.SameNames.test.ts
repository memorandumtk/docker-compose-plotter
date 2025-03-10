import { ComposeMermaidGenerator } from '../../lib/mermaid/index';

describe('SameNames', () => {
  let sampleCompose: any;
  let generator: ComposeMermaidGenerator;
  let diagram: string;

  sampleCompose = {
    name: 'Having same names of network and volume with a container',
    services: {
      frontend: {
        build: { context: 'frontend', target: 'development' },
        networks: ['client-side'],
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
  }

  generator = new ComposeMermaidGenerator(sampleCompose);
  diagram = generator.generateMermaidDiagram();

  test('should include service definitions', () => {
    expect(diagram).toContain("frontend[frontend");
  });

  test('should include network definitions', () => {
    expect(diagram).toContain("subgraph network-frontend [network-frontend<br>name: custom_frontend<br>driver: custom-driver-1]");
  });

  test('should include relationship for volumes', () => {
    expect(diagram).toContain("volume-frontend");
  });
});
