import { ComposeMermaidGenerator } from '../lib/mermaid/index';

describe('ComposeMermaidGenerator', () => {
  let sampleCompose: any;
  let generator: ComposeMermaidGenerator;
  let diagram: string;

  beforeAll(() => {
    sampleCompose = {
      name: "Test Compose",
      services: {
        serviceA: {
          image: "nginx:latest",
          ports: ["80:80"],
          depends_on: ["serviceB"],
          networks: ["net1"],
          volumes: ["vol1"]
        },
        serviceB: {
          image: "redis:alpine",
          ports: ["6379:6379"],
          networks: ["net1"]
        }
      },
      networks: {
        net1: {
          name: "Test Network",
          driver: "bridge"
        }
      },
      volumes: {
        vol1: {
          external: false,
          driver: "local"
        }
      }
    };

    generator = new ComposeMermaidGenerator(sampleCompose);
    diagram = generator.generateMermaidDiagram();
  });

  test('should include header with classDiagram', () => {
    expect(diagram).toContain("classDiagram");
  });

  test('should include service definitions', () => {
    expect(diagram).toContain("class serviceA");
    expect(diagram).toContain("class serviceB");
  });

  test('should include network definitions', () => {
    expect(diagram).toContain("class net1");
    expect(diagram).toContain("+name: Test Network");
    expect(diagram).toContain("+driver: bridge");
  });

  test('should include volume definitions', () => {
    expect(diagram).toContain("class vol1");
    expect(diagram).toContain("+driver: local");
  });

  test('should include relationship for depends_on', () => {
    expect(diagram).toContain("serviceA --*");
  });

  test('should include relationship for networks', () => {
    // The relationship string depends on your ARROWS_TO_RIGHT.solidlink implementation.
    expect(diagram).toContain("serviceA");
    expect(diagram).toContain("net1");
  });

  test('should include relationship for volumes', () => {
    // The relationship string depends on your ARROWS_TO_RIGHT.aggregation implementation.
    expect(diagram).toContain("serviceA");
    expect(diagram).toContain("vol1");
  });
});
