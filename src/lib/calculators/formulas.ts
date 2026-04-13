export type UnitSystem = "metric" | "imperial";

const M3_TO_FT3 = 1 / 0.0283168;
const FT3_TO_M3 = 0.0283168;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function safeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

export type ConcreteInputs = {
  unit: UnitSystem;
  length: number;
  width: number;
  depth: number;
  bagSizeKg: 20 | 25 | 40;
  wastePercent: number;
};

export function calculateConcrete(inputs: ConcreteInputs) {
  const bagYieldsM3: Record<ConcreteInputs["bagSizeKg"], number> = {
    20: 0.009,
    25: 0.011,
    40: 0.018,
  };

  const waste = clamp(safeNumber(inputs.wastePercent), 0, 20);
  const length = safeNumber(inputs.length);
  const width = safeNumber(inputs.width);
  const depth = safeNumber(inputs.depth);

  if (length <= 0 || width <= 0 || depth <= 0) {
    return null;
  }

  const volumeFt3 =
    inputs.unit === "metric"
      ? length * width * (depth / 100) * M3_TO_FT3
      : length * width * (depth / 12);
  const volumeM3 =
    inputs.unit === "metric" ? length * width * (depth / 100) : volumeFt3 * FT3_TO_M3;
  const volumeWithWasteM3 = volumeM3 * (1 + waste / 100);
  const bags = Math.ceil(volumeWithWasteM3 / bagYieldsM3[inputs.bagSizeKg]);

  return {
    waste,
    volumeM3,
    volumeFt3,
    volumeWithWasteM3,
    bags,
  };
}

export type PaintInputs = {
  unit: UnitSystem;
  length: number;
  width: number;
  height: number;
  coats: number;
  doorsArea: number;
  windowsArea: number;
  coverage: number;
};

export function calculatePaint(inputs: PaintInputs) {
  const length = safeNumber(inputs.length);
  const width = safeNumber(inputs.width);
  const height = safeNumber(inputs.height);
  const coverage = safeNumber(inputs.coverage);
  const coats = Math.max(1, safeNumber(inputs.coats));
  const doorsArea = safeNumber(inputs.doorsArea);
  const windowsArea = safeNumber(inputs.windowsArea);

  if (length <= 0 || width <= 0 || height <= 0 || coverage <= 0) {
    return null;
  }

  let totalArea: number;
  let liters: number;
  let gallons: number;

  if (inputs.unit === "metric") {
    const wallArea = Math.max(0, 2 * (length + width) * height - doorsArea - windowsArea);
    totalArea = wallArea * coats;
    liters = totalArea / coverage;
    gallons = liters * 0.264172;
  } else {
    const wallArea = Math.max(0, 2 * (length + width) * height - doorsArea - windowsArea);
    totalArea = wallArea * coats;
    gallons = totalArea / coverage;
    liters = gallons * 3.78541;
  }

  const areaM2 = inputs.unit === "metric" ? totalArea : totalArea * 0.092903;
  const areaFt2 = inputs.unit === "metric" ? totalArea * 10.7639 : totalArea;
  const recommendedLiters = Math.ceil(liters * 10) / 10;
  const recommendedGallons = Math.ceil(gallons * 100) / 100;

  return {
    areaM2,
    areaFt2,
    liters,
    gallons,
    recommendedLiters,
    recommendedGallons,
  };
}

export type TileInputs = {
  unit: UnitSystem;
  roomLength: number;
  roomWidth: number;
  tileLength: number;
  tileWidth: number;
  wastePercent: number;
  tilesPerBox: number;
};

