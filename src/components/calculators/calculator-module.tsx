"use client";

import { useMemo, useState } from "react";
import type { WpRouteSlug } from "@/lib/content/wp-pages";
import {
  calculateAsphalt,
  calculateBrick,
  calculateConcrete,
  calculateDrywall,
  calculateFencePost,
  calculateFlooring,
  calculateGravel,
  calculatePaint,
  calculateRoofing,
  calculateTile,
  type UnitSystem,
} from "@/lib/calculators/formulas";

type CalculatorSlug = Exclude<WpRouteSlug, "home" | "privacy">;

type CalculatorModuleProps = {
  slug: CalculatorSlug;
};

function NumberInput(props: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
}) {
  return (
    <label className="mcp-field">
      <span>{props.label}</span>
      <input
        type="number"
        step={props.step ?? 0.01}
        value={Number.isFinite(props.value) ? props.value : 0}
        onChange={(event) => props.onChange(Number(event.target.value))}
      />
    </label>
  );
}

function UnitToggle({
  unit,
  onChange,
}: {
  unit: UnitSystem;
  onChange: (unit: UnitSystem) => void;
}) {
  return (
    <div className="mcp-unit-toggle">
      <label>
        <input
          type="radio"
          checked={unit === "metric"}
          onChange={() => onChange("metric")}
        />
        Metric
      </label>
      <label>
        <input
          type="radio"
          checked={unit === "imperial"}
          onChange={() => onChange("imperial")}
        />
        Imperial
      </label>
    </div>
  );
}

function ConcreteModule() {
  const [unit, setUnit] = useState<UnitSystem>("metric");
  const [length, setLength] = useState(3);
  const [width, setWidth] = useState(2);
  const [depth, setDepth] = useState(10);
  const [wastePercent, setWastePercent] = useState(10);
  const [bagSizeKg, setBagSizeKg] = useState<20 | 25 | 40>(25);

  const result = useMemo(
    () => calculateConcrete({ unit, length, width, depth, wastePercent, bagSizeKg }),
    [unit, length, width, depth, wastePercent, bagSizeKg],
  );

  return (
    <>
      <UnitToggle unit={unit} onChange={setUnit} />
      <div className="mcp-calc-grid">
        <NumberInput label={`Length (${unit === "metric" ? "m" : "ft"})`} value={length} onChange={setLength} />
        <NumberInput label={`Width (${unit === "metric" ? "m" : "ft"})`} value={width} onChange={setWidth} />
        <NumberInput label={`Depth (${unit === "metric" ? "cm" : "in"})`} value={depth} onChange={setDepth} />
        <NumberInput label="Waste (%)" value={wastePercent} onChange={setWastePercent} step={1} />
        <label className="mcp-field">
          <span>Bag size</span>
          <select value={bagSizeKg} onChange={(e) => setBagSizeKg(Number(e.target.value) as 20 | 25 | 40)}>
            <option value={20}>20 kg</option>
            <option value={25}>25 kg</option>
            <option value={40}>40 kg</option>
          </select>
        </label>
      </div>
      <div className="mcp-results">
        {result ? (
          <>
            <p>Net volume: {result.volumeM3.toFixed(3)} m3 ({result.volumeFt3.toFixed(1)} ft3)</p>
            <p>With waste: {result.volumeWithWasteM3.toFixed(3)} m3</p>
            <p>Estimated bags: {result.bags}</p>
          </>
        ) : (
          <p>Please enter all dimensions.</p>
        )}
      </div>
    </>
  );
}

