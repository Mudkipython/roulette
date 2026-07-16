import { RoulettePhysics } from '../src/roulettePhysics.js';

const order = ['0','32','15','19','4','21','2','25','17','34','6','27','13','36','11','30','8','23','10','5','24','16','33','1','20','14','31','9','22','18','29','7','28','12','35','3','26'];
const runs = Number(process.env.PHYSICS_RUNS || 100);
const results = [];
const counts = new Map();
const sim = await RoulettePhysics.create(order);

for (let round = 0; round < runs; round += 1) {
  sim.launch();
  let close = null;
  let maxY = -Infinity;
  let minRadius = Infinity;
  let maxRadius = 0;
  let snapshot;

  for (let frame = 0; frame < 60 * 24; frame += 1) {
    snapshot = sim.step(1 / 60);
    maxY = Math.max(maxY, snapshot.ballPosition.y);
    minRadius = Math.min(minRadius, snapshot.radius);
    maxRadius = Math.max(maxRadius, snapshot.radius);
    if (close == null && snapshot.betsClosed) close = snapshot.elapsed;
    if (snapshot.phase === 'resolved') break;
  }

  results.push({
    result: snapshot.result,
    close,
    end: snapshot.elapsed,
    minRadius,
    maxRadius,
    maxY,
    safetyResolved: snapshot.safetyResolved,
    deflectorHits: snapshot.deflectorHits,
    separatorHits: snapshot.separatorHits
  });
  counts.set(snapshot.result, (counts.get(snapshot.result) || 0) + 1);
}

const average = values => values.reduce((sum, value) => sum + value, 0) / values.length;
const report = {
  runs,
  uniqueResults: counts.size,
  bettingCloseSeconds: {
    min: Math.min(...results.map(item => item.close)),
    max: Math.max(...results.map(item => item.close)),
    average: average(results.map(item => item.close))
  },
  resolutionSeconds: {
    min: Math.min(...results.map(item => item.end)),
    max: Math.max(...results.map(item => item.end)),
    average: average(results.map(item => item.end))
  },
  trajectory: {
    maximumHeight: Math.max(...results.map(item => item.maxY)),
    maximumRadius: Math.max(...results.map(item => item.maxRadius)),
    minimumRadius: Math.min(...results.map(item => item.minRadius)),
    escaped: results.filter(item => item.maxRadius > 6.12 || item.minRadius < 3.70 || item.maxY > 2.30).length
  },
  contacts: {
    deflectorHits: results.reduce((sum, item) => sum + item.deflectorHits, 0),
    separatorHits: results.reduce((sum, item) => sum + item.separatorHits, 0),
    roundsWithDeflectorHit: results.filter(item => item.deflectorHits > 0).length,
    roundsWithSeparatorHit: results.filter(item => item.separatorHits > 0).length
  },
  safetyResolved: results.filter(item => item.safetyResolved).length,
  unresolved: results.filter(item => !item.result).length,
  resultCounts: Object.fromEntries([...counts.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0]), undefined, { numeric: true })))
};

console.log(JSON.stringify(report, null, 2));

if (report.unresolved || report.safetyResolved || report.trajectory.escaped) process.exitCode = 1;
sim.free();
