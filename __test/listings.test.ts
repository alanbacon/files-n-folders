import { describe, expect, it } from "@jest/globals";
import { listFiles, PathString, Filenames } from "../src";
import * as path from "path";
import * as fs from "fs";

const TEST_FOLDER = path.resolve(__dirname, "listingsTestFilesAndFolders");

function compareExpectedPaths(filenames: Filenames, expected: string[]) {
  expect(filenames.length).toEqual(expected.length);

  for (let i = 0; i < filenames.length; i++) {
    expect(filenames[i].toString()).toEqual(expected[i]);
  }
}

describe("PathString", () => {
  it("should error if the root is not a directory", async () => {
    const failingAsyncFunc = async () =>
      await listFiles(new PathString("/no-exist/"));

    await expect(failingAsyncFunc).rejects.toEqual(
      new Error("/no-exist/ isn't a directory")
    );
  });

  it("should get file and folder from the top level", async () => {
    const expected = [
      ".systemFile",
      ".systemFolder",
      "file1Level0.ext",
      "regularFolderLevel1",
    ];

    const filenames = await listFiles(new PathString(TEST_FOLDER));
    filenames.sort();

    compareExpectedPaths(filenames, expected);
  });

  it("should get file and folder recursively", async () => {
    const expected = [
      "./",
      "./.systemFile",
      "./.systemFolder/",
      "./.systemFolder/fileInSystemFolder",
      "./.systemFolder/somethingElse",
      "./file1Level0.ext",
      "./regularFolderLevel1/",
      "./regularFolderLevel1/file1Level1.ext",
      "./regularFolderLevel1/file2Level1.ext2",
      "./regularFolderLevel1/regularFolderLevel2/",
      "./regularFolderLevel1/regularFolderLevel2/differentName.ext",
      "./regularFolderLevel1/regularFolderLevel2/file1Level2.ext3",
      "./regularFolderLevel1/regularFolderLevel2/file2Level2.ext4",
    ];

    const filenames = await listFiles(new PathString(TEST_FOLDER), {
      recursive: true,
      relativePath: true,
    });
    filenames.sort();

    compareExpectedPaths(filenames, expected);
  });

  it("should get only return files with a .ext extension", async () => {
    const expected = [
      "./file1Level0.ext",
      "./regularFolderLevel1/file1Level1.ext",
      "./regularFolderLevel1/regularFolderLevel2/differentName.ext",
    ];

    const filenames = await listFiles(new PathString(TEST_FOLDER), {
      recursive: true,
      relativePath: true,
      extentions: ["ext"],
    });
    filenames.sort();

    compareExpectedPaths(filenames, expected);
  });

  it("should ignore extentions options if it's an empty list", async () => {
    const expected = [
      ".systemFile",
      ".systemFolder",
      "file1Level0.ext",
      "regularFolderLevel1",
    ];

    const filenames = await listFiles(new PathString(TEST_FOLDER), {
      extentions: [],
    });
    filenames.sort();

    compareExpectedPaths(filenames, expected);
  });

  it("should ignore system files and folder", async () => {
    const expected = [
      "./",
      "./file1Level0.ext",
      "./regularFolderLevel1/",
      "./regularFolderLevel1/file1Level1.ext",
      "./regularFolderLevel1/file2Level1.ext2",
      "./regularFolderLevel1/regularFolderLevel2/",
      "./regularFolderLevel1/regularFolderLevel2/differentName.ext",
      "./regularFolderLevel1/regularFolderLevel2/file1Level2.ext3",
      "./regularFolderLevel1/regularFolderLevel2/file2Level2.ext4",
    ];

    const filenames = await listFiles(new PathString(TEST_FOLDER), {
      recursive: true,
      relativePath: true,
      excludeSystemFiles: true,
    });
    filenames.sort();

    compareExpectedPaths(filenames, expected);
  });

  it("should return only the paths that match", async () => {
    const expected = [
      "./regularFolderLevel1/regularFolderLevel2/differentName.ext",
    ];

    const filenames = await listFiles(new PathString(TEST_FOLDER), {
      recursive: true,
      relativePath: true,
      includePatterns: [/Name/],
    });
    filenames.sort();

    expect(filenames.length).toEqual(expected.length);

    for (let i = 0; i < filenames.length; i++) {
      expect(filenames[i].toString()).toEqual(expected[i]);
    }
  });

  it("should return combination of matching paths", async () => {
    const expected = [
      "./.systemFolder/somethingElse",
      "./regularFolderLevel1/regularFolderLevel2/differentName.ext",
    ];

    const filenames = await listFiles(new PathString(TEST_FOLDER), {
      recursive: true,
      relativePath: true,
      includePatterns: [/Name/, /something/],
    });
    filenames.sort();

    compareExpectedPaths(filenames, expected);
  });

  it("should exclude matching exclude paths", async () => {
    const expected = [
      "./",
      "./.systemFile",
      "./.systemFolder/",
      "./.systemFolder/fileInSystemFolder",
      "./file1Level0.ext",
      "./regularFolderLevel1/",
      "./regularFolderLevel1/file1Level1.ext",
      "./regularFolderLevel1/file2Level1.ext2",
    ];

    const filenames = await listFiles(new PathString(TEST_FOLDER), {
      recursive: true,
      relativePath: true,
      excludePatterns: [/Level2/, /Else/],
    });
    filenames.sort();

    compareExpectedPaths(filenames, expected);
  });

  it("should exclude paths that also match", async () => {
    const expected = [];

    const filenames = await listFiles(new PathString(TEST_FOLDER), {
      recursive: true,
      relativePath: true,
      includePatterns: [/something/],
      excludePatterns: [/Else/],
    });
    filenames.sort();

    compareExpectedPaths(filenames, expected);
  });

  it("should get file and folder recursively - excluding files", async () => {
    const expected = [
      "./",
      "./.systemFolder/",
      "./regularFolderLevel1/",
      "./regularFolderLevel1/regularFolderLevel2/",
    ];

    const filenames = await listFiles(new PathString(TEST_FOLDER), {
      recursive: true,
      relativePath: true,
      excludeFiles: true,
    });
    filenames.sort();

    compareExpectedPaths(filenames, expected);
  });

  it("should get file and folder recursively excluding folders", async () => {
    const expected = [
      "./.systemFile",
      "./.systemFolder/fileInSystemFolder",
      "./.systemFolder/somethingElse",
      "./file1Level0.ext",
      "./regularFolderLevel1/file1Level1.ext",
      "./regularFolderLevel1/file2Level1.ext2",
      "./regularFolderLevel1/regularFolderLevel2/differentName.ext",
      "./regularFolderLevel1/regularFolderLevel2/file1Level2.ext3",
      "./regularFolderLevel1/regularFolderLevel2/file2Level2.ext4",
    ];

    const filenames = await listFiles(new PathString(TEST_FOLDER), {
      recursive: true,
      relativePath: true,
      excludeDirectories: true,
    });
    filenames.sort();

    compareExpectedPaths(filenames, expected);
  });
});
