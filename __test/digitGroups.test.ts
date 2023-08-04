import { describe, expect, it } from "@jest/globals";
import { getDigitGroups } from "../src/pathString/digitGroup.js";

describe("DigitGroups", () => {
  it("should split strings that start and end in digits", () => {
    const str = "1a2b3";
    const parts = getDigitGroups(str);
    expect(parts).toEqual([1, "a", 2, "b", 3]);
  });

  it("should split strings that start and end in non-digits", () => {
    const str = "a2b";
    const parts = getDigitGroups(str);
    expect(parts).toEqual(["a", 2, "b"]);
  });

  it("should split strings that start in digits and end in non-digits", () => {
    const str = "1a2b";
    const parts = getDigitGroups(str);
    expect(parts).toEqual([1, "a", 2, "b"]);
  });

  it("should split strings that start in non-digits and end in digits", () => {
    const str = "a2b3";
    const parts = getDigitGroups(str);
    expect(parts).toEqual(["a", 2, "b", 3]);
  });

  it("should not split strings only contain digits", () => {
    const str = "23";
    const parts = getDigitGroups(str);
    expect(parts).toEqual([23]);
  });

  it("should not split strings only contain non-digits", () => {
    const str = "ab";
    const parts = getDigitGroups(str);
    expect(parts).toEqual(["ab"]);
  });

  it("should return an empty string if given an empty string", () => {
    const str = "";
    const parts = getDigitGroups(str);
    expect(parts).toEqual([""]);
  });
});
