"use client";

import { useEffect, useRef } from "react";

/* 180 x 90 land/ocean bitmap (2 degree cells), packed 8 cells per byte, base64.
   Generated from Natural Earth 110m land polygons. */
const MASK_B64 =
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAfAP8HAAAAAAAAAAAAAAAAAAAAAADo//z//wcAAAAAAAACAAAAAAAAAAAAhvvw//8PAPABAAAAwAMAAAAAAAAAwADkw////wEABAAAAABgAAAAAAAAAADAUT8A/v8PAAAAAAwA/j8AuAEAAAAAcBHtDcD/fwAAAAAwAPz/fwMAABCAAQD5w/wD8P8FAAAcAIL7//9//xOAAP/ff0668QD/HwAA+A8At///////v3/w/////x8++B8AAOD/1//7////////jP////+/+AE/gAcAn9f//////////w/w/////wEs4AEAAHz+////////////gL////8HeAAcAADg5///////////9ADgAf7/f4AnAAAAAH78////////H0QAAAiA//8f8AcAAIBB4////////38ADwAQAOD//5//AQAAHAT/////////A3AAAAAA/v//+T8AAGDz//////////8DAQAAAMD/////AwAAsP//////////LwAAAAAA6P///2IAAAD+//////////8CAAAAAAD///8/CAAA4P//////////JwAAAAAA8P///wYAAAD+/unz/////z8AAAAAAAD///8HAAAA/pgPPP//////MQAAAAAA8P//PwAAAMBD9v7n/////wcBAAAAAAD///8AAAAAPkD7f/7///8hEAAAAAAA4P//DwAAAIDhAv/n////f8YAAAAAAAD8//8AAAAA+AdE//////8jDwAAAAAAgP//AwAAAMD/APD/////PxgAAAAAAADw/x8AAAAA/n/v//////8HAAAAAAAAAPwDAgAAAOD////7////fwAAAAAAAACgHyAAAACA//9/f/7///8DAAAAAAAAAPQBAAAAAPj//+cv+P//PwAAAAAAAAAAHjAAAADA/////g/+//8EAAAAAAAAAOBhCAAAAP7//99/4D//AAAAAAAAAAAAPAMEAADA////+Qf84BcAAAAAAAAAAAA/AAAAAPz//58fgAf+QAAAAAAAAAAAAA8AAADg////ewA4gA8EAAAAAAAAAADAAAAAAPz//38BgAP4QQAAAAAAAAAAAAgPAADA////zwAwgAwQAAAAAAAAAAAA9Q8AAPj///8HAAVIAAAAAAAAAAAAAID/AQAA////fwBAAAAQAAAAAAAAAAAA+P8AAGDh//8DAAA0GAAAAAAAAAAAAID/HwAAAPj/HwAAgMIBAAAAAAAAAAAA/P8BAACA//8AAAAYXgAAAAAAAAAAAMD/fwAAAPz/BwAAAOOBAQAAAAAAAAAA/P8/AACA/z8AAABgbtQBAAAAAAAAAOD//w8AAPD/AwAAAAQIeAAAAAAAAAAA/P//AQAA/z8AAACAA4APAQAAAAAAAID//w8AAPD/AwAAAAARsEAAAAAAAAAA+P9/AAAA/j8AAAAAAAAAAAAAAAAAAAD//wcAAPD/QwAAAACAIwAAAAAAAAAA8P9/AAAA/z8EAAAAAD8GIAAAAAAAAAD8/wMAAPD/cQAAAAD4ZwAAAAAAAAAAgP8/AAAA/w8HAAAAgP8HAAAAAAAAAAD4/wMAAOD/MAAAAAD//wEBAAAAAAAAgP8PAAAA/g8DAAAA+P8fAAAAAAAAAAD4PwAAAOB/EAAAAID//wMAAAAAAAAAgP8DAAAA/AMAAAAA+P9/AAAAAAAAAAD8HwAAAMA/AAAAAID//wcAAAAAAAAAwP8BAAAA+AEAAAAA8P9/AAAAAAAAAAD8DwAAAIAPAAAAAAAP/gMAAAAAAAAAwB8AAAAAAAAAAAAAEIAfAAEAAAAAAAD+AwAAAAAAAAAAAAAA8AEgAAAAAAAA4AcAAAAAAAAAAAAAAAAAAAYAAAAAAABeAAAAAAAAAAAAAAAAwAAwAAAAAAAAwAMAAAAAAAAAAAAAAAAIgAEAAAAAAAAeAAAAAAAAAAAAAAAAAAAMAAAAAAAA4AEAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAAAAAAAAAAABAAAAAAAAAAAAAAAAcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAB4AEDwn/8HAAAAAAAAAAAwAAAAAACA/P/h/////w8AAAAAAAAAwAcAAAD4////z///////PwAAAAAAHALwAACA//////////////8HAADw/y///wMAAP7/////////////HwAA+P///38AAID///////////////8AAPL/////BwAO////////////////DwAA8P////8HEPD//////////////z8AAOD/////////////////////////H/AfwP//////////////////////////////////////////////////////////////////////////////////////";

