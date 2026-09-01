const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const trackSelect = document.getElementById('trackSelect');
const trainBtn = document.getElementById('trainBtn');
const trainAllBtn = document.getElementById('trainAllBtn');
const testBtn = document.getElementById('testBtn');
const testAllBtn = document.getElementById('testAllBtn');
const stopBtn = document.getElementById('stopBtn');
const resetBtn = document.getElementById('resetBtn');
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const downloadBtn = document.getElementById('downloadBtn');

const modeText = document.getElementById('modeText');
const generationText = document.getElementById('generationText');
const aliveText = document.getElementById('aliveText');
const bestFitnessText = document.getElementById('bestFitnessText');
const checkpointText = document.getElementById('checkpointText');
const statusText = document.getElementById('statusText');
const savedText = document.getElementById('savedText');
const allTestText = document.getElementById('allTestText');

const W = canvas.width;
const H = canvas.height;
const POPULATION_SIZE = 55;
const MUTATION_RATE = 0.035;
const ELITE_COUNT = 6;
const SENSOR_RANGE = 175;
const SENSOR_ANGLES = [-Math.PI / 2.3, -Math.PI / 4, 0, Math.PI / 4, Math.PI / 2.3];
const MAX_STEPS_WITHOUT_PROGRESS = 320;
const MAX_TRAIN_GENERATIONS_PER_TRACK = 120;
const STORAGE_KEY = 'melhoresCarrinhosPorPista';

const tracks = [
  {
    name: 'Pista 1 - Oval',
    start: { x: 500, y: 515, angle: -Math.PI / 2 },
    outer: [{x:130,y:90},{x:870,y:90},{x:930,y:150},{x:930,y:500},{x:850,y:580},{x:150,y:580},{x:70,y:500},{x:70,y:150}],
    inner: [{x:300,y:230},{x:700,y:230},{x:750,y:280},{x:750,y:410},{x:690,y:455},{x:310,y:455},{x:250,y:410},{x:250,y:280}],
    checkpoints: [{x:500,y:500},{x:180,y:470},{x:160,y:170},{x:500,y:125},{x:850,y:170},{x:825,y:470},{x:520,y:525}]
  },
  {
    name: 'Pista 2 - Curvas',
    start: { x: 175, y: 510, angle: 0 },
    outer: [{x:70,y:420},{x:160,y:330},{x:330,y:330},{x:370,y:180},{x:550,y:95},{x:840,y:115},{x:930,y:250},{x:860,y:380},{x:660,y:390},{x:630,y:555},{x:250,y:585}],
    inner: [{x:210,y:460},{x:275,y:420},{x:445,y:420},{x:480,y:260},{x:590,y:215},{x:770,y:225},{x:800,y:270},{x:760,y:305},{x:555,y:305},{x:520,y:465},{x:275,y:480}],
    checkpoints: [{x:190,y:505},{x:290,y:380},{x:450,y:320},{x:560,y:175},{x:790,y:185},{x:855,y:280},{x:710,y:350},{x:585,y:505},{x:310,y:535}]
  },
  {
    name: 'Pista 3 - Estreita',
    start: { x: 120, y: 115, angle: 0.15 },
    outer: [{x:55,y:55},{x:900,y:55},{x:950,y:140},{x:760,y:220},{x:925,y:340},{x:875,y:535},{x:590,y:590},{x:500,y:430},{x:310,y:575},{x:90,y:500},{x:230,y:330},{x:70,y:230}],
    inner: [{x:155,y:145},{x:780,y:145},{x:800,y:160},{x:610,y:215},{x:790,y:360},{x:745,y:455},{x:635,y:480},{x:540,y:310},{x:300,y:455},{x:240,y:435},{x:360,y:320},{x:170,y:200}],
    checkpoints: [{x:130,y:115},{x:420,y:100},{x:780,y:110},{x:710,y:205},{x:790,y:335},{x:780,y:495},{x:605,y:520},{x:520,y:380},{x:315,y:500},{x:160,y:455},{x:270,y:325},{x:120,y:210}]
  }
];

