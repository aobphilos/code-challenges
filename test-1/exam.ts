import { hrtime } from 'node:process';
import { keys, isEmpty, mapValues } from 'lodash';
import { unflatten } from 'flat';

import UserContexts from './data/user-contexts.json';

const createResponse = (_mapUserIdToContexts: any) => {
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

interface userInfoJSON {
  key: string;
  value: string | string[];
}

export class UserInfo {
  private json: any;
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

  public isJsonString(str: any): Boolean {
    try {
      JSON.parse(str);
    } catch (err) {
      return false;
    }
    return true;
  }
}

(() => {
  const start = hrtime.bigint();

  createResponse(UserContexts);

  const end = hrtime.bigint();

  console.log(`Execution time: ${Number(end - start) / 1000000}ms`);
})();
