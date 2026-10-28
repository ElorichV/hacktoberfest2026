/** Ambient drone that slowly orbits the listener (Web Audio HRTF panner). Returns a stop fn. Call only from a user gesture. */
export function startSpatialAudio(): () => void {
  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 2.5);

  // Long reverb tail for "immensity"
  const len = ctx.sampleRate * 4;
  const ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  }
  const verb = ctx.createConvolver();
  verb.buffer = ir;
  verb.connect(master);
  master.connect(ctx.destination);

  const voices = [55, 82.4, 110, 164.8, 220].map((f, i) => {
    const osc = ctx.createOscillator();
    osc.type = i % 2 ? "triangle" : "sine";
    osc.frequency.value = f;
    osc.detune.value = (i - 2) * 6;
    const g = ctx.createGain();
    g.gain.value = 0.18 / (i + 1);
    const pan = new PannerNode(ctx, { panningModel: "HRTF", distanceModel: "inverse" });
    osc.connect(g).connect(pan);
    pan.connect(verb);
    pan.connect(master);
    osc.start();
    return { osc, pan, phase: (i / 5) * Math.PI * 2, speed: 0.08 + i * 0.03 };
  });

  let raf = 0;
  const tick = () => {
    const t = ctx.currentTime;
    for (const v of voices) {
      const a = v.phase + t * v.speed;
      v.pan.positionX.value = Math.cos(a) * 4;
      v.pan.positionZ.value = Math.sin(a) * 4;
      v.pan.positionY.value = Math.sin(a * 0.5) * 1.5;
    }
    raf = requestAnimationFrame(tick);
  };
  tick();

  return () => {
    cancelAnimationFrame(raf);
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
    setTimeout(() => { voices.forEach((v) => v.osc.stop()); void ctx.close(); }, 700);
  };
}
