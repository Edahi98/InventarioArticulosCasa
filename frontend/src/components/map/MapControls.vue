<script setup lang="ts">
defineProps<{ hour: number; clock: string; isNight: boolean; manualHour: boolean; disabled: boolean }>();
defineEmits<{ scrub: [event: Event]; follow: []; walk: []; reset: [] }>();
</script>

<template>
  <div class="tray" role="group" aria-label="Controles de la isla">
    <div class="dial" :class="{ 'is-night': isNight }">
      <span class="notch" style="left: 25%" aria-hidden="true" />
      <span class="notch" style="left: 50%" aria-hidden="true" />
      <span class="notch" style="left: 75%" aria-hidden="true" />
      <label class="sr-only" for="neighborhood-hour">Hora del día en la isla</label>
      <input
        id="neighborhood-hour"
        type="range"
        min="0"
        max="24"
        step="0.25"
        :value="hour"
        :disabled="disabled"
        class="sky-range"
        :style="{ '--fill': `${(hour / 24) * 100}%` }"
        @input="$emit('scrub', $event)"
      />
    </div>

    <div class="clock" aria-live="off">
      <span class="clock-time">{{ clock }}</span>
      <button v-if="manualHour" type="button" class="now" @click="$emit('follow')">Ahora</button>
    </div>

    <div class="arcade">
      <button type="button" class="paw" :disabled="disabled" aria-label="Caminar por la isla en primera persona" @click="$emit('walk')">
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <g transform="translate(13 29) rotate(-14)">
            <g class="step step-a">
              <ellipse cx="0" cy="3" rx="6" ry="5" />
              <circle cx="-6.5" cy="-4" r="2.6" />
              <circle cx="-2.2" cy="-7.6" r="2.6" />
              <circle cx="2.6" cy="-7.6" r="2.6" />
              <circle cx="6.8" cy="-4" r="2.6" />
            </g>
          </g>
          <g transform="translate(33 17) rotate(14)">
            <g class="step step-b">
              <ellipse cx="0" cy="3" rx="6" ry="5" />
              <circle cx="-6.5" cy="-4" r="2.6" />
              <circle cx="-2.2" cy="-7.6" r="2.6" />
              <circle cx="2.6" cy="-7.6" r="2.6" />
              <circle cx="6.8" cy="-4" r="2.6" />
            </g>
          </g>
        </svg>
      </button>
      <span class="ribbon" aria-hidden="true">Caminar</span>
    </div>

    <button type="button" class="compass" :disabled="disabled" aria-label="Ver toda la isla" @click="$emit('reset')">
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r="16" class="face" />
        <path d="M20 5v3M20 32v3M5 20h3M32 20h3" class="ticks" />
        <g class="needle">
          <path d="M20 8l4.2 12h-8.4z" class="north" />
          <path d="M20 32l-4.2-12h8.4z" class="south" />
        </g>
        <circle cx="20" cy="20" r="2.2" class="pin" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.tray {
  display: flex;
  width: 100%;
  max-width: 40rem;
  align-items: center;
  gap: 0.7rem;
  padding: 0.55rem 0.7rem 0.55rem 0.9rem;
  border: 4px solid #2a1730;
  border-radius: 2rem;
  background: rgb(255 255 255 / 0.93);
  color: #2a1730;
  box-shadow: 0 6px 0 var(--l-toy-edge), 0 20px 32px -18px rgb(0 0 0 / 0.55);
}

