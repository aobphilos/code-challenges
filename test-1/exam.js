"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserInfo = void 0;
const node_process_1 = require("node:process");
const lodash_1 = require("lodash");
const flat_1 = require("flat");
const user_contexts_json_1 = __importDefault(require("./data/user-contexts.json"));
const createResponse = (_mapUserIdToContexts) => {
    let data = {};
    if (!(0, lodash_1.isEmpty)(_mapUserIdToContexts)) {
        data = (0, lodash_1.mapValues)(_mapUserIdToContexts, (arr) => {
            return Object.assign({}, ...new UserInfo(arr).toJSON());
        });
    }
    return {
        ids: (0, lodash_1.keys)(data),
        data: (0, flat_1.unflatten)(data, {})
    };
};
class UserInfo {
    json;
    constructor(userInfos) {
        this.json = userInfos.map((userInfo) => {
            if (Array.isArray(userInfo.value)) {
                return {
                    [userInfo.key]: userInfo.value.map((v) => {
                        return this.isJsonString(v) ? JSON.parse(v) : v;
                    })
                };
            }
            else {
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
    isJsonString(str) {
        try {
            JSON.parse(str);
        }
        catch (err) {
            return false;
        }
        return true;
    }
}
exports.UserInfo = UserInfo;
(() => {
    const start = node_process_1.hrtime.bigint();
    createResponse(user_contexts_json_1.default);
    const end = node_process_1.hrtime.bigint();
    console.log(`Execution time: ${Number(end - start) / 1000000}ms`);
})();
