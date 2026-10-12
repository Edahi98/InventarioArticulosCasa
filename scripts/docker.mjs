import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTAINER_NAME_FILTER = "^inventario-";
const IMAGE_REFERENCES = ["inventarioarticuloscasa-*", "*/inventario-*"];

const args = process.argv.slice(2);
const command = args.find((arg) => !arg.startsWith("--")) ?? "";
const withVolumes = args.includes("--volumes");
const dryRun = args.includes("--dry-run");

/**
 * Ejecuta un comando de Docker en la raíz del repositorio mostrando su salida.
 *
 * @param dockerArgs - Argumentos de `docker`.
 * @returns El código de salida (1 si Docker no pudo ejecutarse).
 */
function run(dockerArgs) {
  const result = spawnSync("docker", dockerArgs, { cwd: ROOT, stdio: "inherit" });
  return result.status ?? 1;
}

/**
 * Ejecuta un comando de Docker y devuelve su salida como líneas no vacías.
 *
 * @param dockerArgs - Argumentos de `docker`.
 * @returns Las líneas de la salida estándar.
 */
function lines(dockerArgs) {
  const result = spawnSync("docker", dockerArgs, { cwd: ROOT, encoding: "utf-8" });
  return (result.stdout ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

/**
 * Lista los contenedores del sistema (nombre que empieza por `inventario-`), incluso detenidos.
 *
 * @returns Pares `id nombre`.
 */
function systemContainers() {
  return lines(["ps", "-a", "--filter", `name=${CONTAINER_NAME_FILTER}`, "--format", "{{.ID}} {{.Names}}"]);
}

/**
 * Lista las imágenes del sistema: las construidas por el compose y las publicadas como `<usuario>/inventario-*`.
 *
 * @returns Pares `id repositorio:etiqueta`, sin repetir.
 */
function systemImages() {
  const found = IMAGE_REFERENCES.flatMap((reference) =>
    lines(["images", "--filter", `reference=${reference}`, "--format", "{{.ID}} {{.Repository}}:{{.Tag}}"]),
  );
  return [...new Set(found)];
}

/**
 * Elimina los contenedores y las imágenes del sistema, incluidos los que ya no pertenecen al compose
 * (por ejemplo `inventario-bot` o `inventario-ftp`). Con `--volumes` borra además los volúmenes
 * (incluida la base de datos local); con `--dry-run` solo muestra lo que borraría.
 *
 * @returns El código de salida.
 */
function clean() {
  const down = ["compose", "down", "--rmi", "all", "--remove-orphans", ...(withVolumes ? ["--volumes"] : [])];
  if (dryRun) {
    console.log("Se ejecutaría: docker " + down.join(" "));
  } else if (run(down) !== 0) {
    return 1;
  }

  const containers = systemContainers();
  const images = systemImages();
  console.log(`Contenedores del sistema restantes: ${containers.length ? containers.map((c) => c.split(" ")[1]).join(", ") : "ninguno"}`);
  console.log(`Imágenes del sistema restantes: ${images.length ? images.map((i) => i.split(" ")[1]).join(", ") : "ninguna"}`);
  if (dryRun) {
    return 0;
  }

  const containerStatus = containers.length ? run(["rm", "-f", ...containers.map((c) => c.split(" ")[0])]) : 0;
  const imageStatus = images.length ? run(["rmi", "-f", ...new Set(images.map((i) => i.split(" ")[0]))]) : 0;
  return containerStatus || imageStatus;
}

const COMMANDS = {
  build: () => run(["compose", "build"]),
  up: () => run(["compose", "up", "-d", "--build"]),
  down: () => run(["compose", "down", "--remove-orphans"]),
  clean,
  rebuild: () => clean() || COMMANDS.up(),
};

if (!(command in COMMANDS)) {
  console.error(`Uso: node scripts/docker.mjs <${Object.keys(COMMANDS).join("|")}> [--volumes] [--dry-run]`);
  process.exit(1);
}

process.exit(COMMANDS[command]());
