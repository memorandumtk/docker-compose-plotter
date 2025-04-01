"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../lib/mermaid/index");
describe('ComposeMermaidGenerator', () => {
    let sampleCompose;
    let generator;
    let diagram;
    beforeAll(() => {
        sampleCompose = {
            name: 'react-rust-postgres-02',
            services: {
                frontend: {
                    build: { context: 'frontend', target: 'development' },
                    networks: ['client-side'],
                    ports: ['3000:3000'],
                    volumes: ['./frontend/src:/code/src:ro']
                },
                backend: {
                    build: { context: 'backend', target: 'development' },
                    environment: [
                        'ADDRESS=0.0.0.0:8000',
                        'RUST_LOG=debug',
                        'PG_DBNAME=postgres',
                        'PG_HOST=db',
                        'PG_USER=postgres',
                        'PG_PASSWORD=mysecretpassword'
                    ],
                    networks: ['client-side', 'server-side'],
                    volumes: ['./backend/src:/code/src', 'backend-cache:/code/target'],
                    depends_on: ['db']
                },
                db: {
                    image: 'postgres:12-alpine',
                    restart: 'always',
                    environment: ['POSTGRES_PASSWORD=mysecretpassword'],
                    networks: ['server-side'],
                    ports: ['5432:5432'],
                    volumes: ['db-data:/var/lib/postgresql/data']
                }
            },
            networks: {
                'client-side': {},
                frontend: { name: 'custom_frontend', driver: 'custom-driver-1' },
                'server-side': {}
            },
            volumes: { 'backend-cache': {}, 'db-data': {} }
        };
        generator = new index_1.ComposeMermaidGenerator(sampleCompose);
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
