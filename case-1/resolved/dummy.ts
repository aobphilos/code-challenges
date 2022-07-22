import path from "path";
import { hrtime } from "node:process";
import { keys, isEmpty, mapValues } from "lodash";
import { unflatten } from "flat";

import { writeFile, readJSONFile } from "../../utils/file";

interface userInfoJSON {
  key: string;
  value: string | string[];
}

export class UserInfo {
  private json: Record<string, unknown>[];
  constructor(userInfos: userInfoJSON[]) {
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

const createResponse = (_mapUserIdToContexts: object) => {
  let data = {};
  if (!isEmpty(_mapUserIdToContexts)) {
    data = mapValues(_mapUserIdToContexts, (arr) => {
      return Object.assign({}, ...new UserInfo(arr).toJSON());
    });
  }
  return {
    ids: keys(data),
    data: unflatten(data, {})
  };
};

(() => {
  const start = hrtime.bigint();

  const dataPath = path.join(__dirname, "../data/user-contexts.json");
  const UserContexts = readJSONFile(dataPath);

  const loadDataTime = hrtime.bigint();

  console.log(`Load data time: ${Number(loadDataTime - start) / 1e6} ms`);

  const result = createResponse(UserContexts);

  const generatedTime = hrtime.bigint();

  console.log(
    `Execution time: ${Number(generatedTime - loadDataTime) / 1e6} ms`
  );

  const outputDir = path.join(__dirname, "../generated");
  const fileExt = path.extname(__filename);
  const filePath = path.join(
    outputDir,
    `${path.basename(__filename, fileExt)}.json`
  );

  writeFile(result, outputDir, filePath);

  const writeFileTime = hrtime.bigint();

  console.log(
    `Write file time: ${Number(writeFileTime - generatedTime) / 1e6} ms`
  );
})();
