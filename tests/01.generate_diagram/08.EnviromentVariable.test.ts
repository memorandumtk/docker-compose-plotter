import { ComposeMermaidGenerator } from "../../lib/mermaid/index";
import { ComposeFileData } from "../../types/yaml";

describe("ContainerAvailableProperties", () => {
  const sampleCompose: ComposeFileData = {
    name: "ContainerAvailableProperties",
    services: {
      serviceA: {
        name: "service a",
        image: "nginx:latest",
        ports: ["${RECIEVE_PORT: OPEN_PORT}"],
        depends_on: ["serviceB"],
        networks: ["net1"],
        volumes: ["${TARGET_VOLUME}"],
      },
    },
  };

  const generator = new ComposeMermaidGenerator(sampleCompose);
  const serviceNodes = generator.serviceNodesMap;
  const serviceA = serviceNodes.get("serviceA");

  test("should include service definitions", () => {
    expect(serviceNodes.has("serviceA")).toBe(true);
  });

  test("should have header", () => {
    expect(serviceA?.labelParts.get("header")).toBe(
      `<b style="font-size:20px">serviceA</b>`,
    );
  });

  test("should have name", () => {
    expect(serviceA?.labelParts.get("name")).toBe(
      // eslint-disable-next-line no-useless-escape
      `<b style=\"font-size:16px\">name: </b>service a`,
    );
  });

  test("should have image", () => {
    expect(serviceA?.labelParts.get("image")).toBe(
      `<b style="font-size:16px">image: </b>nginx:latest`,
    );
  });

  test("should have ports", () => {
    expect(serviceA?.labelParts.get("ports")).toBe(
      // eslint-disable-next-line no-useless-escape
      `<b style=\"font-size:16px\">ports: </b>#36;#123;RECIEVE_PORT: OPEN_PORT#125;`,
    );
  });

  test("should have volumes at the end", () => {
    expect(serviceA?.labelParts.get("volumes")).toBe(
      // eslint-disable-next-line no-useless-escape
      `<b style=\"font-size:16px\">volumes: </b>#36;#123;TARGET_VOLUME#125;`,
    );
  });
});
