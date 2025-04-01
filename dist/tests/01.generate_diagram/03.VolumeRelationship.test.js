import { ComposeMermaidGenerator } from "../../lib/mermaid/index";
describe("VolumeRelationship", () => {
  const sampleCompose = {
    name: "Volume relationship",
    services: {
      frontend: {
        networks: ["client-side"],
        ports: ["3000:3000"],
        volumes: ["./frontend/src:/code/src:ro"],
      },
      backend: {
        build: { context: "backend", target: "development" },
        networks: ["client-side", "server-side"],
        volumes: [
          "./backend/src:/code/src",
          "backend-cache:/code/target",
          "/code/data:backend-storage",
        ],
      },
    },
    networks: { "client-side": null, "server-side": null },
    volumes: { "backend-cache": {}, "backend-storage": {} },
  };
  const generator = new ComposeMermaidGenerator(sampleCompose);
  test("should include service definition for frontend", () => {
    const serviceNodes = generator.serviceNodesMap;
    expect(serviceNodes.has("frontend")).toBe(true);
    const fronend = serviceNodes.get("frontend");
    expect(fronend?.labelParts.get("volumes")).toBe(
      `<b style="font-size:16px">volumes: </b>./frontend/src: /code/src`,
    );
  });
  test("should include service definition for backend", () => {
    const serviceNodes = generator.serviceNodesMap;
    expect(serviceNodes.has("backend")).toBe(true);
    const fronend = serviceNodes.get("backend");
    expect(fronend?.labelParts.get("volumes")).toBe(
      // eslint-disable-next-line no-useless-escape
      `<b style=\"font-size:16px\">volumes: </b>./backend/src: /code/src, backend-cache: /code/target, /code/data: backend-storage`,
    );
  });
  test("should include volume node definitions", () => {
    const volumeNodes = generator.volumeNodesMap;
    expect(volumeNodes.has("backend-cache")).toBe(true);
    const volumeBackendCache = volumeNodes.get("backend-cache");
    expect(volumeBackendCache?.id).toBe("volume-backend-cache");
    expect(volumeNodes.has("backend-storage")).toBe(true);
    const volumeBackendStorage = volumeNodes.get("backend-storage");
    expect(volumeBackendStorage?.id).toBe("volume-backend-storage");
  });
  test("should include relationship for volume defined in volume section of service", () => {
    const relation = generator.relationshipList;
    expect(relation).toContain(
      `  backend -. "volume" .-> volume-backend-cache`,
    );
    expect(relation).toContain(
      `  backend -. "volume" .-> volume-backend-storage`,
    );
  });
});
