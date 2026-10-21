import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Inyecta un catálogo de traducciones en un candidato de Archify.
 *
 * Uso: node scripts/archify/inject-locale.mjs <candidato.json> [catalogo.json]
 *
 * El catálogo por defecto es el de español que trae la skill; sin él, el visor
 * muestra su interfaz en inglés.
 */
const [candidatePath, catalogArg] = process.argv.slice(2);

if (!candidatePath) {
  console.error('Uso: node scripts/archify/inject-locale.mjs <candidato.json> [catalogo.json]');
  process.exit(1);
}

const skillHome = process.env.ARCHIFY_HOME ?? path.join(os.homedir(), '.agents', 'skills', 'archify');
const catalogPath = catalogArg ?? path.join(skillHome, 'examples', 'locales', 'es.json');

if (!fs.existsSync(catalogPath)) {
  console.error(`No se encontró el catálogo de traducciones: ${catalogPath}`);
  process.exit(1);
}

const candidate = JSON.parse(fs.readFileSync(candidatePath, 'utf8'));
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

candidate.meta ??= {};
candidate.meta.translations = { ...catalog };
fs.writeFileSync(candidatePath, `${JSON.stringify(candidate, null, 2)}\n`);

console.log(`Traducciones inyectadas (${Object.keys(catalog).length}) en ${candidatePath}`);
