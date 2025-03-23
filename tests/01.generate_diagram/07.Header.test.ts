import { ComposeMermaidGenerator } from "../../lib/mermaid/index";
import { ComposeFileData } from "../../types/yaml";

describe("Header", () => {
  const sampleCompose: ComposeFileData = {
    name: "Header",
  };

  const generator = new ComposeMermaidGenerator(sampleCompose);
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
