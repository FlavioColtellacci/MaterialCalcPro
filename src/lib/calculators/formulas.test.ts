import { describe, expect, it } from "vitest";
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
} from "./formulas";

describe("calculator formula parity", () => {
  it("matches concrete script output", () => {
    const result = calculateConcrete({
      unit: "metric",
      length: 3,
      width: 2,
      depth: 10,
      wastePercent: 10,
      bagSizeKg: 25,
    });
    expect(result).not.toBeNull();
    expect(result?.volumeM3).toBeCloseTo(0.6, 5);
    expect(result?.bags).toBe(61);
  });

  it("matches paint script output", () => {
    const result = calculatePaint({
      unit: "metric",
      length: 4,
      width: 3,
      height: 2.4,
      coats: 2,
      doorsArea: 1.9,
      windowsArea: 2.5,
      coverage: 10,
    });
    expect(result).not.toBeNull();
    expect(result?.areaM2).toBeCloseTo(58.4, 5);
    expect(result?.liters).toBeCloseTo(5.84, 5);
  });

  it("matches tile script output", () => {
    const result = calculateTile({
      unit: "metric",
      roomLength: 4,
      roomWidth: 3,
      tileLength: 60,
      tileWidth: 30,
      wastePercent: 10,
      tilesPerBox: 12,
    });
    expect(result).not.toBeNull();
    expect(result?.totalTiles).toBe(74);
    expect(result?.boxes).toBe(7);
  });

  it("matches gravel script output", () => {
    const result = calculateGravel({
      unit: "metric",
      length: 5,
      width: 3,
      depth: 5,
      wastePercent: 10,
      densityTonnePerM3: 1.6,
    });
    expect(result).not.toBeNull();
    expect(result?.volumeM3).toBeCloseTo(0.75, 5);
    expect(result?.tonnes).toBeCloseTo(1.32, 5);
  });

  it("matches drywall script output", () => {
    const result = calculateDrywall({
      unit: "metric",
      roomLength: 4,
      roomWidth: 3,
      wallHeight: 2.4,
      includeCeiling: true,
      wastePercent: 10,
      sheetLength: 2.4,
      sheetWidth: 1.2,
    });
    expect(result).not.toBeNull();
    expect(result?.areaM2).toBeCloseTo(45.6, 5);
    expect(result?.totalSheets).toBe(18);
  });

  it("matches roofing script output", () => {
    const result = calculateRoofing({
      unit: "metric",
      length: 10,
      width: 6,
      slopeDegrees: 30,
      wastePercent: 10,
      bundleValue: 3,
    });
    expect(result).not.toBeNull();
    expect(result?.areaM2).toBeCloseTo(69.282, 3);
    expect(result?.bundlesWithWaste).toBe(26);
  });

  it("matches flooring script output", () => {
    const result = calculateFlooring({
      unit: "metric",
      length: 5,
      width: 4,
      extraArea: 2,
      wastePercent: 10,
      coveragePerBox: 2,
    });
    expect(result).not.toBeNull();
    expect(result?.areaM2).toBeCloseTo(22, 5);
    expect(result?.boxes).toBe(13);
  });

  it("matches asphalt script output", () => {
    const result = calculateAsphalt({
      unit: "metric",
      length: 10,
      width: 4,
      depth: 5,
      wastePercent: 10,
      densityTonnePerM3: 2.4,
    });
    expect(result).not.toBeNull();
    expect(result?.volumeM3).toBeCloseTo(2, 5);
    expect(result?.truckLoads).toBe(1);
  });

  it("matches fence post script output", () => {
    const result = calculateFencePost({
      unit: "metric",
      fenceLength: 20,
      spacing: 2.5,
      holeDiameter: 30,
      holeDepth: 60,
      wastePercent: 10,
      bagYield: 0.02,
    });
    expect(result).not.toBeNull();
    expect(result?.posts).toBe(9);
    expect(result?.bags).toBe(21);
  });

  it("matches brick script output", () => {
    const result = calculateBrick({
      unit: "metric",
      wallLength: 5,
      wallHeight: 2.4,
      bricksPerArea: 60,
      wastePercent: 10,
      bricksPerPallet: 500,
    });
    expect(result).not.toBeNull();
    expect(result?.totalBricks).toBe(793);
    expect(result?.pallets).toBe(2);
  });
});
