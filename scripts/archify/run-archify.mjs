import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Ejecuta la CLI de Archify con un Chrome disponible, para que la puerta de
 * navegador (browser-check) no se quede en "skipped".
 *
 * Uso: node scripts/archify/run-archify.mjs <comando> [argumentos...]
 *
 * Ejemplo:
 *   node scripts/archify/run-archify.mjs finalize architecture candidato.json salida.html \
 *     --quality showcase --repo-root . --json
 */
const skillHome = process.env.ARCHIFY_HOME ?? path.join(os.homedir(), '.agents', 'skills', 'archify');
const cli = path.join(skillHome, 'bin', 'archify.mjs');

if (!fs.existsSync(cli)) {
  console.error(`No se encontró la CLI de Archify: ${cli}`);
  console.error('Define ARCHIFY_HOME con la ruta de la skill.');
  process.exit(1);
}

function findChrome() {
  if (process.env.ARCHIFY_CHROME && fs.existsSync(process.env.ARCHIFY_CHROME)) {
    return process.env.ARCHIFY_CHROME;
  }
  const roots = [
    process.env.PROGRAMFILES,
    process.env['PROGRAMFILES(X86)'],
    process.env.LOCALAPPDATA,
  ].filter(Boolean);
  const candidates = roots.flatMap((root) => [
    path.join(root, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(root, 'Chromium', 'Application', 'chrome.exe'),
  ]);
  const browserCache = path.join(os.homedir(), '.agent-browser', 'browsers');
  if (fs.existsSync(browserCache)) {
    for (const entry of fs.readdirSync(browserCache)) {
      candidates.push(path.join(browserCache, entry, 'chrome.exe'));
    }
  }
  return candidates.find((candidate) => fs.existsSync(candidate));
}

const chrome = findChrome();
const env = { ...process.env };
if (chrome) env.ARCHIFY_CHROME = chrome;

const result = spawnSync(process.execPath, [cli, ...process.argv.slice(2)], { stdio: 'inherit', env });
if (!chrome) {
  console.error('Aviso: no se encontró Chrome; la puerta de navegador quedará en "skipped".');
}
process.exit(result.status ?? 1);
