# Key Learnings

1. When given a performance task to optimize file I/O operations, always check the entire logical block for synchronous functions (`fs.readFileSync`, `fs.writeFileSync`).
2. Be careful not to just replace synchronous reads; double check the task requirements (and follow up with the reviewer's specific advice) to see if writes (`writeFile` missing an `await`) also need to be made asynchronous or properly awaited.
3. Top-level `await` is supported in this project's `server.js` (as it is ES Modules, Node.js >= 14.8).
