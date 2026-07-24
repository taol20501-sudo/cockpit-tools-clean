#!/usr/bin/env node

const fs = require("node:fs");
const { isDeepStrictEqual } = require("node:util");

const MISSING = Symbol("missing");

const PROTECTED_PATHS = new Set([
  "productName",
  "identifier",
  "app.windows.0.title",
  "app.windows.1.title",
  "bundle.macOS.bundleName",
  "plugins.updater.pubkey",
  "plugins.updater.endpoints",
]);

function isMissing(value) {
  return value === MISSING;
}

function isObject(value) {
  return (
    !isMissing(value) &&
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function equal(left, right) {
  if (isMissing(left) || isMissing(right)) {
    return left === right;
  }
  return isDeepStrictEqual(left, right);
}

function displayPath(path) {
  return path.length === 0 ? "<root>" : path.join(".");
}

function mergeValues(base, current, incoming, path = []) {
  const pathName = displayPath(path);

  if (PROTECTED_PATHS.has(pathName)) {
    if (isMissing(current)) {
      throw new Error(`Clean protected field is missing: ${pathName}`);
    }
    return current;
  }

  if (equal(current, incoming)) {
    return current;
  }
  if (equal(current, base)) {
    return incoming;
  }
  if (equal(incoming, base)) {
    return current;
  }

  if (isObject(current) && isObject(incoming)) {
    const baseObject = isObject(base) ? base : {};
    const keys = new Set([
      ...Object.keys(incoming),
      ...Object.keys(current),
      ...Object.keys(baseObject),
    ]);
    const merged = {};

    for (const key of keys) {
      const value = mergeValues(
        Object.hasOwn(baseObject, key) ? baseObject[key] : MISSING,
        Object.hasOwn(current, key) ? current[key] : MISSING,
        Object.hasOwn(incoming, key) ? incoming[key] : MISSING,
        [...path, key],
      );
      if (!isMissing(value)) {
        merged[key] = value;
      }
    }
    return merged;
  }

  if (Array.isArray(current) && Array.isArray(incoming)) {
    const baseArray = Array.isArray(base) ? base : [];
    const length = Math.max(baseArray.length, current.length, incoming.length);
    const merged = [];

    for (let index = 0; index < length; index += 1) {
      const value = mergeValues(
        index < baseArray.length ? baseArray[index] : MISSING,
        index < current.length ? current[index] : MISSING,
        index < incoming.length ? incoming[index] : MISSING,
        [...path, String(index)],
      );
      if (!isMissing(value)) {
        merged.push(value);
      }
    }
    return merged;
  }

  throw new Error(`Unresolved Tauri configuration conflict at ${pathName}`);
}

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function main() {
  const [basePath, currentPath, incomingPath] = process.argv.slice(2);
  if (!basePath || !currentPath || !incomingPath) {
    console.error(
      "Usage: merge-clean-tauri-config.cjs <base> <current> <incoming>",
    );
    process.exit(2);
  }

  try {
    const merged = mergeValues(
      readJson(basePath),
      readJson(currentPath),
      readJson(incomingPath),
    );
    fs.writeFileSync(currentPath, `${JSON.stringify(merged, null, 2)}\n`);
  } catch (error) {
    console.error(`[merge-clean-tauri-config] ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { MISSING, PROTECTED_PATHS, mergeValues };