function rand(min, max) { return Math.random() * (max - min) + min; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

function pointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / (yj - yi + 0.00001) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function onRoad(p, track) {
  return pointInPolygon(p, track.outer) && !pointInPolygon(p, track.inner);
}

function lineSegments(poly) {
  const segments = [];
  for (let i = 0; i < poly.length; i++) segments.push([poly[i], poly[(i + 1) % poly.length]]);
  return segments;
}

function raySegmentIntersection(origin, angle, a, b) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const det = (-dx * vy + dy * vx);
  if (Math.abs(det) < 0.00001) return null;
  const s = (-vy * (a.x - origin.x) + vx * (a.y - origin.y)) / det;
  const t = (-dy * (a.x - origin.x) + dx * (a.y - origin.y)) / det;
  if (s >= 0 && t >= 0 && t <= 1) return s;
  return null;
}

class Brain {
  constructor(weights = null) {
    this.input = 5;
    this.hidden = 10;
    this.output = 2;
    this.weights = weights || Array.from({ length: this.input * this.hidden + this.hidden * this.output + this.hidden + this.output }, () => rand(-1, 1));
  }
  clone() { return new Brain([...this.weights]); }
  think(inputs) {
    let k = 0;
    const hidden = [];
    for (let h = 0; h < this.hidden; h++) {
      let sum = 0;
      for (let i = 0; i < this.input; i++) sum += inputs[i] * this.weights[k++];
      sum += this.weights[this.input * this.hidden + this.hidden * this.output + h];
      hidden[h] = Math.tanh(sum);
    }
    k = this.input * this.hidden;
    const outputs = [];
    for (let o = 0; o < this.output; o++) {
      let sum = 0;
      for (let h = 0; h < this.hidden; h++) sum += hidden[h] * this.weights[k++];
      sum += this.weights[this.input * this.hidden + this.hidden * this.output + this.hidden + o];
      outputs[o] = Math.tanh(sum);
    }
    return outputs;
  }
  static crossover(a, b) {
    const weights = a.weights.map((value, i) => Math.random() < 0.5 ? value : b.weights[i]);
    return new Brain(weights);
  }
  mutate(rate = MUTATION_RATE) {
    this.weights = this.weights.map(w => Math.random() < rate ? clamp(w + rand(-0.5, 0.5), -2.5, 2.5) : w);
  }
}

class Car {
  constructor(brain = new Brain(), color = 'rgba(96,165,250,0.85)') {
    this.brain = brain;
    this.color = color;
    this.reset();
  }
  reset() {
    const t = currentTrack.start;
    this.x = t.x; this.y = t.y; this.angle = t.angle;
    this.speed = 0; this.alive = true; this.finished = false;
    this.checkpoint = 0; this.fitness = 0; this.steps = 0; this.stepsWithoutProgress = 0;
    this.sensorReadings = Array(SENSOR_ANGLES.length).fill(0);
    this.closestDistance = Infinity;
  }
  sense() {
    const segments = [...lineSegments(currentTrack.outer), ...lineSegments(currentTrack.inner)];
    this.sensorReadings = SENSOR_ANGLES.map(offset => {
      const angle = this.angle + offset;
      let minDistance = SENSOR_RANGE;
      for (const [a, b] of segments) {
        const hit = raySegmentIntersection({ x: this.x, y: this.y }, angle, a, b);
        if (hit !== null && hit < minDistance) minDistance = hit;
      }
      return minDistance / SENSOR_RANGE;
    });
    return this.sensorReadings;
  }
  update() {
    if (!this.alive || this.finished) return;
    this.steps++; this.stepsWithoutProgress++;
    const inputs = this.sense();
    const [turn, accel] = this.brain.think(inputs);
    this.speed += accel * 0.16 + 0.055;
    this.speed = clamp(this.speed, 0.9, 4.4);
    this.angle += turn * 0.09;
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;
    const pos = { x: this.x, y: this.y };
    if (!onRoad(pos, currentTrack)) {
      this.alive = false;
      this.fitness -= 120;
      return;
    }
    const target = currentTrack.checkpoints[this.checkpoint];
    if (target) {
      const d = dist(pos, target);
      if (d < this.closestDistance) {
        this.fitness += (this.closestDistance === Infinity ? 0 : (this.closestDistance - d) * 0.08);
        this.closestDistance = d;
      }
      if (d < 62) {
        this.checkpoint++;
        this.stepsWithoutProgress = 0;
        this.closestDistance = Infinity;
        this.fitness += 650 + this.speed * 20;
        if (this.checkpoint >= currentTrack.checkpoints.length) {
          this.finished = true;
          this.alive = false;
          this.fitness += 8000 - this.steps * 2;
          statusText.textContent = 'chegou ao final da pista';
        }
      }
    }
    this.fitness += this.speed * 0.18;
    if (this.stepsWithoutProgress > MAX_STEPS_WITHOUT_PROGRESS) {
      this.alive = false;
      this.fitness -= 90;
    }
  }
  draw(showSensors = false) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = this.finished ? '#22c55e' : this.color;
    ctx.fillRect(-11, -6, 22, 12);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(3, -4, 6, 8);
    ctx.restore();
    if (showSensors) {
      ctx.strokeStyle = 'rgba(250,204,21,0.35)';
      ctx.lineWidth = 1;
      this.sensorReadings.forEach((reading, i) => {
        const angle = this.angle + SENSOR_ANGLES[i];
        const len = reading * SENSOR_RANGE;
        ctx.beginPath(); ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + Math.cos(angle) * len, this.y + Math.sin(angle) * len);
        ctx.stroke();
      });
    }
  }
}