function PaintModule() {
  const [unit, setUnit] = useState<UnitSystem>("metric");
  const [length, setLength] = useState(4);
  const [width, setWidth] = useState(3);
  const [height, setHeight] = useState(2.4);
  const [coats, setCoats] = useState(2);
  const [doorsArea, setDoorsArea] = useState(1.9);
  const [windowsArea, setWindowsArea] = useState(2.5);
  const [coverage, setCoverage] = useState(10);

  const result = useMemo(
    () => calculatePaint({ unit, length, width, height, coats, doorsArea, windowsArea, coverage }),
    [unit, length, width, height, coats, doorsArea, windowsArea, coverage],
  );

  return (
    <>
      <UnitToggle unit={unit} onChange={setUnit} />
      <div className="mcp-calc-grid">
        <NumberInput label={`Length (${unit === "metric" ? "m" : "ft"})`} value={length} onChange={setLength} />
        <NumberInput label={`Width (${unit === "metric" ? "m" : "ft"})`} value={width} onChange={setWidth} />
        <NumberInput label={`Height (${unit === "metric" ? "m" : "ft"})`} value={height} onChange={setHeight} />
        <NumberInput label="Coats" value={coats} onChange={setCoats} step={1} />
        <NumberInput label={`Doors area (${unit === "metric" ? "m2" : "ft2"})`} value={doorsArea} onChange={setDoorsArea} />
        <NumberInput label={`Windows area (${unit === "metric" ? "m2" : "ft2"})`} value={windowsArea} onChange={setWindowsArea} />
        <NumberInput label={`Coverage (${unit === "metric" ? "m2/L" : "ft2/gal"})`} value={coverage} onChange={setCoverage} />
      </div>
      <div className="mcp-results">
        {result ? (
          <>
            <p>Total area: {result.areaM2.toFixed(2)} m2 ({result.areaFt2.toFixed(0)} ft2)</p>
            <p>Paint required: {result.liters.toFixed(2)} L ({result.gallons.toFixed(2)} gal)</p>
            <p>Recommended: {result.recommendedLiters.toFixed(1)} L (~{result.recommendedGallons.toFixed(2)} gal)</p>
          </>
        ) : (
          <p>Please enter room size and coverage.</p>
        )}
      </div>
    </>
  );
}

function TileModule() {
  const [unit, setUnit] = useState<UnitSystem>("metric");
  const [roomLength, setRoomLength] = useState(4);
  const [roomWidth, setRoomWidth] = useState(3);
  const [tileLength, setTileLength] = useState(60);
  const [tileWidth, setTileWidth] = useState(30);
  const [wastePercent, setWastePercent] = useState(10);
  const [tilesPerBox, setTilesPerBox] = useState(12);
  const result = useMemo(
    () =>
      calculateTile({
        unit,
        roomLength,
        roomWidth,
        tileLength,
        tileWidth,
        wastePercent,
        tilesPerBox,
      }),
    [unit, roomLength, roomWidth, tileLength, tileWidth, wastePercent, tilesPerBox],
  );
  return (
    <>
      <UnitToggle unit={unit} onChange={setUnit} />
      <div className="mcp-calc-grid">
        <NumberInput label={`Room length (${unit === "metric" ? "m" : "ft"})`} value={roomLength} onChange={setRoomLength} />
        <NumberInput label={`Room width (${unit === "metric" ? "m" : "ft"})`} value={roomWidth} onChange={setRoomWidth} />
        <NumberInput label={`Tile length (${unit === "metric" ? "cm" : "in"})`} value={tileLength} onChange={setTileLength} />
        <NumberInput label={`Tile width (${unit === "metric" ? "cm" : "in"})`} value={tileWidth} onChange={setTileWidth} />
        <NumberInput label="Waste (%)" value={wastePercent} onChange={setWastePercent} step={1} />
        <NumberInput label="Tiles per box" value={tilesPerBox} onChange={setTilesPerBox} step={1} />
      </div>
      <div className="mcp-results">
        {result ? (
          <>
            <p>Floor area: {result.floorAreaM2.toFixed(2)} m2 ({result.floorAreaFt2.toFixed(0)} ft2)</p>
            <p>Net tiles: {Math.ceil(result.netTiles)}</p>
            <p>Total tiles with waste: {result.totalTiles}</p>
            {result.boxes ? <p>Estimated boxes: {result.boxes}</p> : null}
          </>
        ) : (
          <p>Please enter floor and tile size.</p>
        )}
      </div>
    </>
  );
}

