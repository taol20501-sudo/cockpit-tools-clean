const assert = require("node:assert/strict");
const test = require("node:test");

const { mergeValues } = require("./merge-clean-tauri-config.cjs");

function config(overrides = {}) {
  return {
    productName: "Cockpit Tools",
    version: "1.3.13",
    identifier: "com.jlcodes.cockpit-tools",
    app: {
      windows: [
        { label: "main", title: "Cockpit Tools", width: 1280 },
        { label: "floating-card", title: "Cockpit Tools", width: 250 },
      ],
    },
    bundle: { macOS: { bundleName: "Cockpit Tools" } },
    plugins: {
      updater: {
        pubkey: "upstream-key",
        endpoints: ["https://example.test/upstream"],
      },
    },
    ...overrides,
  };
}

test("accepts upstream changes while preserving Clean identity and updater", () => {
  const base = config();
  const current = config({
    productName: "Cockpit Tools Clean",
    identifier: "com.taol20501.cockpit-tools-clean",
  });
  current.app.windows[0].title = "Cockpit Tools Clean";
  current.app.windows[1].title = "Cockpit Tools Clean";
  current.bundle.macOS.bundleName = "Cockpit Tools Clean";
  current.plugins.updater.pubkey = "clean-key";
  current.plugins.updater.endpoints = ["https://example.test/clean"];

  const incoming = config({ version: "1.3.14", newUpstreamOption: true });
  incoming.app.windows[0].width = 1440;

  const merged = mergeValues(base, current, incoming);

  assert.equal(merged.version, "1.3.14");
  assert.equal(merged.newUpstreamOption, true);
  assert.equal(merged.app.windows[0].width, 1440);
  assert.equal(merged.productName, "Cockpit Tools Clean");
  assert.equal(merged.identifier, "com.taol20501.cockpit-tools-clean");
  assert.equal(merged.app.windows[0].title, "Cockpit Tools Clean");
  assert.equal(merged.app.windows[1].title, "Cockpit Tools Clean");
  assert.equal(merged.bundle.macOS.bundleName, "Cockpit Tools Clean");
  assert.equal(merged.plugins.updater.pubkey, "clean-key");
  assert.deepEqual(merged.plugins.updater.endpoints, [
    "https://example.test/clean",
  ]);
});

test("stops on unrelated overlapping changes", () => {
  const base = config({ customValue: "base" });
  const current = config({ customValue: "clean-change" });
  const incoming = config({ customValue: "upstream-change" });

  assert.throws(
    () => mergeValues(base, current, incoming),
    /Unresolved Tauri configuration conflict at customValue/,
  );
});
