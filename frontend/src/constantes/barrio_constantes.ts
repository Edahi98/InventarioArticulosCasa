export const PATH_STONE_COLORS = [0xffb36b, 0xffd36b, 0xff9a8a, 0xf7a8c8, 0xc9a2f0, 0x9fc8f5, 0x9be0c0] as const;
export const PATH_MORTAR = 0x8a6a7e;
export const PATH_BORDER = 0xfff1e0;
export const PATH_CURB_COLORS = [0xe9dccf, 0xd8cbe8, 0xf3d9c4] as const;
export const PATH_ROW_STEP = 0.34;
export const PATH_STONES_PER_ROW = 5;
export const PATH_CURB_STEP = 0.24;
export const PATH_JOINT_BLOOMS = 0.9;

export const GIANT_CROWN_COLORS = [0xffd84d, 0xb98cf0, 0xff9fc8, 0x9fe08a, 0xffb36b] as const;
export const GIANT_BARK = 0x9a6b52;
export const GIANT_TREES_PER_ISLAND = 3;
export const GIANT_TREE_CLEARANCE = 2.6;
export const GIANT_TREE_SPACING = 4.5;

export const MUSHROOM_CAPS = [0xff5f6d, 0xb98cf0, 0xffb036, 0xff8fc0, 0x6fc3f0] as const;
export const MUSHROOM_STEM = 0xfff0d6;
export const MUSHROOM_GLOW = 0xfff3b0;
export const MUSHROOM_CLUSTERS_PER_ISLAND = 2;

export const SPARKLE_COUNT = 70;
export const HEART_COUNT = 14;
export const SPARKLE_COLORS = [0xfff6a8, 0xffffff, 0xffc8e6, 0xbfe6ff] as const;
export const HEART_COLORS = [0xff6fa5, 0xff9fc8, 0xffd84d] as const;
export const BUTTERFLY_COUNT = 9;
export const BUTTERFLY_COLORS = [0xff8fc0, 0xffd84d, 0xb98cf0, 0x7fd0ea, 0xffb36b] as const;

export const CLOUD_TOP = 0xffffff;
export const CLOUD_BELLY = 0xe4dcff;
export const RAINBOW_COLORS = [0xff6f91, 0xff9f5a, 0xffe14d, 0x7ed99a, 0x6cc6f0, 0x8f9cf5, 0xc08ef0] as const;

export const GARLAND_COLORS = [0xffd84d, 0xff6f91, 0x7fd0ea, 0x9be08a, 0xffb36b] as const;
export const GOD_RAYS = 4;
export const PLAZA_LIGHT = 0xffc982;
export const LIGHTHOUSE_BEAM = 0xfff1b8;
export const HEADLIGHT_BEAM = 0xfff0c0;
export const WINDOW_STAGGER = [0.12, 0.55] as const;

export const SEA_LOOPS_MAX = 3;
export const SEA_ISLAND_MARGIN = 1.2;
export const SEA_SHELF_REACH = 1.36;
export const SEA_LINK_MARGIN = 2.6;
export const ORBIT_FLEET = ["pirata", "vapor", "galeon", "regata", "pirata", "goleta"] as const;
export const LOOP_FLEET = ["remos", "submarino", "rescate"] as const;
export const SHIP_SCALE = 1.5;
export const SHIP_SPEED = [0.55, 0.85] as const;

export const SEA_FLOOR_Y = -5.2;
export const SEA_WATER_Y = -1.35;
export const KELP_PER_ISLAND = 26;
export const SEAGRASS_PER_ISLAND = 60;
export const CORALS_PER_ISLAND = 9;
export const CORAL_SHELF_Y = -2.15;
export const CORAL_FANS = 12;
export const CORAL_BRAINS = 10;
export const CORAL_STAGHORNS = 12;
export const CORAL_TUBES = 10;
export const CORAL_TABLES = 6;
export const CRITTERS_PER_ISLAND = 10;
export const FISH_SCHOOLS = 4;
export const FISH_PER_SCHOOL = 14;
export const JELLYFISH = 7;
export const TURTLES = 2;
export const MANTAS = 2;
export const CRABS_PER_ISLAND = 3;
export const SHARK_FINS = 2;
export const SEAGULLS = 4;
export const BUOYS = 5;
export const BUBBLES_MAX = 40;
export const FLOATING_FLOWERS = 30;
export const KELP_COLORS = [0x2fa36b, 0x5fb87a, 0x86d6a8, 0x9be26b, 0x3d8f4a] as const;
export const CORAL_COLORS = [0xff8a3d, 0xff6f91, 0xffb066, 0xb98cf0, 0x6cc6f0, 0xffd84d] as const;
export const SEA_FISH_COLORS = [0xff8fb7, 0xffb066, 0x7fd0ea, 0xb89cf2, 0x86d6a8, 0xffe35c] as const;

