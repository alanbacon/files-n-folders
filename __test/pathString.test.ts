import { describe, expect, it } from "@jest/globals";
import { PathString } from "../src";

describe("PathString", () => {
  it("should split path", () => {
    const ps = new PathString("/path/to/file.ext");
    expect(ps.isPathStyle).toEqual(false);
    expect(ps.path).toEqual("/path/to/");
    expect(ps.filename).toEqual("file");
    expect(ps.extention).toEqual("ext");
    expect(ps.directoryName).toEqual("to");
    expect(ps.toString()).toEqual("/path/to/file.ext");
  });

  it("should return no filename or ext", () => {
    const ps = new PathString("/path/to.path/");
    expect(ps.isPathStyle).toEqual(true);
    expect(ps.path).toEqual("/path/to.path/");
    expect(ps.filename).toEqual("");
    expect(ps.extention).toEqual("");
    expect(ps.directoryName).toEqual("to.path");
  });

  it("should return no extention", () => {
    const ps = new PathString("/path/to/filename");
    expect(ps.isPathStyle).toEqual(false);
    expect(ps.path).toEqual("/path/to/");
    expect(ps.filename).toEqual("filename");
    expect(ps.extention).toEqual("");
    expect(ps.directoryName).toEqual("to");
  });

  it("should return no file but an extention", () => {
    const ps = new PathString("/path/to/.bashrc");
    expect(ps.isPathStyle).toEqual(false);
    expect(ps.path).toEqual("/path/to/");
    expect(ps.filename).toEqual("");
    expect(ps.extention).toEqual("bashrc");
    expect(ps.directoryName).toEqual("to");
  });

  it("should return no filename with a dot", () => {
    const ps = new PathString("/path/to/.inactive.bashrc");
    expect(ps.isPathStyle).toEqual(false);
    expect(ps.path).toEqual("/path/to/");
    expect(ps.filename).toEqual(".inactive");
    expect(ps.extention).toEqual("bashrc");
    expect(ps.directoryName).toEqual("to");
  });

  it("should return no path", () => {
    const ps = new PathString("file.ext");
    expect(ps.isPathStyle).toEqual(false);
    expect(ps.path).toEqual("");
    expect(ps.directoryName).toEqual("");
  });

  it("should return root path", () => {
    const ps = new PathString("/file.ext");
    expect(ps.isPathStyle).toEqual(false);
    expect(ps.path).toEqual("/");
    expect(ps.directoryName).toEqual("");
  });

  it("should return exists as false", () => {
    const ps = new PathString("/noexist.ext");
    expect(ps.exists()).toEqual(false);
  });

  it("should return exists as true", () => {
    const ps = new PathString(`${__dirname}/pathString.test.ts`);
    expect(ps.exists()).toEqual(true);
  });

  it("should return isFile as true", () => {
    const ps = new PathString(`${__dirname}/pathString.test.ts`);
    expect(ps.isFile()).toEqual(true);
    expect(ps.isDirectory()).toEqual(false);
  });

  it("should return isDir as true", () => {
    const ps = new PathString(`${__dirname}`);
    expect(ps.isFile()).toEqual(false);
    expect(ps.isDirectory()).toEqual(true);
  });

  it("should return isDir and isFile as false if not exist", () => {
    const ps = new PathString(`/noexist`);
    expect(ps.isFile()).toEqual(false);
    expect(ps.isDirectory()).toEqual(false);
  });

  describe("relative path", () => {
    it("should return subdir", () => {
      const common = new PathString("path/to/");
      const path = new PathString("path/to/filename");
      const relative = path.getPathRelativeTo(common);
      expect(relative.toString()).toEqual("./filename");
    });

    it("should return cousin dir", () => {
      const common = new PathString("path/to/");
      const path = new PathString("path/to2/filename");
      const relative = path.getPathRelativeTo(common);
      expect(relative.toString()).toEqual("../to2/filename");
    });

    it("should throw error if common path is not path like", () => {
      const common = new PathString("path/to");
      const path = new PathString("path/to2/filename");
      expect(() => path.getPathRelativeTo(common)).toThrow(
        "other path must have trailing slash"
      );
    });

    it("should throw error if common path is not common", () => {
      const common = new PathString("path2/to/");
      const path = new PathString("path/to2/filename");
      expect(() => path.getPathRelativeTo(common)).toThrow(
        "relative paths can only be calculated from paths with a common root"
      );
    });
  });

  describe("_lt_", () => {
    it("filenames should be ordered correctly", () => {
      const self = new PathString("file (1).ext");
      const other = new PathString("file (11).ext");
      expect(self._lt_(other)).toBe(true);
    });

    it("should sort shorter folders first", () => {
      // use weirdness with extentions to get full code coverage
      const self = new PathString("/path/to.much");
      const other = new PathString("/path/to/much/longer");
      expect(self._lt_(other)).toBe(true);
    });

    it("should sort longer folders second", () => {
      // use weirdness with extentions to get full code coverage
      const self = new PathString("/path/to/longer");
      const other = new PathString("/path.to");
      expect(self._lt_(other)).toBe(false);
    });

    it("should sort longer foldernames second", () => {
      const self = new PathString("/path/a1b2/filename");
      const other = new PathString("/path/a1/filename");
      expect(self._lt_(other)).toBe(false);
    });

    it("should sort numeric foldernames first", () => {
      const self = new PathString("/path/1a2b");
      const other = new PathString("/path/a1b2");
      expect(self._lt_(other)).toBe(true);
    });

    it("should sort default to classic sort if numeric sections are numerically the same", () => {
      const self = new PathString("/path02");
      const other = new PathString("/path2");
      expect(self._lt_(other)).toBe(true);
    });

    it("should sort longer filenames second", () => {
      const self = new PathString("/path/to/filename.ext");
      const other = new PathString("/path/to/filename (1).ext");
      expect(self._lt_(other)).toBe(true);
    });
  });

  describe("appendPath", () => {
    it("should append paths and files", () => {
      const self = new PathString("/path/to/");
      const other = new PathString("./anotherPath/filename.ext");
      const joined = self.appendPath(other);
      expect(joined.toString()).toEqual("/path/to/anotherPath/filename.ext");
    });

    it("should append paths", () => {
      const self = new PathString("/path/to/");
      const other = new PathString("./anotherPath/");
      const joined = self.appendPath(other);
      expect(joined.toString()).toEqual("/path/to/anotherPath/");
    });

    it("should append remove double dots", () => {
      const self = new PathString("/path/to/");
      const other = new PathString("../anotherPath/");
      const joined = self.appendPath(other);
      expect(joined.toString()).toEqual("/path/anotherPath/");
    });
  });
});
