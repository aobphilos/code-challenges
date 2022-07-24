import fs from "fs-extra";

export function writeFile(data: unknown, outputPath: string, filePath: string) {
  fs.ensureDirSync(outputPath);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export async function writeFileAsync(
  data: unknown,
  outputPath: string,
  filePath: string
) {
  await fs.ensureDir(outputPath);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

export function readJSONFile(filePath: string) {
  return fs.readJSONSync(filePath, { throws: false });
}

export async function readJSONFileAsync(filePath: string) {
  return fs.readJSON(filePath, { throws: false });
}
