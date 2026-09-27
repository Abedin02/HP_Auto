import { describe, expect, test } from "bun:test";
import { RENDITION_WIDTHS } from "@/lib/storage-paths";
import { planRenditions } from "./rendition-plan";

describe("planRenditions", () => {
  test("keeps every rendition width when the original is larger than all of them", () => {
    const plan = planRenditions(2000, 1000);
    expect(plan.map(item => item.width)).toEqual([...RENDITION_WIDTHS]);
    // aspect ratio (height/width) preserved: 1000/2000 = 0.5
    expect(plan.map(item => item.height)).toEqual([240, 400, 600, 900]);
  });

  test("never upscales: widths above natural width are clamped to natural width", () => {
    const plan = planRenditions(600, 400);
    // min(480,600)=480, min(800,600)=600, min(1200,600)=600, min(1800,600)=600 -> dedupe to [480, 600]
    expect(plan.map(item => item.width)).toEqual([480, 600]);
  });

  test("dedupes widths after clamping and keeps ascending order", () => {
    const plan = planRenditions(100, 200);
    expect(plan.map(item => item.width)).toEqual([100]);
    expect(plan[0]?.height).toBe(200);
  });

  test("rounds derived heights to the nearest pixel", () => {
    const plan = planRenditions(900, 601);
    // aspect = 601/900
    const widths = plan.map(item => item.width);
    expect(widths).toEqual([480, 800, 900]);
    for (const item of plan) {
      expect(Number.isInteger(item.height)).toBe(true);
    }
  });

  test("returns an empty plan for non-positive dimensions", () => {
    expect(planRenditions(0, 100)).toEqual([]);
    expect(planRenditions(100, 0)).toEqual([]);
    expect(planRenditions(-10, 100)).toEqual([]);
    expect(planRenditions(100, -10)).toEqual([]);
  });

  test("handles a square image without distorting aspect", () => {
    const plan = planRenditions(1800, 1800);
    for (const item of plan) {
      expect(item.height).toBe(item.width);
    }
  });
});