let currentTrackIndex = 0;
let currentTrack = tracks[currentTrackIndex];
let population = [];
let bestBrain = null;
let bestFitness = -Infinity;
let generation = 0;
let mode = 'stopped';
let animationId = null;
let testCar = null;
let savedBrains = loadSavedBrains();
let autoTrainingAll = false;
let autoTrackIndex = 0;
let testAllQueue = [];
let testAllResults = [];

function loadSavedBrains() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}
function persistSavedBrains() { localStorage.setItem(STORAGE_KEY, JSON.stringify(savedBrains)); }
function setTrack(index, reset = true) {
  currentTrackIndex = index;
  currentTrack = tracks[index];
  trackSelect.value = String(index);
  if (reset) {
    generation = 0; bestFitness = -Infinity; bestBrain = null; testCar = null; createPopulation();
  }
}
function createPopulation(seedBrain = null) {
  population = [];
  for (let i = 0; i < POPULATION_SIZE; i++) {
    let brain = seedBrain ? seedBrain.clone() : new Brain();
    if (seedBrain && i >= ELITE_COUNT) brain.mutate(0.15);
    population.push(new Car(brain));
  }
}
function selectParent(sorted) {
  const pool = sorted.slice(0, Math.max(10, Math.floor(sorted.length * 0.28)));
  return pool[Math.floor(Math.random() * pool.length)];
}
function saveCurrentBest() {
  if (!bestBrain) return false;
  savedBrains[currentTrackIndex] = {
    trackName: currentTrack.name,
    weights: bestBrain.weights,
    fitness: bestFitness,
    generation,
    date: new Date().toISOString()
  };
  persistSavedBrains();
  return true;
}
function nextGeneration() {
  const sorted = [...population].sort((a, b) => b.fitness - a.fitness);
  if (sorted[0].fitness > bestFitness) {
    bestFitness = sorted[0].fitness;
    bestBrain = sorted[0].brain.clone();
  }
  const finished = sorted.find(c => c.finished);
  if (finished) {
    bestBrain = finished.brain.clone();
    bestFitness = Math.max(bestFitness, finished.fitness);
    saveCurrentBest();
    if (autoTrainingAll) moveToNextAutoTrack('completou');
  }
  const next = [];
  for (let i = 0; i < ELITE_COUNT; i++) next.push(new Car(sorted[i].brain.clone(), 'rgba(34,197,94,0.9)'));
  while (next.length < POPULATION_SIZE) {
    const p1 = selectParent(sorted), p2 = selectParent(sorted);
    const childBrain = Brain.crossover(p1.brain, p2.brain);
    childBrain.mutate();
    next.push(new Car(childBrain));
  }
  population = next;
  generation++;
  if (autoTrainingAll && generation >= MAX_TRAIN_GENERATIONS_PER_TRACK) moveToNextAutoTrack('limite de gerações');
}
function moveToNextAutoTrack(reason) {
  saveCurrentBest();
  autoTrackIndex++;
  if (autoTrackIndex >= tracks.length) {
    autoTrainingAll = false;
    mode = 'stopped';
    statusText.textContent = 'treinamento das 3 pistas finalizado';
    return;
  }
  setTrack(autoTrackIndex, true);
  const seed = savedBrains[autoTrackIndex]?.weights ? new Brain(savedBrains[autoTrackIndex].weights) : null;
  if (seed) createPopulation(seed);
  mode = 'training';
  statusText.textContent = `treinando ${currentTrack.name} (${reason} na anterior)`;
}
function drawTrack(track) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#064e3b'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#334155'; ctx.beginPath();
  track.outer.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#064e3b'; ctx.beginPath();
  track.inner.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 3;
  ctx.beginPath(); track.outer.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)); ctx.closePath(); ctx.stroke();
  ctx.beginPath(); track.inner.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)); ctx.closePath(); ctx.stroke();
  track.checkpoints.forEach((cp, i) => {
    ctx.fillStyle = i === track.checkpoints.length - 1 ? '#22c55e' : 'rgba(251,191,36,0.7)';
    ctx.beginPath(); ctx.arc(cp.x, cp.y, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111827'; ctx.font = '12px Arial'; ctx.fillText(String(i + 1), cp.x + 10, cp.y + 4);
  });
  ctx.fillStyle = '#60a5fa'; ctx.beginPath(); ctx.arc(track.start.x, track.start.y, 10, 0, Math.PI * 2); ctx.fill();
}
function updateStats() {
  modeText.textContent = mode;
  generationText.textContent = generation;
  aliveText.textContent = mode.includes('testing') ? (testCar && testCar.alive ? 1 : 0) : population.filter(c => c.alive).length;
  bestFitnessText.textContent = Math.round(bestFitness === -Infinity ? 0 : bestFitness);
  const bestCar = mode.includes('testing') ? testCar : [...population].sort((a, b) => b.checkpoint - a.checkpoint || b.fitness - a.fitness)[0];
  checkpointText.textContent = bestCar ? `${bestCar.checkpoint}/${currentTrack.checkpoints.length}` : '0';
  const saved = tracks.map((_, i) => savedBrains[i] ? `P${i + 1}✅` : `P${i + 1}❌`).join(' ');
  savedText.textContent = saved;
}
function startNextAllTest() {
  if (testAllQueue.length === 0) {
    mode = 'stopped';
    const ok = testAllResults.filter(r => r.ok).length;
    allTestText.textContent = `${ok}/3 concluídas: ${testAllResults.map(r => `P${r.track + 1} ${r.ok ? '✅' : '❌'}`).join(' | ')}`;
    statusText.textContent = ok === 3 ? 'aprovado nas 3 pistas' : 'alguma pista ainda precisa treinar mais';
    return;
  }
  const idx = testAllQueue.shift();
  setTrack(idx, false);
  const data = savedBrains[idx];
  if (!data) {
    testAllResults.push({ track: idx, ok: false });
    startNextAllTest(); return;
  }
  bestBrain = new Brain(data.weights);
  bestFitness = data.fitness || 0;
  testCar = new Car(bestBrain.clone(), 'rgba(34,197,94,0.95)');
  mode = 'testingAll';
  statusText.textContent = `testando ${currentTrack.name}`;
}
function loop() {
  drawTrack(currentTrack);
  if (mode === 'training') {
    // Atualiza duas vezes por frame para acelerar o treinamento sem mudar a lógica.
    for (let step = 0; step < 2; step++) {
      population.forEach(car => car.update());
      if (population.every(c => !c.alive)) nextGeneration();
    }
    population.forEach(car => car.draw(false));
    const leader = [...population].sort((a, b) => b.fitness - a.fitness)[0];
    if (leader) leader.draw(true);
  } else if (mode === 'testing' || mode === 'testingAll') {
    if (testCar) {
      testCar.update(); testCar.draw(true);
      if (testCar.finished) {
        if (mode === 'testingAll') {
          testAllResults.push({ track: currentTrackIndex, ok: true });
          startNextAllTest();
        } else statusText.textContent = 'teste concluído: chegou ao final';
      }
      if (!testCar.alive && !testCar.finished) {
        if (mode === 'testingAll') {
          testAllResults.push({ track: currentTrackIndex, ok: false });
          startNextAllTest();
        } else statusText.textContent = 'teste falhou: bateu ou parou';
      }
    }
  } else if (bestBrain) {
    const preview = new Car(bestBrain.clone(), 'rgba(34,197,94,0.9)');
    preview.draw(false);
  }
  updateStats();
  animationId = requestAnimationFrame(loop);
}
function startTraining() {
  autoTrainingAll = false;
  mode = 'training';
  statusText.textContent = `treinando ${currentTrack.name}`;
  if (population.length === 0) createPopulation();
}
function startTrainingAll() {
  autoTrainingAll = true;
  autoTrackIndex = 0;
  setTrack(0, true);
  mode = 'training';
  statusText.textContent = 'treinando automaticamente as 3 pistas';
}
function startTesting() {
  const saved = savedBrains[currentTrackIndex];
  if (saved) {
    bestBrain = new Brain(saved.weights); bestFitness = saved.fitness || 0;
  } else if (!bestBrain) {
    statusText.textContent = 'treine ou carregue uma IA para esta pista primeiro'; return;
  }
  mode = 'testing';
  testCar = new Car(bestBrain.clone(), 'rgba(34,197,94,0.95)');
  statusText.textContent = `testando melhor da ${currentTrack.name}`;
}
function startTestingAll() {
  testAllResults = [];
  testAllQueue = [0, 1, 2];
  allTestText.textContent = 'testando...';
  startNextAllTest();
}
function resetAll() {
  generation = 0; bestFitness = -Infinity; bestBrain = null; testCar = null;
  autoTrainingAll = false; mode = 'stopped'; createPopulation();
  statusText.textContent = 'reiniciado';
}

