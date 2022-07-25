import { hrtime } from "node:process";

export function logTimeUsage(startTime: bigint, title?: string) {
  const endTime = hrtime.bigint();
  console.log(
    `${title ?? "Total"} time: ${Number(endTime - startTime) / 1e6} ms\n`
  );
}

export function logMemoryUsage(baseMemory: NodeJS.MemoryUsage, title?: string) {
  const memoryUsageAfter = process.memoryUsage();
  const rss = memoryUsageAfter.rss - baseMemory.rss;
  const rssTotal = Number(rss / 1024 / 1024).toFixed(2);
  const heapUsed = memoryUsageAfter.heapUsed - baseMemory.heapUsed;
  const heapUsedTotal = Number(heapUsed / 1024 / 1024).toFixed(2);

  console.log(
    `${
      title ?? "Total"
    } memory usage: => rss: ${rssTotal} MB, heapUsed: ${heapUsedTotal} MB \n`
  );
}
