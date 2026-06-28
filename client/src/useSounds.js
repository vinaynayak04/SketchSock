import { useRef, useState, useCallback, useEffect } from "react";

/**
 * useSounds — Skribbl.io-style synthesized sound effects via Web Audio API.
 * All sounds are generated programmatically: no audio files needed.
 */
export default function useSounds() {
  const ctxRef = useRef(null);
  const [muted, setMuted] = useState(() => {
    try {
      return localStorage.getItem("sketchsock-muted") === "true";
    } catch {
      return false;
    }
  });

  // Persist mute preference
  useEffect(() => {
    try {
      localStorage.setItem("sketchsock-muted", String(muted));
    } catch {
      // ignore
    }
  }, [muted]);

  const getCtx = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      try {
        ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        return null;
      }
    }
    // Resume if suspended (browser autoplay policy)
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  // ─── Utility: Play an oscillator note ──────────────────────────────
  const playTone = useCallback(
    (freq, type = "sine", duration = 0.12, volume = 0.15, startDelay = 0) => {
      if (muted) return;
      const ctx = getCtx();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startDelay);

      const t = ctx.currentTime + startDelay;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(volume, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      osc.start(t);
      osc.stop(t + duration + 0.01);
    },
    [muted, getCtx]
  );

  // ─── Utility: Noise burst (for percussive effects) ─────────────────
  const playNoise = useCallback(
    (duration = 0.05, volume = 0.04) => {
      if (muted) return;
      const ctx = getCtx();
      if (!ctx) return;

      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * volume;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      source.connect(gain);
      gain.connect(ctx.destination);
      source.start();
    },
    [muted, getCtx]
  );

  // ═══════════════════════════════════════════════════════════════════
  // SOUND EFFECTS
  // ═══════════════════════════════════════════════════════════════════

  // 1. Normal timer tick — soft metronome click
  const playTick = useCallback(() => {
    playTone(800, "sine", 0.04, 0.06);
    playNoise(0.02, 0.02);
  }, [playTone, playNoise]);

  // 2. Urgent tick (≤10s) — higher, more noticeable
  const playUrgentTick = useCallback(() => {
    playTone(1200, "square", 0.06, 0.1);
  }, [playTone]);

  // 3. Critical tick (≤5s) — alarming rapid double-beep
  const playCriticalTick = useCallback(() => {
    playTone(1600, "square", 0.06, 0.15);
    playTone(1800, "square", 0.06, 0.12, 0.08);
  }, [playTone]);

  // 4. Correct guess — celebratory rising 3-note arpeggio
  const playCorrectGuess = useCallback(() => {
    playTone(523, "sine", 0.15, 0.2, 0);      // C5
    playTone(659, "sine", 0.15, 0.2, 0.12);   // E5
    playTone(784, "sine", 0.25, 0.25, 0.24);  // G5
    // Sparkle overlay
    playTone(1568, "sine", 0.3, 0.08, 0.3);   // High G6
  }, [playTone]);

  // 5. Someone else guessed — quick positive ping
  const playSomeoneGuessed = useCallback(() => {
    playTone(880, "sine", 0.08, 0.12);
    playTone(1100, "sine", 0.1, 0.1, 0.06);
  }, [playTone]);

  // 6. Word selection appear — ascending whoosh
  const playWordSelect = useCallback(() => {
    if (muted) return;
    const ctx = getCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);

    playNoise(0.08, 0.03);
  }, [muted, getCtx, playNoise]);

  // 7. Round start — confident ascending horn blast
  const playRoundStart = useCallback(() => {
    playTone(440, "sawtooth", 0.15, 0.1, 0);     // A4
    playTone(554, "sawtooth", 0.15, 0.1, 0.1);   // C#5
    playTone(659, "sawtooth", 0.2, 0.12, 0.2);   // E5
    playTone(880, "triangle", 0.3, 0.08, 0.3);   // A5 sustain
  }, [playTone]);

  // 8. Round end / Word reveal — descending reveal
  const playRoundEnd = useCallback(() => {
    playTone(880, "sine", 0.15, 0.12, 0);
    playTone(698, "sine", 0.15, 0.1, 0.12);
    playTone(523, "sine", 0.25, 0.1, 0.24);
    playNoise(0.06, 0.03);
  }, [playTone, playNoise]);

  // 9. Game over — victory fanfare
  const playGameOver = useCallback(() => {
    // Fanfare: C-E-G-C (octave)
    playTone(523, "triangle", 0.2, 0.15, 0);     // C5
    playTone(659, "triangle", 0.2, 0.15, 0.18);  // E5
    playTone(784, "triangle", 0.2, 0.15, 0.36);  // G5
    playTone(1047, "triangle", 0.4, 0.2, 0.54);  // C6

    // Sparkle top notes
    playTone(1568, "sine", 0.3, 0.06, 0.7);
    playTone(2093, "sine", 0.4, 0.04, 0.85);
  }, [playTone]);

  // 10. Player join — welcoming ascending chime
  const playPlayerJoin = useCallback(() => {
    playTone(600, "sine", 0.1, 0.08, 0);
    playTone(800, "sine", 0.12, 0.08, 0.08);
  }, [playTone]);

  // 11. Player leave — sad descending tone
  const playPlayerLeave = useCallback(() => {
    playTone(600, "sine", 0.1, 0.07, 0);
    playTone(440, "sine", 0.15, 0.06, 0.08);
  }, [playTone]);

  // 12. Close guess — wobbly warning
  const playCloseGuess = useCallback(() => {
    if (muted) return;
    const ctx = getCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "triangle";
    osc.frequency.setValueAtTime(500, ctx.currentTime);
    // Wobble effect via rapid frequency modulation
    for (let i = 0; i < 6; i++) {
      const t = ctx.currentTime + i * 0.06;
      osc.frequency.setValueAtTime(i % 2 === 0 ? 520 : 480, t);
    }

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  }, [muted, getCtx]);

  // 13. Chat send — soft pop
  const playChatSend = useCallback(() => {
    playTone(600, "sine", 0.05, 0.06);
    playNoise(0.02, 0.015);
  }, [playTone, playNoise]);

  // 14. Button hover — ultra-subtle tick
  const playButtonHover = useCallback(() => {
    playTone(1000, "sine", 0.02, 0.03);
  }, [playTone]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setMuted((prev) => !prev);
  }, []);

  return {
    muted,
    toggleMute,

    // Timer sounds
    playTick,
    playUrgentTick,
    playCriticalTick,

    // Game event sounds
    playCorrectGuess,
    playSomeoneGuessed,
    playWordSelect,
    playRoundStart,
    playRoundEnd,
    playGameOver,

    // Player events
    playPlayerJoin,
    playPlayerLeave,

    // UI sounds
    playCloseGuess,
    playChatSend,
    playButtonHover,
  };
}
