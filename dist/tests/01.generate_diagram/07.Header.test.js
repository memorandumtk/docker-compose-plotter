"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../lib/mermaid/index");
describe("Header", () => {
    const sampleCompose = {
        name: "Header",
    };
    const generator = new index_1.ComposeMermaidGenerator(sampleCompose);
    const diagram = generator.generateMermaidDiagram();
    test("should include network subgraph with correct driver", () => {
        const header = generator.headerList;
        expect(header).toContain("---");
        expect(header).toContain("title: Header");
        expect(header).toContain("%%{init: {'theme':'forest'}}%%");
        expect(header).toContain("graph LR");
    });
    test("should have name", () => {
        expect(diagram).toContain("title: Header");
    });
    test("should have graph LR decralation", () => {
        expect(diagram).toContain("graph LR");
    });
});
