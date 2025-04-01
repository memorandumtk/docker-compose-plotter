"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../lib/mermaid/index");
describe('SameNames', () => {
    let sampleCompose;
    let generator;
    let diagram;
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
    };
    generator = new index_1.ComposeMermaidGenerator(sampleCompose);
    diagram = generator.generateMermaidDiagram();
    test('should include service definitions', () => {
        expect(diagram).toContain("class frontend");
    });
    test('should include network definitions', () => {
        expect(diagram).toContain("class network-frontend");
        expect(diagram).toContain("+driver: custom-driver-1");
        expect(diagram).toContain("+name: custom_frontend");
    });
    test('should include relationship for networks', () => {
        // The relationship string depends on your ARROWS_TO_RIGHT.solidlink implementation.
        expect(diagram).toContain("frontend");
        expect(diagram).toContain("network-frontend");
    });
    test('should include relationship for volumes', () => {
        // The relationship string depends on your ARROWS_TO_RIGHT.solidlink implementation.
        expect(diagram).toContain("frontend");
        expect(diagram).toContain("volume-frontend");
    });
});
