import path from "path";
import { keys, isEmpty, mapValues, merge } from "lodash";

import { writeFile, readJSON } from "../../utils/file";
import { memoryUsageWrapper, timeUsageWrapper } from "../../utils/wrapper";

interface UserInfoJSON {
  key: string;
  value: string | string[];
}

export class UserInfo {
  private json: Record<string, unknown>;
  constructor(userInfos: UserInfoJSON[]) {
    this.json = userInfos
      .map((userInfo) => {  // Process data
        if (Array.isArray(userInfo.value)) {
          return {
            key: userInfo.key,
            value: userInfo.value.map((v) => this.checkValidNumber(v) ? Number(v) : v),
          };
        } else {
          return {
            key: userInfo.key,
            value: this.checkValidNumber(userInfo.value) ? Number(userInfo.value) : userInfo.value,
          };
        }
      })
      .map((userInfo) => {  // Unflatten each record
        const keys = userInfo.key.split(".");
        return this.recursiveSetObjectKey(keys, userInfo.value);
      })
      .reduce((a, b) => merge(a, b), {}); // Merge array of unflattened objects
  }

  checkValidNumber(val: string) {
    // Checking for numbers, excluding numbers with invalid format (e.g - 002, 10., .251)
    return /(^[1-9]\d*(\.\d+)?$)|(^0(\.\d+)?$)/.test(val);
  }

  recursiveSetObjectKey(keys: string[], val: unknown): Record<string, unknown> {
    const key = keys.shift();

    if (key === undefined) {
      return {};
    }
    
    if (keys.length === 0) {
      return { [key]: val };
    } else {
      return { [key]: this.recursiveSetObjectKey(keys, val) };
    }
  }

  toJSON() {
    return this.json;
  }

  public isJsonString(str: string): boolean {
    try {
      JSON.parse(str);
    } catch (err) {
      return false;
    }
    return true;
  }
}

function createResponse(_mapUserIdToContexts: Record<string, unknown[]>) {
  let data = {};
  if (!isEmpty(_mapUserIdToContexts)) {
    data = mapValues(_mapUserIdToContexts, (arr) => {
      return new UserInfo(arr as UserInfoJSON[]).toJSON();
    });
  }

  const result = {
    ids: keys(data),
    data,
  };

  return result;
}

async function loadData(): Promise<Record<string, unknown[]>> {
  return readJSON(path.join(__dirname, "../data/user-contexts.json"));
}

async function main() {
  const outputDir = path.join(__dirname, "../generated");
  const fileExt = path.extname(__filename);
  const filePath = path.join(
    outputDir,
    `${path.basename(__filename, fileExt)}.json`
  );

  const wrapperLoadData = timeUsageWrapper(loadData, "Load data");
  const wrapperCreateResponse = timeUsageWrapper(
    createResponse,
    "Transform data"
  );
  const wrapperWriteFile = timeUsageWrapper(writeFile, "Write file");

  const userContexts = await wrapperLoadData();

  const result = wrapperCreateResponse(userContexts);

  await wrapperWriteFile(result, outputDir, filePath);
}

(async () => {
  const wrapperMain = memoryUsageWrapper(main, "Total");
  await wrapperMain();
})();
