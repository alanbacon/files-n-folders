import { getDigitGroups } from "./digitGroup.js";
import * as path from "path";
import * as fs from "fs";
import { mkdirp } from "mkdirp";

export interface IPathString extends String {
  path: string;
  filename: string;
  extention: string;
  directoryName: string;
  pathAsList: string[];
  isPathStyle: boolean;
  exists: () => boolean;
  isFile: () => boolean;
  isDirectory: () => boolean;
  getPathRelativeTo: (other: IPathString) => IPathString;
  appendPath: (other: IPathString) => IPathString;
  getParentFolder: () => IPathString;
  create: () => Promise<void>;
  _lt_: (other: IPathString) => boolean;
  _prepLt: () => void;
  _digitGroups: (String | number)[][];
  _stat: IFileStat | undefined | null;
}

export interface IFileStat {
  isDirectory: () => boolean;
  isFile: () => boolean;
  isSymbolicLink: () => boolean;
}

export class PathString extends String implements IPathString {
  path: string;
  filename: string;
  extention: string;
  directoryName: string;
  pathAsList: string[];
  isPathStyle: boolean;
  _stat: IFileStat | undefined | null;
  _digitGroups: (String | number)[][];

  constructor(str: string | IPathString, dirent?: fs.Dirent | IFileStat) {
    if (str instanceof PathString) {
      return str;
    }
    super(str);
    this.pathAsList = this.split(path.sep);

    if (dirent) {
      this._stat = {
        isDirectory: () => dirent.isDirectory(),
        isFile: () => dirent.isFile(),
        isSymbolicLink: () => dirent.isSymbolicLink(),
      };
    }

    if (this.pathAsList.slice(-1)[0] !== "") {
      // has filename
      this.isPathStyle = false;
      const splitFilename = this.pathAsList.slice(-1)[0].split(".");
      this.path = [...this.pathAsList.slice(0, -1), ""].join(path.sep);
      if (splitFilename.length === 1) {
        this.filename = splitFilename[0];
        this.extention = "";
      } else {
        this.filename = splitFilename.slice(0, -1).join(".");
        this.extention = splitFilename.slice(-1)[0];
      }
    } else {
      // is purely a path
      this.isPathStyle = true;
      this.path = this.pathAsList.join(path.sep);
      this.filename = "";
      this.extention = "";
    }

    if (this.pathAsList.length > 1) {
      this.directoryName = this.pathAsList.slice(-2)[0];
    } else {
      this.directoryName = "";
    }

    this._stat = undefined;
  }

  private getStat(): void {
    if (this._stat === undefined) {
      try {
        const stat = fs.statSync(this.toString());
        this._stat = {
          isDirectory: () => stat.isDirectory(),
          isFile: () => stat.isFile(),
          isSymbolicLink: () => stat.isSymbolicLink(),
        };
      } catch (err) {
        this._stat = null;
      }
    }
  }

  exists(): boolean {
    this.getStat();
    return !!this._stat;
  }

  isDirectory(): boolean {
    if (!this.exists()) {
      return false;
    }

    return this._stat!.isDirectory();
  }

  isFile(): boolean {
    if (!this.exists()) {
      return false;
    }

    return this._stat!.isFile();
  }

  appendPath(otherPathString: IPathString): IPathString {
    let newPath = path.resolve(this.toString(), otherPathString.toString());
    if (otherPathString.isPathStyle) {
      newPath = newPath + path.sep;
    }
    return new PathString(newPath, otherPathString._stat || undefined);
  }

  getPathRelativeTo(otherPathString: IPathString): IPathString {
    if (!otherPathString.isPathStyle) {
      throw new Error("other path must have trailing slash");
    }

    const otherPathAsListWithoutEmptyFilename =
      otherPathString.pathAsList.slice(0, -1);

    const selfPathAsList = [...this.pathAsList];

    let i = -1;

    while (true) {
      i++;
      if (
        !selfPathAsList.length ||
        !otherPathAsListWithoutEmptyFilename.length
      ) {
        break;
      }

      if (otherPathAsListWithoutEmptyFilename[0] === selfPathAsList[0]) {
        selfPathAsList.shift(); // remove first element
        otherPathAsListWithoutEmptyFilename.shift(); // remove first element
      } else if (i == 0) {
        throw new Error(
          "relative paths can only be calculated from paths with a common root"
        );
      } else {
        break;
      }
    }

    // however many directories left on otherPathList indicate how many levels to go up
    // add on whatever is left on selfPathList
    const numUpLevels = otherPathAsListWithoutEmptyFilename.length;
    let newRelativePathList: String[];
    if (numUpLevels > 0) {
      newRelativePathList = [
        ...Array(numUpLevels).fill(".."),
        ...selfPathAsList,
      ];
    } else {
      newRelativePathList = [".", ...selfPathAsList];
    }

    return new PathString(
      newRelativePathList.join(path.sep),
      this._stat || undefined
    );
  }

  getParentFolder() {
    const closeSliceIndex = this.isPathStyle ? -2 : -1;
    const newPathAsList = [...this.pathAsList.slice(0, closeSliceIndex), ""];
    const newPath = newPathAsList.join(path.sep);
    return new PathString(newPath);
  }

  async create() {
    if (!this.isPathStyle) {
      throw new Error("not implemented: can only create directories");
    }

    await mkdirp(this.toString());
  }

  _prepLt() {
    if (!this._digitGroups) {
      this._digitGroups = this.pathAsList.map((p) =>
        getDigitGroups(p.toLowerCase())
      );

      if (!this.isPathStyle) {
        this._digitGroups.pop();
        this._digitGroups.push(getDigitGroups(this.filename));
        this._digitGroups.push(getDigitGroups(this.extention));
      }
    }
  }

  _lt_(other: IPathString): boolean {
    this._prepLt();
    other._prepLt();

    for (const iStr in this._digitGroups) {
      const i = Number(iStr);
      const sFolder = this._digitGroups[i];
      if (i >= other._digitGroups.length) {
        // other string has less folder depth
        return false;
      }

      const oFolder = other._digitGroups[i];
      for (const jStr in sFolder) {
        const j = Number(jStr);
        const sPart = sFolder[j];
        if (j >= oFolder.length) {
          // other folder has shorter name
          return false;
        }
        const oPart = oFolder[j];
        if (sPart === oPart) {
          // if this part of the foldername is the same they should be sorted
          // on a more specific part of their foldername
          continue;
        } else if (typeof sPart !== typeof oPart) {
          return typeof sPart === "number";
        } else {
          return sPart < oPart;
        }
      }
    }

    if (this._digitGroups.length < other._digitGroups.length) {
      // other folder has a longer name
      return true;
    }

    // the stripped strings were the same and the numbers contains in the unstripped string
    // mathematically evaluate to be equivalent (they must contain padding zeros)
    // can only now compare the strings in the normal way
    return this.toString() < other.toString();
  }
}
