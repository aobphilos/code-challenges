import path from "path";
import { writeFile, readJSON } from "../../utils/file";
import { memoryUsageWrapper, timeUsageWrapper } from "../../utils/wrapper";
import memoize, { Options } from "memoizee";
// eslint-disable-next-line @typescript-eslint/no-var-requires
// const memProfile = require("memoizee/profile");

type Value = (string | string[])


function toObject(map: Map<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Array.from(map.entries(), ([k, v]) => v instanceof Map ? [k, toObject(v)] : [k, v]));
}



function parse(value: unknown): any{
  if(Array.isArray(value)){
    return value.map(v=>memoizedParseStringValue(v));
  }else return memoizedParseStringValue(value);
}

function parseStringValue(value: unknown): any{
  if(typeof value !== "string"){
    return value;
  }
  const [err, result] = memoizedSafeJsonParse(value);
  if(err === null){
    return result;
  }else{
    return value;
  }
}

function safeJsonParse(str: string) : [null, any] | [unknown]{
  try {
    return [null, JSON.parse(str)];
  } catch (err) {
    return [err];
  }
}

const options: Options<never> = { max: 1000, maxAge: 1000, profileName: "safeJsonParse" };
const memoizedSafeJsonParse = memoize(safeJsonParse, options);
const memoizedParseStringValue = memoize(parseStringValue, options);
const memoizedParse = memoize(parse,options);

function setMap(key: string, value: Value, map: Map<string, unknown>): void {
  //base case
  if (!key.includes(".")) {
    map.set(key, memoizedParse(value));
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
  // console.log(memProfile.log());
}

(async () => {
  const wrapperMain = memoryUsageWrapper(main, "Total");
  await wrapperMain();
})();
