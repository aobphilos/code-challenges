import path from "path";
import { Parse as Unzip, Entry } from "unzipper";
import { pipeline, Transform } from "node:stream";
import { createReadStream } from "node:fs";

import { parse as CsvParse } from "csv-parse";
import { memoryUsageWrapper, timeUsageWrapper } from "../../utils/wrapper";

async function main() {
  const zipFilePath = path.join(__dirname, "../data/users_groups.zip");
  const request = createReadStream(zipFilePath);
  request.on("close", () => {
    console.log("[Request] closed");
  });

  const fileInProcess: number[] = [];

  const unzip = Unzip();
  unzip.on("error", (err) => {
    console.error("[Unzip] error", err.message);
  });
  unzip.on("close", () => {
    console.log("[Unzip] closed");
  });

  const onError = (
    context: { name: string; fileName?: string; type?: string },
    err: Error | null
  ) => {
    if (err) {
      console.error(`[${context.name}] error =>`, err.message);
    } else {
      console.log(`[${context.name}] success => ${context.fileName}`);
    }
  };

  const extract = new Transform({
    objectMode: true,
    transform(entry: Entry, encoding, callback) {
      const fileName = entry.path;
      const type = entry.type; // 'Directory' or 'File'

      entry.on("close", () => {
        console.log(`[Entry] close => ${fileName} (${type})`);
        callback(null, fileName);
      });

      if (
        type === "File" &&
        !(/^__MACOSX/.test(fileName) || /^\.DS_Store/.test(fileName))
      ) {
        console.log(`[Entry] Processing => ${fileName} (${type})`);
        fileInProcess.push(1);
        const csvParser = CsvParse({ columns: true });
        csvParser
          .on("data", (row: { UserId_pattern: string; _groups: string }) => {
            console.log(
              `[CSV] data => ${fileName} (${type}) -> ${row.UserId_pattern} : ${row._groups}`
            );
          })
          .on("close", () => {
            console.log(`[CSV] close => ${fileName} (${type})`);
            setTimeout(() => {
              console.log(`[CSV] data => ${fileName} (${type})  >> DONE <<`);
              this.emit("fire", fileName);
            }, Math.random() * 5000);
          })
          .on("end", () => {
            console.log(`[CSV] end => ${fileName} (${type})`);
          });

        const context = {
          name: "Entry",
          fileName,
          type
        };
        pipeline(entry, csvParser, onError.bind(null, context));
      } else {
        console.log(`[Entry] Skipping => ${fileName} (${type})`);
        entry.autodrain();
      }
    }
  });

  extract.on("error", (err) => {
    console.error("[Extract] error", err.message);
  });
  extract.on("close", () => {
    console.log("[Extract] closed");
  });
  // extract.on("fire", () => {
  //   console.log("[Extract] fired");
  // });
  pipeline(
    request,
    unzip,
    extract,
    onError.bind(null, { name: "Request", fileName: "All" })
  ).on("fire", () => {
    fileInProcess.pop();
    console.log("[Request] in process", fileInProcess.length);
    if (fileInProcess.length === 0) {
      console.log("[Request] has been finished");
    }
  });
}

(async () => {
  const wrapperMain = timeUsageWrapper(main, "Total");
  await wrapperMain();
})();
