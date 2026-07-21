import { performance } from 'perf_hooks';

async function runBenchmark() {
  const start = performance.now();
  await import('./server.js');
  const end = performance.now();
  console.log(`Startup time: ${end - start} ms`);
  process.exit(0);
}

runBenchmark().catch(console.error);
