<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->

# Guardacosas — guide for coding agents

Domestic inventory app "Guardacosas": categories are rooms, articles are figures, and every screen has its own 3D scene with guardian bears. Monorepo with npm workspaces and Turborepo (tasks live in `turbo.json` under the `tasks` key).

| Workspace | Stack | Specific rules in |
|---|---|---|
| `frontend/` | Vue 3 + TypeScript + Vite + Tailwind + Pinia + three.js (+ Rapier) | [Frontend](#frontend) |
| `backend/` | Express + TypeScript + Drizzle ORM + Supabase (PostgreSQL) + Cloudinary | [Backend](#backend) |
| `agente/` | Python 3.11 + uv + LangGraph + OpenRouter + Flask + python-telegram-bot | [Agent](#agent) |

Before touching code, read this guide and the section for the workspace you are changing. These rules come from the project owner and override any tool's defaults.

## Commands

```bash
# Root (npm workspaces + Turborepo)
npm install                       # installs frontend, backend and agent
npm run dev | build | typecheck  # turbo run <task> across all workspaces
npm run docker:up | down | clean | rebuild   # Docker stack (clean removes containers and system images)
npm run user:create -- <user> <password>     # creates a user in the backend
npm run db:push | db:generate | db:migrate   # Drizzle schema -> Supabase (DATABASE_URL from backend/.env)

# Frontend
cd frontend && npm run dev      # Vite
cd frontend && npm run build    # vue-tsc -b && vite build

# Backend
cd backend && npm run dev       # tsx watch
cd backend && npm run db:generate | db:push | db:migrate
cd backend && npm run user:create
cd backend && npm run data:download   # dumps Supabase data to backup/
cd backend && npm run data:upload     # uploads backup/ to Supabase (replaces data)

# Agent (always through uv)
cd agente && uv run python main.py              # CLI
cd agente && uv run python main.py telegram     # Telegram bot
cd agente && uv run python main.py server       # Flask HTTP API
cd agente && uv run python main.py webhook https://<domain>/telegram/webhook
cd agente && uv run python -m src.services.images.asset_builder   # regenerates background PNGs
```

`npm run typecheck` is the cross-cutting check: `vue-tsc --noEmit` (frontend), `tsc --noEmit` (backend) and the Python syntax check.

## Architecture

```
Web user ──HTTP──▶ frontend (Vue) ──REST/JWT──▶ backend (Express) ──Drizzle──▶ Supabase
Telegram user ──▶ agent (LangGraph) ──REST/JWT──▶ backend
                              ──LLM──▶ OpenRouter
Images ──▶ Cloudinary (uploaded from the backend)   ·   Excel ──▶ ExcelJS
```

- **Auth:** RS256 JWT (1 h). The backend signs with `JWT_PRIVATE_KEY` and publishes the public key at `/.well-known/jwks.json`; the token carries `iss` and `aud` (backend and agent). Every token also has a row in the `sessions` table (SHA-256 hash) that `authMiddleware` verifies on each request; `POST /auth/logout` and a password change revoke it.
- **The agent holds no credentials:** the bot is linked from the web UI (`/telegram` generates a one-time code → `POST /auth/telegram/code`; the bot claims it with `/vincular` → `POST /auth/telegram/claim` and receives a 12 h token). Every agent→backend call carries the user's token (`AuthContext`).
- **One engine per layer:** Supabase (PostgreSQL) for data and Cloudinary for images. No adapters and no engine-selection flags (`ENGINE`, `STORAGE`).

### Frontend (`frontend/src/`)

Clean architecture: `domain → usecases → services/infrastructure`.

- `core/domain/` — types and interfaces (article, category, checklist, note, user, telegramLink, inventoryBear); repository interfaces are declared here.
- `core/usecases/` — one use case per file (`ListCategoriesUseCase`), a class with `execute()` and an exported singleton (`listCategoriesUseCase`) that receives the HTTP repository.
- `validators/` — zod schemas for forms and files (same rules as the backend) plus `validateInput`.
- `components/` — per domain (`articles/`, `categories/`, `checklist/`, `home/`, `location/`, `map/`, `notes/`, `reports/`, `users/`) and `ui/` (`FormField`, `PageHeader`, `ModalShell`, `MenuBackdrop` — the 3D backdrop per screen — and `Sprinkles`).
- `views/` — router pages. Everything except `/`, `/login` and the 404 carries `meta.requiresAuth` (the guard redirects to `/login?redirect=`). Routes: `/categories`, `/categories/new|:id/edit|:id/articles`, `/articles/new|:id|:id/edit`, `/search`, `/checklist`, `/telegram`, `/users`; `/map` redirects to `/categories`.
- `services/http/` — `AuthenticatedHttpClient` (JWT on every request) and `ExcelDownloadAdapter`.
- `infrastructure/` — HTTP repositories (`httpArticleRepository`, `httpCategoryRepository`, `httpMatchRepository`, `httpPageRepository`, …) and `apiConfig`.
- `infrastructure/three/` — the three.js layer:
  - `neighborhood/` — the island and its neighbourhood: house templates (`BungalowTemplate`, `CabinTemplate`, `CottageTemplate`, `TowerTemplate`, `TownhouseTemplate`), `HouseFactory`, `RoadBuilder`, `TreeFactory`, `Traffic`/`ToyCar`, bridges to islets (`BridgeLinks`, `ArchBridge`, `Outpost`), day/night cycle (`SkyCycle`, `NightSky`), `GuardianBear`, `SeededRandom`. Archipelago: `ArchipelagoLayout` spreads the categories over islands (limits in `constantes/barrio_constantes.ts`); `IslandLinks` joins them with `CarBridge`, `RopeBridge`, `Boardwalk`, `Gondola`, `Zipline`, `RaftFerry` and `BalloonHop` (with `TravelerBear`); `StonePath`, `GiantTreeBuilder`, `MushroomBuilder`, `CivicBuildings`, vehicles (`ServiceVehicle`, `TwoWheeler`, `ToyCart`), animals (`PetAnimals`, `DuckFlock`, `FarmAnimals`, `Butterflies`), the sea (`SeaFloor`, `ReefGarden`, `FishSchools`, `SeaCreatures`, `SurfaceLife`, boats `PirateShip`/`HarborBoats` in `SeaTraffic` along `SeaRoutes`) and lights (`NightLights`, `LighthouseBeam`, `TrafficSignal`). Per-island themes (`ArchipelagoLayout.themes`: commerce with `CommerceDistrict`/`MarketPlaza`/`ShopFront`/`MiniMall`, services, park, farm, harbour with `HarborPier` and the `SkyReceiver`) plus `IslandFolk` inhabitants; the castle island is `CastleIsland` (`CastleKeep`, `MedievalVillage`, `KnightPatrol`, `ToyDragon`); effects live in `ParticleSystem`. `MeshMerger` batches the static pieces per material.
  - `park/`, `sky/` (`CloudSea`) and `scenes/` — one 3D world per screen (`HouseFrontWorld`, `NeighborhoodWorld`, `SearchWorld`, `StorageWorld`, `PostWorld`, `ChecklistWorld`, `Landscape`, `Toy`) on top of `ScenicStage`/`ScenicWorld`.
  - `walk/` — first-person walk: `WalkPhysics` (Rapier `@dimforge/rapier3d-compat`, colliders built from objects marked with `Solid.mark`), `WalkInput` (keyboard, mouse with captured pointer, touch) and `WalkMode` (camera, doors and entering rooms).
  - `stairs/` — the landing staircase with the bear descending on scroll (`StairsStage`).
  - root — `BearBuilder`, `BearStage`, `LoginStage`, `StreetStage`, `SkyTexture`, `GrassField`, `SurfaceTextures`, etc.
- `composables/` — Vue hooks (`use*.ts`): `useTheme`, `useLazyLoading`, `useCanvasStage`, `useFormSubmit`, `useImageUpload`, `useChecklist`, etc.
- `stores/` — Pinia (`createPinia()` in `main.ts`): `walk` keeps the first-person mode (door notice, pointer capture and the house you entered, so the walk can resume when you come back).
- `constantes/` — `<responsibility>_constantes.ts` (`barrio_constantes.ts`, `checklist_constantes.ts`, `nav_constantes.ts`, `ui_constantes.ts`).
- `utils/` — `roomTone`, `fallbackImage`. `directives/` — `v-aria-focus.js`.

**Theme:** the app is a neighbourhood of houses with guardian bears. UI copy is in Spanish with a warm, close tone («Guardar algo nuevo», «Abrir el cuarto»). Own styles live in `assets/main.css`: `ui-btn`, `ui-toy`, `ui-sign`, `ui-notebook`, `ui-input`, `ui-error` classes, `--l-*` variables; Nunito and Bagel Fat One fonts.

### Backend (`backend/src/`)

- `routes/` — Express routes per resource: `articleRoutes`, `authRoutes`, `categoryRoutes`, `jwksRoutes`, `noteRoutes`, `searchRoutes`, `telegramLinkRoutes`, `userManagementRoutes`, `matchRoutes`, `scrapeRoutes`.
- `controllers/` — req/res handling (`articleDeleteController`, `categoryController`, `reportController`, `userManagementController`).
- `services/` — business logic: article, category, note, search, cloudinary, excelReport, session, linkCode, validation, match, scrape, textNormalizer, urlGuard.
- `builders/` — `articleBuilder`, `categoryBuilder`, `noteBuilder`, `excelWorkbookBuilder`, `pageContentBuilder`.
- `db/schema.ts` — full Drizzle schema: `categories`, `articles`, `notes`, `users`, `sessions`, `link_codes` (`db/schema/` keeps `articles.ts` and `users.ts`); `db/client.ts` opens the connection.
- `middleware/` — `authMiddleware`, `errorHandler`, `validateRequest`, `rateLimiters`, `requestLogger` (morgan); helmet and express-rate-limit are mounted in `app.ts`.
- `validators/` — zod per resource (article, category, note, user, search, telegram, match, scrape, common) plus anti-injection patterns.
- `constantes/` — `<responsibility>_constantes.ts` (`match_constantes.ts`, `red_constantes.ts`, `scrape_constantes.ts`).
- `token/` — `jwtKeys` (RS256 key), `jwtConfig`, `tokenIsUser`.
- `verefiers/` — `userCredentialsVerifier` (the folder keeps that spelling, no accent).
- `scripts/` — `createUser`, `generateJwtKey`, `downloadData`, `uploadData`, `dataTables` and `smokeTest` (the only automated check in the repo).
- `api/index.ts` — Vercel serverless entry; `api/index.js` and `.js.map` are compiled output and are versioned.

### Agent (`agente/src/`)

- `agent/` — `toolkit_inventory.py` (CRUD), `toolkit_search.py`, `toolkit_image.py`, `toolkit_checklist.py` (tools only), `chat_agent.py`, plus the graph: `node_model.py` (`ModelNode`) and `edge_router.py` (`ToolRouter`, conditional edges).
- `api/` — `server_api.py` (`ApiServer`: Flask `/health`, `/chat`, `/upload` with Talisman, request limiting and DTOs) and `webhook_telegram.py` (`TelegramWebhook`, `/telegram/webhook`); `agente/api/index.py` exposes `app` to Vercel.
- Graph (`AgentBuilder`): nodes `model` (with bound tools), `tools` (`ToolNode`) and `final` (reply without tools). `ToolRouter.after_model` goes to `tools` when there are tool calls, to `final` when the model stayed silent after using tools, and to the end when there is nothing to answer; `after_tools` returns to `model` unless a tool asks the user to pick between matches (`CHOICE_KEY`) or `MAX_TOOL_STEPS` is reached.
- **Instruction gate:** `services/gate_instruction.py` (`InstructionGate`) and `client_decisions.py` (`DecisionsClient`) classify every message with the OpenRouter *decisions* API (`DECISIONS_MODEL`, default `typesafe/jev-1.13`; questions in `constantes_filtro.py`). Only inventory-management messages pass; otherwise it answers 422 and applies a 120 s cooldown (429); if it cannot verify, 503. A second classifier (`asks_for_information`) evaluates the answer in context. **Every user message leaves for an external service:** never run it against the real service without permission.
- **"Do I have everything?":** `ChecklistToolkit` (`leer_pagina` → `PageReader`, `POST /scrape`; `revisar_lista` → `ChecklistReview`, `POST /match`) uses the user's token and the backend's protections (auth, SSRF guard, limits). Inputs are validated with `PageUrlDto` and `ChecklistItemsDto`; the page text is sanitised (long lines or lines with code are dropped) and prompt rule 14 treats it as data, never as an instruction. Neither tool modifies the inventory. Constants in `constantes_checklist.py`.
- Conversation memory: `memory_choice` (pending options), `memory_focus` (focused article/category) and `memory_question` (the assistant's previous question), on top of `store_memory`/`store_postgres` (schema `agente`).
- SVG: `renderer_svg.py`, `guard_svg.py` (validates the SVG), `constantes_svg.py`, `dto_svg.py`, plus the grid images.
- `bot/` — `handlers_bot.py` (`BotHandlers`, Telegram) and `keyboard_choice.py` (`ChoiceKeyboard`, buttons to pick between matches).
- `builders/` — `builder_agent`, `builder_telegram_bot`, `builder_grid_image`, `builder_gallery_image`.
- `constantes/` — `constantes_colores`, `constantes_imagenes`, `constantes_agente`, `constantes_red`, `constantes_bot`, `constantes_limites`, `constantes_validacion`, `constantes_seguridad`, `constantes_auth`, `constantes_estado`, `constantes_filtro`, `constantes_checklist`, `constantes_svg`.
- `decorators/` — `decorator_error_handler`, `decorator_name_lookup`, `decorator_tool_registry`, `decorator_dto_validator`, `decorator_jwt_required`.
- `dtos/` — pydantic DTOs (`dto_base` rejects scripts and SQL) for every tool and endpoint.
- `errors/` — `error_backend` (`BackendError`), `error_auth` (`AuthError`), `error_ambiguo`, `error_filtro` (`InstructionRejected`).
- `backend.py` — `Backend`: HTTP transport (session, JWT, upload).
- `services/` — `adapter_llm` (+ `adapter_llm_lazy`), `client_inventory`, `client_decisions`, `gate_instruction`, `memory_choice|focus|question`, `search_fuzzy`, `search_inventory`, `resolver_name`, `reader_page`, `review_checklist`, `uploader_image`, `verifier_jwt`, `session_bot`, `context_auth`, `store_memory`, `store_postgres`, `renderer_svg`, `guard_svg`, `images/` (`renderer_image`, `asset_builder`, `asset_loader`, assets).
- `utilerias/` — `util_red`, `util_codec`, `util_valor`, `util_inyeccion`, `util_registro` (static classes `Red`, `Codec`, `Valor`, `Injection`, …).
- `main.py` — `InventoryAgentApp`: wires backend, toolkits, agent and gate, and starts the `cli`, `server`, `telegram` or `webhook` mode.

## Code conventions

### Backend

- **No `//` comments.** JSDoc only.
- **JSDoc on functions and methods** (not on constants, variables or classes): what it does, `@param name - ...`, `@returns ...` and `@throws ...` when applicable. Converting a comment into JSDoc is not enough: it must document the function's contract.
- Route handlers document the endpoint (`GET /articles/:id — ...`), its response and the errors it raises.
- **Constants live outside classes and services:** they go in `backend/src/constantes/`, one file per responsibility named `<responsibility>_constantes.ts`. Limits, timeouts and value lists are never declared inline in the file that uses them; import them from there.
- Matching: `POST /match` (`matchRoutes` → `matchService`) compares texts (e.g. ingredients from a scrape) with the article names. All per-row work happens in Polars columns (`nodejs-polars`): `textNormalizerService` normalises and singularises, and `matchService` fixes typos, crosses by word, scores and keeps the 5 best per text. Do not iterate rows in JavaScript; only compute the edit distance for the few typo candidates. In `nodejs-polars`, `str.replaceAll` patterns must be `RegExp` (with `string` the backslashes are lost) and `pl.coalesce` does not exist.
- Scraping: `POST /scrape` (`scrapeRoutes` → `scrapeService`, Puppeteer) extracts with `pageContentBuilder` (Cheerio) and validates the target with `urlGuardService` (public http(s) only; blocks local and private IPs, also on the page's own requests and redirects).
- One engine per layer: Supabase (PostgreSQL) for data and Cloudinary for images; no adapters and no engine-selection flags (`ENGINE`, `STORAGE`).

### Frontend

- Fixed flow: view → `*UseCase.execute()` → HTTP repository → `authenticatedHttpClient`. Views never call `fetch` or the repositories directly.
- One use case per file, with its exported singleton; repository interfaces live in `core/domain/`.
- Forms validate with `validateInput(schema, data)` before submitting, show per-field `fieldErrors` and a general `errorMessage`.
- Images are uploaded when they are picked during submission (`resolveImageUrl`), not before.
- No `//` comments; JSDoc on functions and classes in `core/`, `infrastructure/` and `services/`.
- UI copy in Spanish with the "guardians" tone; new screens get their 3D scenario via `MenuBackdrop` or a scene in `infrastructure/three/scenes/`.
- `three` dependencies stay inside `infrastructure/three/`; Vue components only mount the scenes.
- **Creativity applies to navigation and controls too.** The header (`AppHeader.vue`) is a toy shop facade: an awning with scallops, a hanging sign per destination (`constantes/nav_constantes.ts`) and a lamp chain for the light/dark theme. A new destination or control is integrated into that world; it is not added as yet another generic button in a row. Use the `frontend-design` skill for interface design.
- **Component logic lives in composables** (`frontend/src/composables/use*.ts`); the component only declares props, template and wiring. Existing ones: `useCanvasStage` (3D scenario lifecycle: observers, pointer, cleanup; used by `MenuBackdrop`, `BearPeekScene`, `HomeBearScene`, `HomePark`, `LocationStreetPanel` and `NeighborhoodMap`), `useFormSubmit` (validation, per-field errors and submission), `useImageUpload`, `useImagePreview`, `useClipboard`, `useCountdown`, `useArticleSearch`, `useNotes`, `useUsers`, `useCategoriesOverview`, `useLoader` (load a record on mount), `useTimedMood`, `useDayClock`, `useWindowListener`, `useChecklist` and `useRecipeImport`. Before writing mount, form or timer logic inside a component, check whether a composable already exists.
- New 3D scene: a `*World` class in `infrastructure/three/scenes/` implementing `ScenicWorld`, registered in `MenuBackdrop.vue` (the `Scene` type, `LABELS` and `worlds`). `ChecklistWorld` is the "Do I have everything?" archipelago: islands with different trades (bakery, search, workshop, campsite, list, garden) over an underwater sea (deep blue water with light shafts, yellow sand, algae, coral, rocks, shells, fish schools, turtle, mermaids and bubbles). Surfaces use procedural textures from `SeaTextures` (rock, sand, algae, mottled, fish belly, caustics) generated on canvas; never use flat colours in new scenes.
- **Textures in the 3D scenes:** no flat colours. Common surfaces come from `infrastructure/three/SurfaceTextures.ts` (clay, fur, foliage, grass, asphalt, water ripples) and the sea ones from `scenes/SeaTextures.ts`, both on top of `TextureCanvas` (canvas-drawn textures, cached, keyed by seed). `ClayMaterials`, `BearBuilder`, `TreeFactory`, `HouseParts`, `RoadBuilder` (with UVs), `Landscape.meadow` and the other material factories already use them.
- **3D grass:** `infrastructure/three/GrassField.ts` covers a disc with blades that sway (shader injected via `onBeforeCompile`, still with `prefers-reduced-motion`), plus flowers, shrubs, mushrooms and irregular rocks, all in instanced meshes. It is placed with an `accept(x, z)` callback to dodge streets, houses and squares. The map uses it in `NeighborhoodBuilder.grass`; the meadow scenes use it through `Landscape.vegetation(seed)` and the home park through `ParkScenery.grass`, dodging the plaza, pond, Ferris wheel and fence. For curved surfaces it accepts `ground(x, z)`, the ground height at each point: that is how it covers the hills and background islets of the map (`Backdrop.hillGrass`) and the archipelago islands (`ChecklistWorld.island`).
- **Map vehicles:** `ToyCar` (classic Beetle, pickup, van and sedan; the Beetle is the most frequent in `Traffic`, in red, black, yellow, blue and pink, with a stripe and a race number). The Beetle is built from soft cross-sections along the car (`ToyCar.loft`, `beetleBody`, `beetleShell`, `beetleFender`), not from loose boxes or spheres: the side profile must be a single continuous curve, and the glass cabin must reveal the bear. `ToyBoat` (sailboat, freighter, fishing boat, launch) carry a full bear driver (`VehicleDriver.bear`: the real guardian body, seated with arms on the wheel, wearing a cap, shades or a sailor hat; never just a floating head) and cargo (`VehicleCargo`: computers, laptop, boxes, lamp, plant, suitcase, barrel, fish). `Traffic` and `Backdrop.makeBoats` spread them by type and colour. `ToyHelicopter` (cargo with hanging load, rescue with life vest, delivery with crates) uses the same driver and cargo; its rotor and tail rotor spin from the scenario (`rotor.rotation.y`, `tailRotor.rotation.z`). Flights of three helicopters come from `HelicopterFleet` (elliptical orbits with rotors and hanging cargo), used by the park (`ParkBuilder`), the archipelago (`ChecklistWorld`); the map orbits them in `Backdrop.makeHelicopters`. The park pond has two boats with bears (`ParkScenery.pondBoat`).
- "Do I have everything?" (`/checklist`, `ChecklistView.vue`): build a list by hand or from a web page (`POST /scrape`), compare it with the inventory (`POST /match`) and classify each item as `tengo`, `revisar` (used up or broken) or `falta`. When the list comes from a page, `recipeSourceSelector.ts` prioritises lists and tables (first those starting with quantities) and only falls back to headings and paragraphs if none is usable; it drops texts longer than 90 characters and caps the list at 60 items. Use cases `reviewChecklist.ts` and `scrapeRecipe.ts`; repositories `httpMatchRepository` and `httpPageRepository`.

### Agent

Rules given explicitly by the project owner. Apply them to every new change.

**Design**

- **Reduce over-engineering.** Do not follow an architecture for its own sake: no ports/ABCs, no services that only forward calls, no layers without logic of their own. If something is assembled from a dict, it does not need a builder.
- **DRY.** If logic repeats, it goes into a single class/method. Before creating something, check whether it already exists.
- **Builder** only where construction takes several steps (agent, bot, grid, gallery). Fluent: `with_*` / `set_*` and `build()`.
- **Class and method decorators** for cross-cutting concerns (errors, tool registration, name → id resolution), instead of repeating code in each tool.

**File structure**

- **One class per file.** Subclasses and intermediates get their own file too.
- **Family prefixes in file names.** Every file of a family shares the same prefix so they sort together: `toolkit_inventory.py`, `toolkit_search.py`, `toolkit_image.py` (not `search_toolkit.py`); `builder_agent.py`, `builder_grid_image.py`; `decorator_error_handler.py`; `error_backend.py`; `asset_builder.py`, `asset_loader.py`; `search_fuzzy.py`, `search_inventory.py`; `constantes_colores.py`; `util_red.py`. This applies to **all** files, even when the family has a single member today. Pattern: `<family>_<variant>.py` (role first, subject second). Class names do not change. When creating a file, look for its family first and follow the prefix.
- **No loose module-level functions**, except the declared tools. Everything lives in classes (`@staticmethod` / `@classmethod`). What is not a tool does not go into a toolkit.
- **Folders by type:** `builders/`, `constantes/`, `decorators/`, `errors/`, `services/`, `utilerias/`. Constants, errors, builders and utilities are never left loose in other files.
- **Utility classes drop the word "utilerias"** from their name (`Red`, `Codec`, `Valor`) and live in `utilerias/`.
- **Decorators are not mixed:** each class groups a single kind (method with error handling / method with name lookup / class for tool registration). A decorator only decorates: no requests and no business logic inside.

**Tools**

- A toolkit contains **only** declared tools; each tool is a one-line call to a service.
- **No HTTP requests inside the toolkit:** they go in `InventoryClient` / `Backend`. Search, download or upload go in services (`InventorySearch`, `ImageUploader`) and, when they are not CRUD, in their own toolkit.
- Group tools by domain (CRUD, search, images) in separate toolkits.

**Style**

- **No `#` comments.** Short docstrings are fine.
- **No nested `if`s:** flat guards, dispatch dictionaries, `map`/`filter` and comprehensions.
- New code follows the style of the existing code; do not add features "just in case".

**Images**

- They are built as a **grid** with `GridImageBuilder`; backgrounds are PNGs generated by `AssetBuilder` (`assets/`).
- **Never load fonts:** only Pillow's built-in font (`ImageFont.load_default(size)`); since it has no accents, the text goes through `Codec.strip_accents`. Do not depend on system fonts or `.ttf` files.

**Dependencies and environment**

- **Lightweight:** no torch/transformers. Fuzzy search with RapidFuzz (no embeddings). LLM through **OpenRouter** (`langchain-openrouter`).
- **One single project:** the Telegram bot lives inside `agente/` (modes `cli`, `server`, `telegram`, `webhook` via `MODE` or an argument).
- Always run and manage packages **with `uv`** (`uv run`, `uv add`, `uv remove`).

## Git

These rules **override** any default attribution of the tooling.

- **No co-author or signature.** No commit or pull request carries `Co-Authored-By`, no "Generated with …", and no other mention of the assistant. Commits carry only the user's authorship.
- **Atomic commits:** one logical change per commit. If a change mixes topics (backend + agent, code + docs + docker), split it.
- **Conventional messages** in Spanish, lowercase after the colon: `type(scope): description` with `feat`, `fix`, `refactor`, `build`, `chore`, `docs`, `test`. Scope when applicable (`agente`, `backend`, `frontend`, `docker`). Example: `refactor(agente): unificar los clientes HTTP en Backend`.
- **Explicit staging:** `git add -A -- <paths>` with only the files of the change; never `git add .`. Do not version `.agents/`, `.claude/`, `skills-lock.json`, `videos/`, `portfolio-videos/` or `grid_output.png`.
- **Review the index before every commit:** `git commit` includes everything already staged, not just what was just added.
- **Do not create branches or pull requests on your own initiative.** Only when the user explicitly asks; until then, changes stay in the working tree or in a local commit on the current branch.
- Never rewrite already-pushed commits or use `--force`; only rewrite local, unpushed commits. Push with a normal `git push` to the working branch, not to `master`.
- The flow is: work on `dev`, open a pull request into `master`, merge it there. `master` is what deploys to Vercel.
- The working tree often carries unrelated modifications (Windows line endings on files nobody touched). Stage by explicit path and never sweep them into a commit; the repository identity lives in the local `user.name`/`user.email` config, so a WSL shell inherits it and a Windows shell uses the global one.

## Safety and execution limits

- **Do not test against the real model** or make calls that spend credits or send inventory data to external services without explicit permission. Verify with local tests (mocked backend, fake key).
- **Every user message of the agent leaves for an external service** (OpenRouter *decisions*): never run the real flow without permission.
- Before deleting folders with uncommitted changes, leave a backup copy; never touch or print secrets (`.env`).
- **Writing a command or script is not running it.** If asked to "add command X", only implement it and verify with modes that change nothing (`--dry-run`, `tsc --noEmit`, listings). Never actually run Docker commands (`build`, `up`, `clean`, `rm`, `rmi`) or deletions without explicit confirmation.
- When renaming or moving files, update imports, documentation and `docker-compose.yaml`, and verify everything still works.

## Verification

**There are no automated tests.** The only check is `backend/src/scripts/smokeTest.ts`; everything else is verified with:

- `npm run typecheck` (vue-tsc + tsc + agent syntax),
- compiling the agent (`uv run python -c "import src.main"` or equivalent without external calls),
- local tests with a mocked backend and fake keys,
- manual review in the browser (skills `/run`, `/verify`).

## Infrastructure

- `docker-compose.yaml`: `db` (`supabase/postgres:15.8`, with the bootstrap script in `supabase/init/`), `backend`, `frontend` (nginx) and `agente`. Managed through `scripts/docker.mjs` (see the rule about not running Docker without confirmation).
- `docs/`: `variables-entorno.md`, `crear-usuarios.md`, the user manual (`manual-usuario/`, PDF and HTML with screenshots) and `arquitectura/` (the architecture maps).
- `scripts/`: `docker.mjs` (Docker stack), `todo.mjs` and `archify/` (regenerating the architecture maps).

**Deploy**

- Frontend → Vercel (`frontend/vercel.json`).
- Backend → Vercel serverless (`backend/api/index.ts`, `backend/vercel.json`).
- Agent → Vercel (`agente/api/index.py`) or a container; see `agente/README.md`.

## Architecture documentation

`docs/arquitectura/` holds the system's maps, generated with the Archify skill and read straight from the code:

- `arquitectura-sistema.html` — the whole system: web and Telegram entry points, frontend, backend, agent, and where the data, the images and the agent's state live.
- `ciclo-peticion.html` — one authenticated request, from the screen to the database.
- `flujo-agente.html` — the instruction filter, the LangGraph nodes, the tools and the tool loop.
- `imagenes/` — the PNG used by the READMEs; `candidatos/` — the editable IR of each diagram.
- `README.md` — the same maps explained in plain language, for humans.

Rules for the maps:

- **They come from the code, not from memory.** Every node carries `sources` with the repository-relative path and line range that proves it, and the viewer links to that code at the pinned revision.
- **Regenerate instead of hand-editing the HTML.** Edit the candidate JSON, then run the whole finalizer; the previous receipts belong to the previous bytes.
- **The published HTML is heavy** (~780 KB each, viewer and fonts embedded). The PNGs and the candidate JSONs are the light parts; the HTML can be regenerated at any time.

```bash
# regenerate one map (uses the Chrome for Testing build when there is no system Chrome)
node scripts/archify/run-archify.mjs finalize architecture \
  docs/arquitectura/candidatos/arquitectura-sistema.json \
  docs/arquitectura/arquitectura-sistema.html \
  --quality showcase --repo-root . --json

# the candidates already carry the Spanish catalogue; re-inject it after adding a locale
node scripts/archify/inject-locale.mjs docs/arquitectura/candidatos/arquitectura-sistema.json
```

Working folders and verification receipts live in `.archify/` (git-ignored); the publishable copy is `docs/arquitectura/`.

## System skills

| Task | Skill |
|-------|-------|
| Verify a change works in the browser | `/verify` |
| Launch the app and see real behaviour | `/run` |
| Review bugs and inefficiencies in the diff | `/code-review` |
| Simplify code without changing behaviour | `/simplify` |
| Security review (auth, JWT, inputs) | `/security-review` |
| Reduce repeated permission prompts | `/fewer-permission-prompts` |
| Configure hooks or permissions in settings.json | `/update-config` |

## Related documents

- `README.md` — product overview, stack, deployment and repo layout.
- `docs/arquitectura/README.md` — the system maps, explained in plain language.
- `docs/variables-entorno.md` — environment variables per service.
- `docs/crear-usuarios.md` — creating users.
- `agente/README.md` — agent specifics and how it is published.
