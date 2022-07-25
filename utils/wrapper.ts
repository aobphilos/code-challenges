import { hrtime } from "node:process";
import { logTimeUsage, logMemoryUsage } from "./trace";

type Func<T, U extends unknown[]> = (...args: U) => Promise<T> | T;

export function timeUsageWrapper<T, U extends unknown[]>(
  fn: Func<T, U>,
  title?: string
): Func<T, U> {
  return (...args: U) => {
    const start = hrtime.bigint();
    const result = fn(...args);

    if (result instanceof Promise) {
      return result.then((result) => {
        logTimeUsage(start, title);
        return result;
      });
    } else {
      logTimeUsage(start, title);
      return result;
    }
  };
}

export function memoryUsageWrapper<T, U extends unknown[]>(
  fn: Func<T, U>,
  title?: string
): Func<T, U> {
  return (...args: U) => {
    const memoryUsageBefore = process.memoryUsage();

    const result = fn(...args);

    if (result instanceof Promise) {
      return result.then((result) => {
        logMemoryUsage(memoryUsageBefore, title);
        return result;
      });
    } else {
      logMemoryUsage(memoryUsageBefore, title);
      return result;
    }
  };
}