.dial {
  position: relative;
  min-width: 0;
  flex: 1;
  height: 2.5rem;
  border: 3px solid #2a1730;
  border-radius: 999px;
  background:
    radial-gradient(ellipse 1.1rem 0.55rem at 47% 38%, rgb(255 255 255 / 0.95) 0 60%, transparent 62%),
    radial-gradient(ellipse 1.4rem 0.6rem at 56% 62%, rgb(255 255 255 / 0.85) 0 60%, transparent 62%),
    linear-gradient(90deg, #1b1f4f 0%, #4a3a8e 12%, #ff9aa8 25%, #ffe9a8 36%, #8fd3f0 50%, #8fd3f0 60%, #ffcf8a 73%, #ff8fb7 82%, #3a2d73 92%, #1b1f4f 100%);
  overflow: hidden;
}
.dial::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle, #fff 0 1px, transparent 1.6px) 0 0 / 0.9rem 0.9rem,
    radial-gradient(circle, #fff 0 0.8px, transparent 1.4px) 0.4rem 0.45rem / 1.3rem 1.2rem;
  -webkit-mask-image: linear-gradient(90deg, #000 0 14%, transparent 26% 82%, #000 92%);
  mask-image: linear-gradient(90deg, #000 0 14%, transparent 26% 82%, #000 92%);
  opacity: 0.85;
  pointer-events: none;
}
.notch {
  position: absolute;
  top: 0;
  width: 2px;
  height: 0.45rem;
  background: rgb(42 23 48 / 0.45);
  pointer-events: none;
}

.sky-range {
  --disc: radial-gradient(circle at 35% 32%, #fffbd0 0 18%, #ffd43b 55%, #ffa400 100%);
  --glow: 0 0 0 3px rgb(255 243 176 / 0.6), 0 0 16px 5px rgb(255 190 40 / 0.75);
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  background: transparent;
  appearance: none;
  -webkit-appearance: none;
  cursor: grab;
}
.is-night .sky-range {
  --disc: radial-gradient(circle at 62% 38%, #c9d0f2 0 9%, transparent 10%), radial-gradient(circle at 36% 62%, #c9d0f2 0 7%, transparent 8%), radial-gradient(circle at 35% 30%, #fff 0 15%, #e6e9ff 55%, #b6bfe8 100%);
  --glow: 0 0 0 3px rgb(200 210 255 / 0.5), 0 0 16px 5px rgb(170 185 255 / 0.65);
}
.sky-range:active { cursor: grabbing; }
.sky-range:disabled { cursor: not-allowed; opacity: 0.6; }
.sky-range:focus-visible { outline: 3px solid #2a1730; outline-offset: 2px; border-radius: 999px; }
.sky-range::-webkit-slider-runnable-track { height: 100%; background: transparent; }
.sky-range::-moz-range-track { height: 100%; background: transparent; }
.sky-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 2.2rem;
  height: 2.2rem;
  border: 3px solid #2a1730;
  border-radius: 50%;
  background: var(--disc);
  box-shadow: var(--glow);
  transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.sky-range::-moz-range-thumb {
  width: 1.9rem;
  height: 1.9rem;
  border: 3px solid #2a1730;
  border-radius: 50%;
  background: var(--disc);
  box-shadow: var(--glow);
}
.sky-range:active::-webkit-slider-thumb { transform: scale(1.18); }

.clock {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  flex-shrink: 0;
}
.clock-time {
  min-width: 5.2rem;
  padding: 0.28rem 0.7rem;
  border-radius: 0.8rem;
  background: #2a1730;
  color: #fff6dc;
  font-family: var(--l-display);
  font-size: 0.95rem;
  text-align: center;
  font-variant-numeric: tabular-nums;
  box-shadow: inset 0 -3px 0 rgb(255 255 255 / 0.12);
}
.now {
  margin-top: -0.1rem;
  padding: 0 0.6rem;
  border-radius: 999px;
  background: #ffe3ee;
  color: #c4235f;
  font-size: 0.7rem;
  font-weight: 900;
  line-height: 1.2rem;
}

.arcade {
  position: relative;
  flex-shrink: 0;
  width: 4rem;
  height: 3.2rem;
}
.paw {
  position: absolute;
  left: 50%;
  bottom: 0.15rem;
  width: 4.1rem;
  height: 4.1rem;
  margin-left: -2.05rem;
  display: grid;
  place-items: center;
  border: 4px solid #2a1730;
  border-radius: 50%;
  background: radial-gradient(circle at 34% 28%, #ffc2d6 0 14%, #ff8fb7 52%, #ff5f98 100%);
  box-shadow: 0 6px 0 #c4235f, 0 12px 14px -6px rgb(196 35 95 / 0.6);
  transform: translateY(-0.5rem);
  transition: transform 0.14s ease, box-shadow 0.14s ease;
}
.paw:hover:not(:disabled) { transform: translateY(-0.7rem) rotate(-4deg); }
.paw:active:not(:disabled) { transform: translateY(-0.1rem); box-shadow: 0 1px 0 #c4235f, 0 4px 8px -4px rgb(196 35 95 / 0.6); }
.paw:focus-visible { outline: 3px solid #2a1730; outline-offset: 4px; }
.paw:disabled { filter: grayscale(0.6); opacity: 0.6; cursor: not-allowed; }
.paw svg { width: 2.5rem; height: 2.5rem; fill: #fff6fa; stroke: #2a1730; stroke-width: 1.4; stroke-linejoin: round; }
.step { animation: paw-step 1.6s ease-in-out infinite; transform-box: fill-box; }
.step-b { animation-delay: 0.8s; }
.paw:hover:not(:disabled) .step { animation-duration: 0.8s; }
.paw:hover:not(:disabled) .step-b { animation-delay: 0.4s; }
.ribbon {
  position: absolute;
  left: 50%;
  bottom: -0.55rem;
  padding: 0 0.55rem;
  border: 2px solid #2a1730;
  border-radius: 999px;
  background: #ffe98a;
  font-size: 0.62rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  line-height: 1.1rem;
  text-transform: uppercase;
  transform: translateX(-50%) rotate(-3deg);
  pointer-events: none;
}

.compass {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 2.9rem;
  height: 2.9rem;
  border: 3px solid #2a1730;
  border-radius: 50%;
  background: #fff6dc;
  box-shadow: 0 4px 0 var(--l-toy-edge);
  transition: transform 0.14s ease, box-shadow 0.14s ease;
}
.compass:hover:not(:disabled) { transform: translateY(-2px); }
.compass:active:not(:disabled) { transform: translateY(3px); box-shadow: 0 1px 0 var(--l-toy-edge); }
.compass:focus-visible { outline: 3px solid #2a1730; outline-offset: 3px; }
.compass:disabled { opacity: 0.5; cursor: not-allowed; }
.compass svg { width: 2.2rem; height: 2.2rem; }
.face { fill: #fffaf2; stroke: #2a1730; stroke-width: 2; }
.ticks { stroke: #2a1730; stroke-width: 2; stroke-linecap: round; }
.north { fill: #ff4f6d; stroke: #2a1730; stroke-width: 1.2; stroke-linejoin: round; }
.south { fill: #fff; stroke: #2a1730; stroke-width: 1.2; stroke-linejoin: round; }
.pin { fill: #2a1730; }
.needle { transform-origin: 20px 20px; animation: needle-sway 4s ease-in-out infinite; }
.compass:hover:not(:disabled) .needle { animation: needle-spin 0.8s cubic-bezier(0.34, 1.56, 0.64, 1); }

@keyframes paw-step {
  0%, 100% { opacity: 0.35; transform: translateY(2px) scale(0.92); }
  45% { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes needle-sway {
  50% { transform: rotate(14deg); }
}
@keyframes needle-spin {
  to { transform: rotate(360deg); }
}
@media (max-width: 520px) {
  .tray { gap: 0.45rem; padding: 0.5rem 0.55rem; }
  .clock-time { min-width: 4.2rem; font-size: 0.8rem; padding-inline: 0.4rem; }
  .arcade { width: 3.6rem; }
  .paw { width: 3.7rem; height: 3.7rem; margin-left: -1.85rem; }
}
@media (prefers-reduced-motion: reduce) {
  .step, .needle { animation: none; }
  .sky-range::-webkit-slider-thumb, .paw, .compass { transition: none; }
}
</style>