function GravelModule() {
  const [unit, setUnit] = useState<UnitSystem>("metric");
  const [length, setLength] = useState(5);
  const [width, setWidth] = useState(3);
  const [depth, setDepth] = useState(5);
  const [wastePercent, setWastePercent] = useState(10);
  const [densityTonnePerM3, setDensityTonnePerM3] = useState(1.6);
  const result = useMemo(
    () => calculateGravel({ unit, length, width, depth, wastePercent, densityTonnePerM3 }),
    [unit, length, width, depth, wastePercent, densityTonnePerM3],
  );
  return (
    <>
      <UnitToggle unit={unit} onChange={setUnit} />
      <div className="mcp-calc-grid">
        <NumberInput label={`Length (${unit === "metric" ? "m" : "ft"})`} value={length} onChange={setLength} />
        <NumberInput label={`Width (${unit === "metric" ? "m" : "ft"})`} value={width} onChange={setWidth} />
        <NumberInput label={`Depth (${unit === "metric" ? "cm" : "in"})`} value={depth} onChange={setDepth} />
        <NumberInput label="Waste (%)" value={wastePercent} onChange={setWastePercent} step={1} />
        <NumberInput label="Density (t/m3)" value={densityTonnePerM3} onChange={setDensityTonnePerM3} />
      </div>
      <div className="mcp-results">
        {result ? (
          <>
            <p>Net volume: {result.volumeM3.toFixed(3)} m3 ({result.volumeFt3.toFixed(1)} ft3)</p>
            <p>With waste: {result.volumeWithWasteM3.toFixed(3)} m3 (~{result.cubicYards.toFixed(2)} yd3)</p>
            <p>Weight: {result.tonnes.toFixed(2)} t ({result.kilograms.toFixed(0)} kg)</p>
          </>
        ) : (
          <p>Please enter dimensions.</p>
        )}
      </div>
    </>
  );
}

function DrywallModule() {
  const [unit, setUnit] = useState<UnitSystem>("metric");
  const [roomLength, setRoomLength] = useState(4);
  const [roomWidth, setRoomWidth] = useState(3);
  const [wallHeight, setWallHeight] = useState(2.4);
  const [includeCeiling, setIncludeCeiling] = useState(true);
  const [wastePercent, setWastePercent] = useState(10);
  const [sheetLength, setSheetLength] = useState(2.4);
  const [sheetWidth, setSheetWidth] = useState(1.2);
  const result = useMemo(
    () =>
      calculateDrywall({
        unit,
        roomLength,
        roomWidth,
        wallHeight,
        includeCeiling,
        wastePercent,
        sheetLength,
        sheetWidth,
      }),
    [unit, roomLength, roomWidth, wallHeight, includeCeiling, wastePercent, sheetLength, sheetWidth],
  );
  return (
    <>
      <UnitToggle unit={unit} onChange={setUnit} />
      <div className="mcp-calc-grid">
        <NumberInput label={`Room length (${unit === "metric" ? "m" : "ft"})`} value={roomLength} onChange={setRoomLength} />
        <NumberInput label={`Room width (${unit === "metric" ? "m" : "ft"})`} value={roomWidth} onChange={setRoomWidth} />
        <NumberInput label={`Wall height (${unit === "metric" ? "m" : "ft"})`} value={wallHeight} onChange={setWallHeight} />
        <NumberInput label="Sheet length" value={sheetLength} onChange={setSheetLength} />
        <NumberInput label="Sheet width" value={sheetWidth} onChange={setSheetWidth} />
        <NumberInput label="Waste (%)" value={wastePercent} onChange={setWastePercent} step={1} />
        <label className="mcp-field">
          <span>Include ceiling</span>
          <input type="checkbox" checked={includeCeiling} onChange={(e) => setIncludeCeiling(e.target.checked)} />
        </label>
      </div>
      <div className="mcp-results">
        {result ? (
          <>
            <p>Total area: {result.areaM2.toFixed(2)} m2 ({result.areaFt2.toFixed(0)} ft2)</p>
            <p>Net sheets: {Math.ceil(result.netSheets)}</p>
            <p>Total sheets with waste: {result.totalSheets}</p>
          </>
        ) : (
          <p>Please enter room and sheet size.</p>
        )}
      </div>
    </>
  );
}

