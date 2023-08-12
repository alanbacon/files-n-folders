import * as path from "path";
import { Dirent, promises as fs } from "fs";
import { PathString, IPathString } from "../pathString/pathString.js";
import { Filenames } from "../filenames/filenames.js";

export interface IListingOptions {
  recursive?: boolean;
  fullPath?: boolean;
  relativePath?: boolean;
  extentions?: string[];
  excludeSystemFiles?: boolean;
  includePatterns?: RegExp[];
  excludePatterns?: RegExp[];
  excludeDirectories?: boolean;
  excludeFiles?: boolean;
}

function includePathInListing(
  ps: IPathString,
  options: IListingOptions,
  isFile: boolean
): boolean {
  let extentionOK = true;
  if (isFile && options.extentions && options.extentions.length) {
    const extenstionsSet = new Set(options.extentions);
    extentionOK = extenstionsSet.has(ps.extention);
  } else if (!isFile && options.extentions && options.extentions.length) {
    extentionOK = false;
  }

  // if there is more than one include pattern their results are OR'ed (i.e. only one include
  // pattern needs to match to result in an overal match)
  let includePatternOK = true;
  if (options.includePatterns && options.includePatterns.length) {
    includePatternOK = options.includePatterns.some((incPat) =>
      incPat.test(ps.toString())
    );
  }

  const includeDirectoryOK = !isFile && !options.excludeDirectories;
  const includeFilesOK = isFile && !options.excludeFiles;
  const includeTypeOK = includeDirectoryOK || includeFilesOK;

  return extentionOK && includePatternOK && includeTypeOK;
}

// exclude takes precedent, even if there is an included pattern. E.g. path strings that
// contains included and excluded patterns will overal NOT be included
function excludePathFromListing(ps: IPathString, options: IListingOptions) {
  // files that start with a dot are seen as PathStrings with no filename but with an extention
  const isSystemFile = !ps.filename && !!ps.extention;
  const systemExclude = options.excludeSystemFiles && isSystemFile;

  // if there is more than one exclude pattern their results are ORed (i.e. only one exclude
  // pattern needs to match to result in an overal mismatch)
  let excludePattern = false;
  if (options.excludePatterns && options.excludePatterns.length) {
    excludePattern = options.excludePatterns.some((excPat) =>
      excPat.test(ps.toString())
    );
  }

  return systemExclude || excludePattern;
}

export async function* yieldFiles(
  dir: string,
  options?: IListingOptions,
  dirent?: Dirent
): AsyncGenerator<IPathString> {
  const defaultOptions = { recursive: false };
  if (!options) {
    options = defaultOptions;
  }

  if (options.recursive && !options.fullPath) {
    options.fullPath = true;
  }

  const dirPs = new PathString(path.resolve(dir) + path.sep, dirent);
  if (options.recursive && includePathInListing(dirPs, options, false)) {
    yield dirPs;
  }

  const dirents = await fs.readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    let p: string;
    if (options.fullPath) {
      p = path.resolve(dir, dirent.name);
    } else {
      p = dirent.name;
    }

    const ps = new PathString(p, dirent);
    if (!excludePathFromListing(ps, options)) {
      if (dirent.isDirectory() && options.recursive) {
        yield* yieldFiles(p, options, dirent);
      } else if (dirent.isDirectory()) {
        if (includePathInListing(ps, options, false)) {
          if (options.fullPath) {
            yield new PathString(ps + path.sep, dirent);
          } else {
            yield ps;
          }
        }
      } else {
        if (includePathInListing(ps, options, true)) {
          yield ps;
        }
      }
    }
  }
}

export async function listFiles(
  dir: IPathString,
  options?: IListingOptions
): Promise<Filenames> {
  if (!dir.isDirectory()) {
    throw new Error(`${dir.toString()} isn't a directory`);
  }

  if (!dir.isPathStyle) {
    dir = new PathString(dir.toString() + path.sep);
  }

  const filenames = new Filenames();

  for await (const ps of yieldFiles(dir.toString(), options)) {
    if (options?.relativePath) {
      filenames.push(ps.getPathRelativeTo(dir));
    } else {
      filenames.push(ps);
    }
  }

  return filenames;
}
