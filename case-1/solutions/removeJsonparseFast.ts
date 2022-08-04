import path from "path";
import { keys, isEmpty, mapValues } from "lodash";
import { unflatten } from "flat";

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
            return this.isJsonString(v);
          })
        };
      } else {
        return {
          [userInfo.key]: this.isJsonString(userInfo.value)
        };
      }
    });
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
  let data = {};
  if (!isEmpty(_mapUserIdToContexts)) {
    data = mapValues(_mapUserIdToContexts, (arr) => {
      return Object.assign({}, ...new UserInfo(arr as UserInfoJSON[]).toJSON());
    });
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
