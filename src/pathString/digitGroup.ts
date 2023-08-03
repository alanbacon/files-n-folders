const digitRegex = /\d+/g;

export function getDigitGroups(str: String): (String | number)[] {
  const parts: (String | number)[] = [];
  const digitGroups = [...str.matchAll(digitRegex)].map((mo) => Number(mo[0]));
  const nonDigitGroups = str.split(digitRegex);

  if (nonDigitGroups[0] === "") {
    // then starts with a digit group
    const dg = digitGroups.shift() || "";
    parts.push(dg);
  }

  const nonDigitGroupsNoEmpties = nonDigitGroups.filter((ndg) => ndg !== "");

  while (nonDigitGroupsNoEmpties.length) {
    const ndg = nonDigitGroupsNoEmpties.shift() as string;
    const dg = digitGroups.shift();
    parts.push(ndg);
    if (dg) {
      parts.push(dg);
    }
  }

  return parts;
}
