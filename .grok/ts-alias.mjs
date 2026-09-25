import { pathToFileURL } from "node:url";
import { existsSync } from "node:fs";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const SHARED = `${ROOT}/packages/shared/src`;
const ENGINE = `${ROOT}/packages/engine/src`;
const EXEC = `${ROOT}/packages/execution/src`;

function mapPkg(name, root, specifier) {
  if (specifier === name) return `${root}/index.ts`;
  if (specifier.startsWith(`${name}/`)) {
    return `${root}/${specifier.slice(name.length + 1).replace(/\.js$/, ".ts")}`;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  const mapped =
    mapPkg("@kab/shared", SHARED, specifier) ||
    mapPkg("@kab/engine", ENGINE, specifier) ||
    mapPkg("@kab/execution", EXEC, specifier);
  if (mapped && existsSync(mapped)) {
    return { url: pathToFileURL(mapped).href, shortCircuit: true };
  }
  if (specifier.endsWith(".js") && context.parentURL?.startsWith("file://")) {
    const url = new URL(specifier, context.parentURL);
    const ts = url.pathname.replace(/\.js$/, ".ts");
    if (existsSync(ts)) {
      url.pathname = ts;
      return { url: url.href, shortCircuit: true };
    }
  }
  return nextResolve(specifier, context);
}
