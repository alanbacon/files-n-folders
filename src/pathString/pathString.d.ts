export interface IPathString extends String {
  path: string;
  filename: string;
  extention: string;
  pathAsList: string[];
  isPathStyle: boolean;
  exists: () => Promise<boolean>;
  isFile: () => Promise<boolean>;
  isDirectory: () => Promise<boolean>;
  getPathRelativeTo: (other: IPathString) => IPathString;
  _lt_: (other: IPathString) => boolean;
  _prepLt: () => void;
  _digitGroups: (String | number)[][];
}

export interface IFileStat {
  isDirectory: () => boolean;
  isFile: () => boolean;
  isSymbolicLink: () => boolean;
}