const MW = 180;
const MH = 90;

/* Cities where Skilho users are: [lat, lon] */
const CITIES: [number, number][] = [
  [12.97, 77.59], // Bengaluru
  [17.38, 78.48], // Hyderabad
  [13.08, 80.27], // Chennai
  [19.07, 72.88], // Mumbai
  [28.61, 77.21], // Delhi
];

function decodeMask(): Uint8Array {
  const bin = atob(MASK_B64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function isLand(mask: Uint8Array, lat: number, lon: number) {
  const x = Math.min(MW - 1, Math.max(0, Math.floor((lon + 180) / 2)));
  const y = Math.min(MH - 1, Math.max(0, Math.floor((90 - lat) / 2)));
  const i = y * MW + x;
  return (mask[i >> 3] >> (i & 7)) & 1;
}

export default function Globe() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    /* ---- build land points on a Fibonacci sphere (once) ---- */
    const mask = decodeMask();
    const N = 30000;
    const golden = Math.PI * (3 - Math.sqrt(5));
    const sinLat: number[] = [];
    const cosLat: number[] = [];
    const lonRad: number[] = [];
    const bucket: number[] = [];
    for (let i = 0; i < N; i++) {
      const y = 1 - (2 * (i + 0.5)) / N;
      const lat = Math.asin(y);
      let lon = ((i * golden) % (2 * Math.PI)) - Math.PI;
      if (lon < -Math.PI) lon += 2 * Math.PI;
      if (isLand(mask, (lat * 180) / Math.PI, (lon * 180) / Math.PI)) {
        sinLat.push(Math.sin(lat));
        cosLat.push(Math.cos(lat));
        lonRad.push(lon);
        const a = Math.abs((lat * 180) / Math.PI), j = Math.random();
        bucket.push(a > 68 ? 0 : a > 55 ? (j < 0.8 ? 1 : 2) : a > 35 ? (j < 0.7 ? 2 : 3) : a > 16 ? (j < 0.55 ? 4 : j < 0.8 ? 3 : 2) : (j < 0.8 ? 5 : 2));
      }
    }
    const count = sinLat.length;

    const cities = CITIES.map(([la, lo]) => {
      const p = (la * Math.PI) / 180;
      return { sin: Math.sin(p), cos: Math.cos(p), lon: (lo * Math.PI) / 180 };
    });

    /* ---- state ---- */
    let size = 0;
    let dpr = 1;
    let rot = (-78 * Math.PI) / 180; // start facing India
    const tilt = 0.38;
    const cosT = Math.cos(tilt);
    const sinT = Math.sin(tilt);
    let dragging = false;
    let lastX = 0;
    let raf = 0;
    let visible = true;
    let last = performance.now();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function resize() {
      const w = wrap!.clientWidth;
      if (!w) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = w;
      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(w * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(now: number) {
      if (!size) return;
      const c = ctx!;
      const cx = size / 2;
      const cy = size / 2;
      const R = size * 0.42;
      c.clearRect(0, 0, size, size);

      /* atmosphere glow */
      const glow = c.createRadialGradient(cx, cy, R * 0.96, cx, cy, R * 1.22);
      glow.addColorStop(0, "rgba(90,170,255,0.45)");
      glow.addColorStop(0.5, "rgba(90,170,255,0.14)");
      glow.addColorStop(1, "rgba(90,170,255,0)");
      c.fillStyle = glow;
      c.beginPath();
      c.arc(cx, cy, R * 1.22, 0, Math.PI * 2);
      c.fill();

      /* ocean sphere */
      const ocean = c.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
      ocean.addColorStop(0, "#4aa3df");
      ocean.addColorStop(0.55, "#1f6fb5");
      ocean.addColorStop(1, "#0b3a73");
      c.fillStyle = ocean;
      c.beginPath();
      c.arc(cx, cy, R, 0, Math.PI * 2);
      c.fill();

      /* land dots */
      const dot = Math.max(1.2, size * 0.0042);
      const LAND = ["#f2f7fb", "#3f7f55", "#4f9a56", "#6aa84f", "#c9a766", "#2d8a4a"];
      for (let b = 0; b < LAND.length; b++) {
        c.fillStyle = LAND[b];
        for (let i = 0; i < count; i++) {
          if (bucket[i] !== b) continue;
          const lam = lonRad[i] + rot;
          const x3 = cosLat[i] * Math.sin(lam);
          const y3 = sinLat[i];
          const z3 = cosLat[i] * Math.cos(lam);
          const zz = y3 * sinT + z3 * cosT;
          if (zz <= 0) continue;
          const yy = y3 * cosT - z3 * sinT;
          c.globalAlpha = 0.45 + 0.55 * Math.pow(zz, 0.5);
          c.beginPath();
          c.arc(cx + R * x3, cy - R * yy, dot * (0.7 + 0.5 * zz), 0, Math.PI * 2);
          c.fill();
        }
      }
      c.globalAlpha = 1;

      /* city markers with pulse */
      const t = now / 1000;
      cities.forEach((ct, i) => {
        const lam = ct.lon + rot;
        const x3 = ct.cos * Math.sin(lam);
        const y3 = ct.sin;
        const z3 = ct.cos * Math.cos(lam);
        const zz = y3 * sinT + z3 * cosT;
        if (zz <= 0.05) return;
        const yy = y3 * cosT - z3 * sinT;
        const px = cx + R * x3;
        const py = cy - R * yy;
        const phase = (t * 0.9 + i * 0.35) % 1;
        c.globalAlpha = (1 - phase) * 0.55 * zz;
        c.strokeStyle = "#f2a43a";
        c.lineWidth = 1.5;
        c.beginPath();
        c.arc(px, py, 4 + phase * 16, 0, Math.PI * 2);
        c.stroke();
        c.globalAlpha = Math.min(1, zz + 0.2);
        c.fillStyle = "#f2a43a";
        c.beginPath();
        c.arc(px, py, 4.2, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#ffffff";
        c.beginPath();
        c.arc(px, py, 1.6, 0, Math.PI * 2);
        c.fill();
      });
      c.globalAlpha = 1;

      /* soft lighting over the sphere */
      const shade = c.createRadialGradient(cx - R * 0.4, cy - R * 0.45, R * 0.2, cx, cy, R * 1.02);
      shade.addColorStop(0, "rgba(255,255,255,0.22)");
      shade.addColorStop(0.55, "rgba(255,255,255,0)");
      shade.addColorStop(1, "rgba(3,18,45,0.55)");
      c.fillStyle = shade;
      c.beginPath();
      c.arc(cx, cy, R, 0, Math.PI * 2);
      c.fill();
    }

    function frame(now: number) {
      const dt = Math.min(50, now - last);
      last = now;
      if (!dragging) rot += dt * 0.00016; // slow eastward spin
      draw(now);
      if (visible) raf = requestAnimationFrame(frame);
    }

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) draw(performance.now());
    });
    ro.observe(wrap);

    if (reduce) {
      draw(performance.now());
    } else {
      raf = requestAnimationFrame(frame);
    }

    /* pause when scrolled out of view */
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !reduce) {
        last = performance.now();
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(frame);
      }
    });
    io.observe(wrap);

    /* drag to spin */
    const down = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      canvas.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      rot += ((e.clientX - lastX) / size) * 4;
      lastX = e.clientX;
      if (reduce) draw(performance.now());
    };
    const up = () => {
      dragging = false;
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative mx-auto aspect-square w-full max-w-[34rem]">
      {/* pulsing glow behind the planet */}
      <div className="absolute inset-[12%] animate-pulse rounded-full bg-violet-400/30 blur-3xl" />
      {/* slow orbit rings */}
      <div className="animate-spin-slow absolute inset-[3%] rounded-full border border-dashed border-violet-300/70">
        <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-violet-500 shadow-[0_0_14px_4px_rgba(139,92,246,0.6)]" />
      </div>
      <div className="animate-spin-reverse absolute inset-[-2%] rounded-full border border-violet-200/60">
        <span className="absolute bottom-[14%] right-[3%] h-2 w-2 rounded-full bg-fuchsia-400 shadow-[0_0_10px_3px_rgba(217,70,239,0.5)]" />
      </div>
      <canvas
        ref={canvasRef}
        className="relative h-full w-full cursor-grab touch-pan-y active:cursor-grabbing"
        aria-label="Rotating globe showing cities where Skilho is used"
        role="img"
      />
    </div>
  );
}