export function calculateTile(inputs: TileInputs) {
  const roomLength = safeNumber(inputs.roomLength);
  const roomWidth = safeNumber(inputs.roomWidth);
  const tileLength = safeNumber(inputs.tileLength);
  const tileWidth = safeNumber(inputs.tileWidth);
  const waste = clamp(safeNumber(inputs.wastePercent), 0, 30);
  const tilesPerBox = safeNumber(inputs.tilesPerBox);

  if (roomLength <= 0 || roomWidth <= 0 || tileLength <= 0 || tileWidth <= 0) {
    return null;
  }

  const floorAreaM2 =
    inputs.unit === "metric" ? roomLength * roomWidth : roomLength * roomWidth * 0.092903;
  const tileAreaM2 =
    inputs.unit === "metric"
      ? (tileLength / 100) * (tileWidth / 100)
      : (tileLength / 12) * (tileWidth / 12) * 0.092903;
  const floorAreaFt2 = floorAreaM2 * 10.7639;
  const netTiles = floorAreaM2 / tileAreaM2;
  const totalTiles = Math.ceil(netTiles * (1 + waste / 100));
  const boxes = tilesPerBox > 0 ? Math.ceil(totalTiles / tilesPerBox) : null;

  return {
    waste,
    floorAreaM2,
    floorAreaFt2,
    netTiles,
    totalTiles,
    boxes,
  };
}

export type GravelInputs = {
  unit: UnitSystem;
  length: number;
  width: number;
  depth: number;
  wastePercent: number;
  densityTonnePerM3: number;
};

export function calculateGravel(inputs: GravelInputs) {
  const length = safeNumber(inputs.length);
  const width = safeNumber(inputs.width);
  const depth = safeNumber(inputs.depth);
  const waste = clamp(safeNumber(inputs.wastePercent), 0, 30);
  const density = safeNumber(inputs.densityTonnePerM3) || 1.6;

  if (length <= 0 || width <= 0 || depth <= 0) {
    return null;
  }

  const volumeM3 =
    inputs.unit === "metric"
      ? length * width * (depth / 100)
      : length * width * (depth / 12) * FT3_TO_M3;
  const volumeFt3 = volumeM3 * M3_TO_FT3;
  const volumeWithWasteM3 = volumeM3 * (1 + waste / 100);
  const tonnes = volumeWithWasteM3 * density;

  return {
    waste,
    volumeM3,
    volumeFt3,
    volumeWithWasteM3,
    cubicYards: volumeWithWasteM3 * 1.30795,
    tonnes,
    kilograms: tonnes * 1000,
    usTons: tonnes * 1.10231,
  };
}

export type DrywallInputs = {
  unit: UnitSystem;
  roomLength: number;
  roomWidth: number;
  wallHeight: number;
  includeCeiling: boolean;
  wastePercent: number;
  sheetLength: number;
  sheetWidth: number;
};

export function calculateDrywall(inputs: DrywallInputs) {
  const roomLength = safeNumber(inputs.roomLength);
  const roomWidth = safeNumber(inputs.roomWidth);
  const wallHeight = safeNumber(inputs.wallHeight);
  const waste = clamp(safeNumber(inputs.wastePercent), 0, 25);
  const sheetLength = safeNumber(inputs.sheetLength);
  const sheetWidth = safeNumber(inputs.sheetWidth);

  if (roomLength <= 0 || roomWidth <= 0 || wallHeight <= 0 || sheetLength <= 0 || sheetWidth <= 0) {
    return null;
  }

  const wallArea = 2 * (roomLength + roomWidth) * wallHeight;
  const ceilingArea = inputs.includeCeiling ? roomLength * roomWidth : 0;
  const totalArea = wallArea + ceilingArea;
  const areaM2 = inputs.unit === "metric" ? totalArea : totalArea * 0.092903;
  const areaFt2 = inputs.unit === "metric" ? totalArea * 10.7639 : totalArea;
  const sheetArea = sheetLength * sheetWidth;
  const netSheets = totalArea / sheetArea;
  const totalSheets = Math.ceil(netSheets * (1 + waste / 100));

  return {
    waste,
    areaM2,
    areaFt2,
    netSheets,
    totalSheets,
  };
}

