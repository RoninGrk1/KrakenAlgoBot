import { register } from "node:module";
import { pathToFileURL } from "node:url";

register(new URL("./ts-alias.mjs", import.meta.url), pathToFileURL("./"));