export const LILY_PADS = 9;
export const HILL_COTTAGES = 3;

export const SINGLE_ISLAND_MAX = 6;
export const HOUSES_PER_ISLAND = 7;
export const ISLANDS_MAX = 4;
export const ISLAND_CHANNEL = 7.5;
export const OUTPOST_ANGLE = 0.55;
export const CIVIC_PER_ISLAND = 2;
export const CIVIC_KINDS = ["hospital", "bomberos", "panaderia", "escuela", "comisaria", "biblioteca", "correo", "estacion", "juegos"] as const;
export const CARS_PER_ISLAND_MAX = 6;
export const VEHICLE_ROTATION = ["vocho", "autobus", "pickup", "moto", "ambulancia", "vocho", "bicicleta", "reparto", "bomberos", "carreta", "patrulla", "camioneta", "sedan"] as const;

export const ROAD_LANE_WIDTH = 1.6;
export const CAR_DECK_WIDTH = 2.7;
export const TOUR_CARS_PER_LINK = 2;
export const TOUR_VEHICLES = ["ambulancia", "autobus", "vocho", "bomberos", "moto", "reparto", "bicicleta", "carreta", "patrulla", "pickup"] as const;
export const CAR_GAP = 1.75;
export const CAR_SPEED = [0.9, 1.25] as const;
export const SIGNAL_CYCLE = 9;

export const WALKERS_PER_LINK = 1;
export const TRAVELERS_MAX = 6;
export const PETS_PER_ISLAND = 4;
export const DUCKS_PER_ISLAND = 4;
export const FISH_MAX = 6;
export const FARM_HILLS = 5;

export const COMMERCE_LOTS = 3;
export const SHOP_KINDS = ["jugueteria", "fruteria", "libreria", "cafeteria", "mercado", "panaderia"] as const;
export const SHOP_AWNINGS = [
  ["#ff8fb7", "#fffaf2"],
  ["#7fd0ea", "#fffaf2"],
  ["#ffd84d", "#ff8a3d"],
  ["#9be08a", "#fffaf2"],
  ["#b98cf0", "#fff1e0"],
  ["#ff6f6f", "#fffaf2"],
] as const;
export const SHOPPERS_PER_PLAZA = 2;
export const SHOPPERS_MAX = 6;
export const MARKET_FRUIT = [0xff4f5b, 0xffb036, 0xffe35c, 0x9be08a, 0xb98cf0] as const;

export const CASTLE_RADIUS = 11.5;
export const CASTLE_WALL_RADIUS = 4.6;
export const CASTLE_MOAT = [5.4, 6.4] as const;
export const CASTLE_TOWERS = 6;
export const CASTLE_ROOF = 0x4f6fd8;
export const CASTLE_STONE = 0xd8d0e6;
export const VILLAGE_HOUSES = 6;
export const KNIGHTS_MAX = 4;
export const ARCHERS_MAX = 3;
export const HORSES = 2;
export const DRAGON_COLOR = 0x7ed99a;

export const ISLAND_THEMES = ["comercio", "servicios", "parque", "granja", "puerto"] as const;
export const THEME_CIVIC: Record<(typeof ISLAND_THEMES)[number], readonly string[]> = {
  comercio: ["panaderia", "correo"],
  servicios: ["hospital", "bomberos", "comisaria"],
  parque: ["juegos", "escuela", "biblioteca"],
  granja: ["estacion", "correo"],
  puerto: ["estacion", "bomberos"],
};
export const FOLK_PER_ISLAND = 4;
export const FOLK_MAX = 14;
export const FARM_ANIMALS_PER_ISLAND = 5;
export const KITES_PER_ISLAND = 1;
export const RECEIVER_SLOTS = 12;
export const RECEIVER_CYCLE = 7;
export const PACKAGE_COLORS = [0xff6f91, 0x7fd0ea, 0xffd84d, 0x9be08a, 0xb98cf0, 0xffb36b] as const;
export const PARTICLES_GLOW_MAX = 700;
export const PARTICLES_SOFT_MAX = 900;
export const WEATHER_CYCLE = 240;
export const FIREWORK_EVERY = 3.5;