function RoofingModule() {
  const [unit, setUnit] = useState<UnitSystem>("metric");
  const [length, setLength] = useState(10);
  const [width, setWidth] = useState(6);
  const [slopeDegrees, setSlopeDegrees] = useState(30);
  const [wastePercent, setWastePercent] = useState(10);
  const [bundleValue, setBundleValue] = useState(3);
  const result = useMemo(
    () => calculateRoofing({ unit, length, width, slopeDegrees, wastePercent, bundleValue }),
    [unit, length, width, slopeDegrees, wastePercent, bundleValue],
  );
  return (
    <>
      <UnitToggle unit={unit} onChange={setUnit} />
      <div className="mcp-calc-grid">
        <NumberInput label={`Length (${unit === "metric" ? "m" : "ft"})`} value={length} onChange={setLength} />
        <NumberInput label={`Width (${unit === "metric" ? "m" : "ft"})`} value={width} onChange={setWidth} />
        <NumberInput label="Slope (deg)" value={slopeDegrees} onChange={setSlopeDegrees} step={0.1} />
        <NumberInput label="Waste (%)" value={wastePercent} onChange={setWastePercent} step={1} />
        <NumberInput label={unit === "metric" ? "m2 per bundle" : "bundles per square"} value={bundleValue} onChange={setBundleValue} />
      </div>
      <div className="mcp-results">
        {result ? (
          <>
            <p>Roof area: {result.areaM2.toFixed(2)} m2 ({result.areaFt2.toFixed(0)} ft2)</p>
            <p>Roofing squares (with waste): {result.squaresWithWaste.toFixed(2)}</p>
            {result.bundlesWithWaste ? <p>Estimated bundles: {result.bundlesWithWaste}</p> : null}
          </>
        ) : (
          <p>Please enter dimensions.</p>
        )}
      </div>
    </>
  );
}

function FlooringModule() {
  const [unit, setUnit] = useState<UnitSystem>("metric");
  const [length, setLength] = useState(5);
  const [width, setWidth] = useState(4);
  const [extraArea, setExtraArea] = useState(2);
  const [wastePercent, setWastePercent] = useState(10);
  const [coveragePerBox, setCoveragePerBox] = useState(2);
  const result = useMemo(
    () => calculateFlooring({ unit, length, width, extraArea, wastePercent, coveragePerBox }),
    [unit, length, width, extraArea, wastePercent, coveragePerBox],
  );
  return (
    <>
      <UnitToggle unit={unit} onChange={setUnit} />
      <div className="mcp-calc-grid">
        <NumberInput label={`Length (${unit === "metric" ? "m" : "ft"})`} value={length} onChange={setLength} />
        <NumberInput label={`Width (${unit === "metric" ? "m" : "ft"})`} value={width} onChange={setWidth} />
        <NumberInput label={`Extra (${unit === "metric" ? "m2" : "ft2"})`} value={extraArea} onChange={setExtraArea} />
        <NumberInput label="Waste (%)" value={wastePercent} onChange={setWastePercent} step={1} />
        <NumberInput label={unit === "metric" ? "Coverage m2/box" : "Coverage ft2/box"} value={coveragePerBox} onChange={setCoveragePerBox} />
      </div>
      <div className="mcp-results">
        {result ? (
          <>
            <p>Area: {result.areaM2.toFixed(2)} m2 ({result.areaFt2.toFixed(0)} ft2)</p>
            <p>With waste: {result.areaWithWaste.toFixed(2)} {unit === "metric" ? "m2" : "ft2"}</p>
            {result.boxes ? <p>Estimated boxes: {result.boxes}</p> : null}
          </>
        ) : (
          <p>Please enter dimensions.</p>
        )}
      </div>
    </>
  );
}