export type RoofingInputs = {
  unit: UnitSystem;
  length: number;
  width: number;
  slopeDegrees: number;
  wastePercent: number;
  bundleValue: number;
};

export function calculateRoofing(inputs: RoofingInputs) {
  const length = safeNumber(inputs.length);
  const width = safeNumber(inputs.width);
  const slopeDegrees = Math.max(0, safeNumber(inputs.slopeDegrees));
  const waste = clamp(safeNumber(inputs.wastePercent), 0, 25);
  const bundleValue = safeNumber(inputs.bundleValue);

  if (length <= 0 || width <= 0) {
    return null;
  }

  const planArea = length * width;
  const theta = (slopeDegrees * Math.PI) / 180;
  const cosTheta = Math.cos(theta);
  const roofAreaNoWaste =
    slopeDegrees > 0 && cosTheta > 0 ? planArea / cosTheta : planArea;
  const areaWithWaste = roofAreaNoWaste * (1 + waste / 100);
  const areaM2 = inputs.unit === "metric" ? roofAreaNoWaste : roofAreaNoWaste * 0.092903;
  const areaFt2 = inputs.unit === "metric" ? roofAreaNoWaste * 10.7639 : roofAreaNoWaste;
  const squaresWithWaste =
    (inputs.unit === "metric" ? areaWithWaste * 10.7639 : areaWithWaste) / 100;
  const bundlesWithWaste =
    bundleValue > 0
      ? inputs.unit === "metric"
        ? areaWithWaste / bundleValue
        : squaresWithWaste * bundleValue
      : null;

  return {
    waste,
    areaM2,
    areaFt2,
    areaWithWaste,
    squaresWithWaste,
    bundlesWithWaste: bundlesWithWaste ? Math.ceil(bundlesWithWaste) : null,
  };
}

export type FlooringInputs = {
  unit: UnitSystem;
  length: number;
  width: number;
  extraArea: number;
  wastePercent: number;
  coveragePerBox: number;
};

export function calculateFlooring(inputs: FlooringInputs) {
  const length = safeNumber(inputs.length);
  const width = safeNumber(inputs.width);
  const extraArea = Math.max(0, safeNumber(inputs.extraArea));
  const waste = clamp(safeNumber(inputs.wastePercent), 0, 20);
  const coveragePerBox = safeNumber(inputs.coveragePerBox);

  if (length <= 0 || width <= 0) {
    return null;
  }

  const baseArea = length * width;
  const totalArea = baseArea + extraArea;
  const areaM2 = inputs.unit === "metric" ? totalArea : totalArea * 0.092903;
  const areaFt2 = inputs.unit === "metric" ? totalArea * 10.7639 : totalArea;
  const areaWithWaste = totalArea * (1 + waste / 100);
  const boxes =
    coveragePerBox > 0 ? Math.ceil(areaWithWaste / coveragePerBox) : null;

  return {
    waste,
    areaM2,
    areaFt2,
    areaWithWaste,
    boxes,
  };
}

export type AsphaltInputs = {
  unit: UnitSystem;
  length: number;
  width: number;
  depth: number;
  wastePercent: number;
  densityTonnePerM3: number;
};

export function calculateAsphalt(inputs: AsphaltInputs) {
  const length = safeNumber(inputs.length);
  const width = safeNumber(inputs.width);
  const depth = safeNumber(inputs.depth);
  const waste = clamp(safeNumber(inputs.wastePercent), 0, 20);
  const defaultDensity = 2.4;
  const density =
    inputs.unit === "metric"
      ? Math.max(1, safeNumber(inputs.densityTonnePerM3) || defaultDensity)
      : safeNumber(inputs.densityTonnePerM3) < 10
        ? defaultDensity
        : safeNumber(inputs.densityTonnePerM3);

  if (length <= 0 || width <= 0 || depth <= 0) {
    return null;
  }

  const volumeM3 =
    inputs.unit === "metric"
      ? length * width * (depth / 100)
      : length * width * (depth / 12) * FT3_TO_M3;
  const volumeFt3 = volumeM3 * M3_TO_FT3;
  const volumeWithWaste = volumeM3 * (1 + waste / 100);
  const tonnes = volumeWithWaste * density;

  return {
    waste,
    volumeM3,
    volumeFt3,
    volumeWithWaste,
    cubicYards: volumeWithWaste * 1.30795,
    tonnes,
    kilograms: tonnes * 1000,
    usTons: tonnes * 1.10231,
    truckLoads: Math.ceil(tonnes / 10),
  };
}

