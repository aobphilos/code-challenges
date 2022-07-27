# Code Challenges

A coding practice repository for all challenging issues.

---

### Getting Start

This project uses **NodeJS** at version 16.5 and uses **PNPM** mainly.

#### Installation

`pnpm install`

#### Build

`pnpm build`

---

### Case #1

We have a processing challenge. That takes quite a lot of time. In this case, it's about transforming the JSON data, which is quite complex and extensive.

##### Run `TS` file

`pnpm dev <target file>`

##### Ex.

```sh
pnpm dev case-1/base/main.ts
```

##### Run `JS` file

`pnpm start <target file>`

##### Ex.

```sh
pnpm start case-1/base/main.js
```

##### Output

```sh
Load data time: 284.422437 ms

Transform data time: 5126.855902 ms

Write file time: 436.222832 ms

Total memory usage: => rss: 207.23 MB, heapUsed: 80.89 MB
```

---

<br>

### `*` Pull Request `*`

Always check the correctness before opening the PR.

> Modify the path to run the challenge command to match the work submitted.
>
> ex. "**_challenge_**": "pnpm start ./case-1/solutions/`<target>`.js"