trackSelect.addEventListener('change', () => {
  setTrack(Number(trackSelect.value), true);
  mode = 'stopped';
  statusText.textContent = `pista selecionada: ${currentTrack.name}`;
});
trainBtn.addEventListener('click', startTraining);
trainAllBtn.addEventListener('click', startTrainingAll);
testBtn.addEventListener('click', startTesting);
testAllBtn.addEventListener('click', startTestingAll);
stopBtn.addEventListener('click', () => { autoTrainingAll = false; mode = 'stopped'; statusText.textContent = 'pausado'; });
resetBtn.addEventListener('click', resetAll);
saveBtn.addEventListener('click', () => {
  if (!saveCurrentBest()) { statusText.textContent = 'nenhum indivíduo treinado para salvar'; return; }
  statusText.textContent = `melhor da ${currentTrack.name} salvo no navegador`;
});
loadBtn.addEventListener('click', () => {
  savedBrains = loadSavedBrains();
  const data = savedBrains[currentTrackIndex];
  if (!data) { statusText.textContent = 'não existe IA salva para esta pista'; return; }
  bestBrain = new Brain(data.weights); bestFitness = data.fitness || 0;
  statusText.textContent = `IA salva da ${currentTrack.name} carregada`;
});
downloadBtn.addEventListener('click', () => {
  if (Object.keys(savedBrains).length === 0 && !bestBrain) { statusText.textContent = 'treine antes de baixar o JSON'; return; }
  const data = Object.keys(savedBrains).length ? savedBrains : { [currentTrackIndex]: { weights: bestBrain.weights, fitness: bestFitness } };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'melhores_individuos_por_pista.json';
  a.click();
});

createPopulation();
loop();
