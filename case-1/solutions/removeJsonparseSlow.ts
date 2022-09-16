import path from "path";
import { keys, isEmpty } from "lodash";
import { unflatten } from "flat";

import { writeFile, readJSON } from "../../utils/file";
import { memoryUsageWrapper, timeUsageWrapper } from "../../utils/wrapper";

interface UserInfoJSON {
  key: string;
  value: string | string[];
}

export class UserInfo {
  private json: Record<string, unknown>;
  constructor(userInfos: UserInfoJSON[]) {
    const length = userInfos.length;
    const data = {};
    for (let i = 0; i < length; i++) {
      const key = userInfos[i].key;
      const value = userInfos[i].value;
      if (Array.isArray(value)) {
        Object.assign(data, {[key]: value.map((v) => {
          return this.isJsonString(v);
        })});
      } else {
        Object.assign(data, {[key]: value});
      }
    }
    this.json = data;
    return this;
  }
  
  toJSON() {
    return this.json;
  }

  public isJsonString(str: string): any {
    const numberString = parseFloat(str);
    if(String(numberString) === str){
      return numberString;
    }else {
      return str;
    }
  }
}

function createResponse(_mapUserIdToContexts: Record<string, unknown[]>) {
  const data = {};
  if (!isEmpty(_mapUserIdToContexts)) {
    for (const userId in _mapUserIdToContexts) {
      const info = new UserInfo(_mapUserIdToContexts[userId] as UserInfoJSON[]).toJSON();
      Object.assign(data, {[userId]: info});
    }
  }
  return {
    ids: keys(data),
    data: unflatten(data, {})
  };
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