function AsphaltModule() {
  const [unit, setUnit] = useState<UnitSystem>("metric");
  const [length, setLength] = useState(10);
  const [width, setWidth] = useState(4);
  const [depth, setDepth] = useState(5);
  const [wastePercent, setWastePercent] = useState(10);
  const [densityTonnePerM3, setDensityTonnePerM3] = useState(2.4);
  const result = useMemo(
    () => calculateAsphalt({ unit, length, width, depth, wastePercent, densityTonnePerM3 }),
    [unit, length, width, depth, wastePercent, densityTonnePerM3],
  );
  return (
    <>
      <UnitToggle unit={unit} onChange={setUnit} />
      <div className="mcp-calc-grid">
        <NumberInput label={`Length (${unit === "metric" ? "m" : "ft"})`} value={length} onChange={setLength} />
        <NumberInput label={`Width (${unit === "metric" ? "m" : "ft"})`} value={width} onChange={setWidth} />
        <NumberInput label={`Depth (${unit === "metric" ? "cm" : "in"})`} value={depth} onChange={setDepth} />
        <NumberInput label="Waste (%)" value={wastePercent} onChange={setWastePercent} step={1} />
        <NumberInput label="Density (t/m3)" value={densityTonnePerM3} onChange={setDensityTonnePerM3} />
      </div>
      <div className="mcp-results">
        {result ? (
          <>
            <p>Net volume: {result.volumeM3.toFixed(3)} m3 ({result.volumeFt3.toFixed(1)} ft3)</p>
            <p>With waste: {result.volumeWithWaste.toFixed(3)} m3 (~{result.cubicYards.toFixed(2)} yd3)</p>
            <p>Weight: {result.tonnes.toFixed(2)} t (~{result.usTons.toFixed(2)} US tons)</p>
            <p>Truck loads (10t): {result.truckLoads}</p>
          </>
        ) : (
          <p>Please enter dimensions.</p>
        )}
      </div>
    </>
  );
}

function FencePostModule() {
  const [unit, setUnit] = useState<UnitSystem>("metric");
  const [fenceLength, setFenceLength] = useState(20);
  const [spacing, setSpacing] = useState(2.5);
  const [holeDiameter, setHoleDiameter] = useState(30);
  const [holeDepth, setHoleDepth] = useState(60);
  const [wastePercent, setWastePercent] = useState(10);
  const [bagYield, setBagYield] = useState(0.02);
  const result = useMemo(
    () =>
      calculateFencePost({
        unit,
        fenceLength,
        spacing,
        holeDiameter,
        holeDepth,
        wastePercent,
        bagYield,
      }),
    [unit, fenceLength, spacing, holeDiameter, holeDepth, wastePercent, bagYield],
  );
  return (
    <>
      <UnitToggle unit={unit} onChange={setUnit} />
      <div className="mcp-calc-grid">
        <NumberInput label={`Fence length (${unit === "metric" ? "m" : "ft"})`} value={fenceLength} onChange={setFenceLength} />
        <NumberInput label={`Spacing (${unit === "metric" ? "m" : "ft"})`} value={spacing} onChange={setSpacing} />
        <NumberInput label={`Hole diameter (${unit === "metric" ? "cm" : "in"})`} value={holeDiameter} onChange={setHoleDiameter} />
        <NumberInput label={`Hole depth (${unit === "metric" ? "cm" : "in"})`} value={holeDepth} onChange={setHoleDepth} />
        <NumberInput label="Waste (%)" value={wastePercent} onChange={setWastePercent} step={1} />
        <NumberInput label={unit === "metric" ? "Bag yield m3/bag" : "Bag yield ft3/bag"} value={bagYield} onChange={setBagYield} step={0.001} />
      </div>
      <div className="mcp-results">
        {result ? (
          <>
            <p>Estimated posts: {result.posts}</p>
            <p>Per hole: {result.volumePerHoleM3.toFixed(3)} m3</p>
            <p>Total with waste: {result.totalVolumeWithWaste.toFixed(3)} m3</p>
            {result.bags ? <p>Recommended bags: {result.bags}</p> : null}
          </>
        ) : (
          <p>Please enter dimensions.</p>
        )}
      </div>
    </>
  );
}

