import { PathString, IPathString } from "../pathString/pathString";

export class Filenames extends Array<IPathString> {
  private static compareFunc(a: IPathString, b: IPathString): number {
    const a_lt_b = a._lt_(b);
    const b_lt_a = b._lt_(a);

    const eq = !a_lt_b && !b_lt_a;

    if (eq) {
      return 0;
    } else if (a_lt_b) {
      return -1;
    } else {
      return 1;
    }
  }

  sort(compareFunction?: (a: IPathString, b: IPathString) => number): this {
    let compFunc = Filenames.compareFunc;
    if (compareFunction) {
      compFunc = compareFunction;
    }
    return super.sort(compFunc);
  }

  push(...paths: Array<string | IPathString>): number {
    const pathStringPaths = paths.map((p): IPathString => new PathString(p));
    return super.push(...pathStringPaths);
  }
}
