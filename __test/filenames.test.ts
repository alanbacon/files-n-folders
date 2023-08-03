import { describe, expect, it } from "@jest/globals";
import { PathString, Filenames } from "../src";

describe("PathString", () => {
  it("should sort filenames", () => {
    const ps1 = new PathString("/path/to/filename (11).ext");
    const ps2 = new PathString("/path/to/filename.ext");
    const ps3 = new PathString("/path/to/filename (1).ext");
    const ps4 = new PathString("/path/to/filename.ext");
    const filenames = new Filenames(ps1, ps2, ps3, ps4);
    const sortedFilenames = filenames.sort();
    for (let i = 0; i++; i < 4) {
      expect(sortedFilenames[i]).toEqual(filenames[i]);
    }

    expect(sortedFilenames[0]._lt_(sortedFilenames[1])).toBe(false); // these 2 are equal
    expect(sortedFilenames[1]._lt_(sortedFilenames[0])).toBe(false); // these 2 are equal
    expect(sortedFilenames[1]._lt_(sortedFilenames[2])).toBe(true);
    expect(sortedFilenames[2]._lt_(sortedFilenames[3])).toBe(true);
  });

  it("should accept plain strings to push method", () => {
    const filenames = new Filenames();
    const ps = new PathString("/is/path.string");
    filenames.push(...["/plain/string/filename", "another.plainstring", ps]);
    expect(filenames[0] instanceof PathString).toBe(true);
    expect(filenames[1] instanceof PathString).toBe(true);
  });
});
