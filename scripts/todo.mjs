import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SERVICES = [
  { name: "backend", cwd: "backend", command: "npm run dev" },
  { name: "frontend", cwd: "frontend", command: "npm run dev" },
  { name: "agente", cwd: "agente", command: "npm run telegram" },
];

const children = [];

/**
 * Antepone el nombre del servicio a cada línea de su salida.
 *
 * @param name - Nombre del servicio.
 * @param stream - Salida del proceso.
 * @param target - Salida de este proceso donde se reenvía.
 */
function forward(name, stream, target) {
  let pending = "";
  stream.on("data", (chunk) => {
    const parts = (pending + chunk.toString()).split(/\r?\n/);
    pending = parts.pop() ?? "";
    parts.forEach((line) => target.write(`[${name}] ${line}\n`));
  });
}

/**
 * Detiene todos los servicios (y sus procesos hijos) y termina este proceso.
 *
 * @param code - Código de salida.
 */
function stopAll(code) {
  children.forEach((child) => {
    if (child.pid === undefined) return;
    spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });
  });
  process.exit(code);
}

/**
 * Levanta un servicio con su directorio y comando, y apaga todo si termina.
 *
 * @param service - Nombre, directorio (relativo a la raíz) y comando del servicio.
 */
function start(service) {
  const child = spawn(service.command, {
    cwd: path.join(ROOT, service.cwd),
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  forward(service.name, child.stdout, process.stdout);
  forward(service.name, child.stderr, process.stderr);
  child.on("exit", (code) => {
    console.log(`[${service.name}] terminó con código ${code ?? 1}`);
    stopAll(code ?? 1);
  });
  children.push(child);
}

process.on("SIGINT", () => stopAll(0));
process.on("SIGTERM", () => stopAll(0));
SERVICES.forEach(start);