export type FencePostInputs = {
  unit: UnitSystem;
  fenceLength: number;
  spacing: number;
  holeDiameter: number;
  holeDepth: number;
  wastePercent: number;
  bagYield: number;
};

export function calculateFencePost(inputs: FencePostInputs) {
  const fenceLength = safeNumber(inputs.fenceLength);
  const spacing = safeNumber(inputs.spacing);
  const holeDiameter = safeNumber(inputs.holeDiameter);
  const holeDepth = safeNumber(inputs.holeDepth);
  const waste = clamp(safeNumber(inputs.wastePercent), 0, 25);
  const bagYield = safeNumber(inputs.bagYield);

  if (fenceLength <= 0 || spacing <= 0 || holeDiameter <= 0 || holeDepth <= 0) {
    return null;
  }

  const spaces = fenceLength / spacing;
  const posts = Math.max(2, Math.floor(spaces) + 1);
  const volumePerHoleM3 =
    inputs.unit === "metric"
      ? Math.PI * ((holeDiameter / 100) / 2) ** 2 * (holeDepth / 100)
      : Math.PI * ((holeDiameter / 12) / 2) ** 2 * (holeDepth / 12) * FT3_TO_M3;
  const totalVolumeM3 = volumePerHoleM3 * posts;
  const totalVolumeWithWaste = totalVolumeM3 * (1 + waste / 100);
  const totalVolumeFt3 = totalVolumeM3 * M3_TO_FT3;
  const bags =
    bagYield > 0
      ? inputs.unit === "metric"
        ? Math.ceil(totalVolumeWithWaste / bagYield)
        : Math.ceil((totalVolumeFt3 * (1 + waste / 100)) / bagYield)
      : null;

  return {
    waste,
    posts,
    volumePerHoleM3,
    totalVolumeM3,
    totalVolumeWithWaste,
    totalVolumeFt3,
    bags,
  };
}

export type BrickInputs = {
  unit: UnitSystem;
  wallLength: number;
  wallHeight: number;
  bricksPerArea: number;
  wastePercent: number;
  bricksPerPallet: number;
};

export function calculateBrick(inputs: BrickInputs) {
  const wallLength = safeNumber(inputs.wallLength);
  const wallHeight = safeNumber(inputs.wallHeight);
  const bricksPerArea =
    safeNumber(inputs.bricksPerArea) || (inputs.unit === "metric" ? 60 : 7.5);
  const waste = clamp(safeNumber(inputs.wastePercent), 0, 20);
  const bricksPerPallet = safeNumber(inputs.bricksPerPallet);

  if (wallLength <= 0 || wallHeight <= 0) {
    return null;
  }

  const area = wallLength * wallHeight;
  const areaM2 = inputs.unit === "metric" ? area : area * 0.092903;
  const areaFt2 = inputs.unit === "metric" ? area * 10.7639 : area;
  const netBricks = area * bricksPerArea;
  const totalBricks = Math.ceil(netBricks * (1 + waste / 100));
  const pallets =
    bricksPerPallet > 0 ? Math.ceil(totalBricks / bricksPerPallet) : null;

  return {
    waste,
    areaM2,
    areaFt2,
    netBricks,
    totalBricks,
    pallets,
  };
}
