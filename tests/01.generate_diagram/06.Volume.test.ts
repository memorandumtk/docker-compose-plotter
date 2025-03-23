import { ComposeMermaidGenerator } from "../../lib/mermaid/index";
import { ComposeFileData } from "../../types/yaml";

describe("VolumeAvailableProperties", () => {
  const sampleCompose: ComposeFileData = {
    name: "volume test",
    volumes: { vol1: { name: "test volume", external: false } },
  };

  const generator = new ComposeMermaidGenerator(sampleCompose);
  const diagram = generator.generateMermaidDiagram();

  const volumeNodes = generator.volumeNodesMap;
  const volumeVol1 = volumeNodes.get("vol1");

  test("should include volume node definitions", () => {
    expect(volumeNodes.has("vol1")).toBe(true);
    expect(volumeVol1?.id).toBe("volume-vol1");
    expect(volumeVol1?.className).toBe("volume");
    expect(volumeVol1?.labelParts.get("header")).toBe(
      `<b style="font-size:18px">volume-vol1</b>`,
    );
    expect(volumeVol1?.labelParts.get("name")).toBe(
      `<b style="font-size:16px">name: </b>test volume`,
    );
    expect(volumeVol1?.labelParts.get("external")).toBe(
      `<b style="font-size:16px">external: </b>false`,
    );
  });

  test("class should be included in the returned string", () => {
    expect(diagram).toContain(`class volume-vol1 volume`);
  });
});
