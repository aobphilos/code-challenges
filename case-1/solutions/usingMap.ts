import path from "path";

import { writeFile, readJSON } from "../../utils/file";
import { memoryUsageWrapper, timeUsageWrapper } from "../../utils/wrapper";

interface UserInfoJSON {
  key: string;
  value: string | string[];
}

export class UserInfo {
  private json: Record<string, unknown>[];
  constructor(userInfos: UserInfoJSON[]) {
    this.json = userInfos.map((userInfo) => {
      if (Array.isArray(userInfo.value)) {
        return {
          [userInfo.key]: userInfo.value.map((v) => {
            return this.isJsonString(v) ? JSON.parse(v) : v;
          })
        };
      } else {
        return {
          [userInfo.key]: this.isJsonString(userInfo.value)
            ? JSON.parse(userInfo.value)
            : userInfo.value
        };
      }
    });
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

type Value = (string | number | (string | number)[])


function toObject(map: Map<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Array.from(map.entries(), ([k, v]) => v instanceof Map ? [k, toObject(v)] : [k, v]));
}


function setMap(key: string, value: Value, map: Map<string, unknown>): void {
  //base case
  if (!key.includes(".")) {
    map.set(key, value);
  } else {
    //recursive case
    const keys = key.split(/\.(.*)/s); 
    const v = map.get(keys[0]);
    if (v === undefined) {
      const newMap = new Map<string, unknown>();
      setMap(keys[1], value, newMap);
      map.set(keys[0], newMap);
    } else if (v instanceof Map) {
      setMap(keys[1], value, v);
    } else {
      throw new Error("Invalid input");
    }
  }
}

function createResponse(_mapUserIdToContexts: Record<string, { key: string, value: Value }[]>) {
  const data: Record<string, unknown> = {};
  for (const userId in _mapUserIdToContexts) {
    const keyValues = _mapUserIdToContexts[userId];
    const map = new Map<string, unknown>();
    for (const kv of keyValues) {
      setMap(kv.key, kv.value, map);
    }
    data[userId] = toObject(map);
  }
  return {
    ids: Object.keys(_mapUserIdToContexts),
    data
  };
}

async function loadData(): Promise<Record<string, { key: string, value: Value }[]>> {
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