function BrickModule() {
  const [unit, setUnit] = useState<UnitSystem>("metric");
  const [wallLength, setWallLength] = useState(5);
  const [wallHeight, setWallHeight] = useState(2.4);
  const [bricksPerArea, setBricksPerArea] = useState(60);
  const [wastePercent, setWastePercent] = useState(10);
  const [bricksPerPallet, setBricksPerPallet] = useState(500);
  const result = useMemo(
    () =>
      calculateBrick({
        unit,
        wallLength,
        wallHeight,
        bricksPerArea,
        wastePercent,
        bricksPerPallet,
      }),
    [unit, wallLength, wallHeight, bricksPerArea, wastePercent, bricksPerPallet],
  );
  return (
    <>
      <UnitToggle unit={unit} onChange={setUnit} />
      <div className="mcp-calc-grid">
        <NumberInput label={`Wall length (${unit === "metric" ? "m" : "ft"})`} value={wallLength} onChange={setWallLength} />
        <NumberInput label={`Wall height (${unit === "metric" ? "m" : "ft"})`} value={wallHeight} onChange={setWallHeight} />
        <NumberInput label={`Bricks/${unit === "metric" ? "m2" : "ft2"}`} value={bricksPerArea} onChange={setBricksPerArea} />
        <NumberInput label="Waste (%)" value={wastePercent} onChange={setWastePercent} step={1} />
        <NumberInput label="Bricks per pallet" value={bricksPerPallet} onChange={setBricksPerPallet} step={1} />
      </div>
      <div className="mcp-results">
        {result ? (
          <>
            <p>Wall area: {result.areaM2.toFixed(2)} m2 ({result.areaFt2.toFixed(0)} ft2)</p>
            <p>Net bricks: {Math.ceil(result.netBricks)}</p>
            <p>Total bricks with waste: {result.totalBricks}</p>
            {result.pallets ? <p>Estimated pallets: {result.pallets}</p> : null}
          </>
        ) : (
          <p>Please enter wall dimensions.</p>
        )}
      </div>
    </>
  );
}

const calculatorTitles: Record<CalculatorSlug, string> = {
  "concrete-calculator": "Concrete Slab Calculator",
  "paint-calculator": "Paint Calculator",
  "tile-calculator": "Tile Calculator",
  "gravel-calculator": "Gravel Calculator",
  "drywall-calculator": "Drywall Calculator",
  "roofing-calculator": "Roofing Shingles Calculator",
  "flooring-calculator": "Flooring Calculator",
  "asphalt-calculator": "Asphalt Calculator",
  "fence-post-calculator": "Fence Post Concrete Calculator",
  "brick-calculator": "Brick Wall Calculator",
};

export function CalculatorModule({ slug }: CalculatorModuleProps) {
  return (
    <section className="mcp-react-calculator pixl-shadow-block">
      <h2>{calculatorTitles[slug]}</h2>
      {slug === "concrete-calculator" ? <ConcreteModule /> : null}
      {slug === "paint-calculator" ? <PaintModule /> : null}
      {slug === "tile-calculator" ? <TileModule /> : null}
      {slug === "gravel-calculator" ? <GravelModule /> : null}
      {slug === "drywall-calculator" ? <DrywallModule /> : null}
      {slug === "roofing-calculator" ? <RoofingModule /> : null}
      {slug === "flooring-calculator" ? <FlooringModule /> : null}
      {slug === "asphalt-calculator" ? <AsphaltModule /> : null}
      {slug === "fence-post-calculator" ? <FencePostModule /> : null}
      {slug === "brick-calculator" ? <BrickModule /> : null}
    </section>
  );
}
