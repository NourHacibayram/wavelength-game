"""Small sample-based renderer for looping game music.

Notes are played with FluidR3_GM instrument samples (CC BY 3.0, Frank Wen,
served by gleitz/midi-js-soundfonts). Drums are synthesised here.

Every track is rendered as a perfect circle: anything that rings past the
loop end (note tails, reverb) is folded back onto the start, so the loop has
no seam. The exported file carries PAD seconds of wrapped audio on both sides;
the player loops between `loop_start` and `loop_end`, which stays seamless even
when a browser's MP3 decoder shifts the audio by a few milliseconds.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import urllib.request
from dataclasses import dataclass, field

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 44100
PAD = 22 * 1152 / 44100  # ~0.57 s of wrapped audio around the loop, frame aligned
HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, '.cache')
SAMPLE_BASE = 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM'

NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
_NOTE_RE = re.compile(r'^([A-G])(#|b|~)?(-?\d)$')
_rng = np.random.default_rng(7)


def midi(note: str | float | int) -> float:
    """'D4' -> 62, 'Bb3' -> 58, 'E~4' -> 63.5 (half-flat, for maqam scales)."""
    if isinstance(note, (int, float)):
        return float(note)
    m = _NOTE_RE.match(note)
    if not m:
        raise ValueError(f'bad note {note!r}')
    letter, acc, octv = m.groups()
    n = (int(octv) + 1) * 12 + NAMES.index(letter)
    n += {'#': 1, 'b': -1, '~': -0.5}.get(acc or '', 0)
    return float(n)


def name_of(n: int) -> str:
    return f'{NAMES[n % 12]}{n // 12 - 1}'


# --------------------------------------------------------------------------
# Samples
# --------------------------------------------------------------------------

_samples: dict[tuple[str, int], np.ndarray] = {}
_inst_gain: dict[str, float] = {}


def _load_raw(inst: str, n: int) -> np.ndarray:
    os.makedirs(CACHE, exist_ok=True)
    name = name_of(n)
    raw = os.path.join(CACHE, f'{inst}_{name}.f32')
    if not os.path.exists(raw):
        mp3 = os.path.join(CACHE, f'{inst}_{name}.mp3')
        if not os.path.exists(mp3):
            url = f'{SAMPLE_BASE}/{inst}-mp3/{name}.mp3'
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=20) as r, open(mp3, 'wb') as f:
                f.write(r.read())
        subprocess.run(
            ['ffmpeg', '-y', '-v', 'error', '-i', mp3, '-f', 'f32le', '-ac', '2',
             '-ar', str(SR), raw],
            check=True,
        )
    data = np.fromfile(raw, dtype='<f4').reshape(-1, 2)
    # trim leading silence so notes land on the beat
    lead = np.argmax(np.abs(data).max(axis=1) > 0.002)
    return data[lead:]


def _gain_for(inst: str) -> float:
    """Level instruments against each other using a mid-range reference note."""
    if inst not in _inst_gain:
        ref = _load_raw(inst, 60)
        rms = float(np.sqrt(np.mean(ref[: SR // 2] ** 2)) + 1e-9)
        _inst_gain[inst] = 0.12 / rms
    return _inst_gain[inst]


def sample(inst: str, pitch: float) -> np.ndarray:
    """Stereo sample for any pitch, quarter tones included (resampled)."""
    base = int(round(pitch))
    key = (inst, base)
    if key not in _samples:
        _samples[key] = _load_raw(inst, base) * _gain_for(inst)
    s = _samples[key]
    cents = pitch - base
    if abs(cents) < 1e-6:
        return s
    ratio = 2 ** (cents / 12)
    idx = np.arange(0, len(s) - 1, ratio)
    i0 = idx.astype(int)
    frac = (idx - i0)[:, None]
    return s[i0] * (1 - frac) + s[i0 + 1] * frac


# --------------------------------------------------------------------------
# Synth drums (mono, returned as 1-D arrays)
# --------------------------------------------------------------------------

def _env(n: int, decay: float) -> np.ndarray:
    t = np.arange(n) / SR
    return np.exp(-t / decay)


def _band(x: np.ndarray, lo: float, hi: float) -> np.ndarray:
    sos = butter(2, [lo, hi], btype='band', fs=SR, output='sos')
    return sosfilt(sos, x)


def _hp(x: np.ndarray, f: float) -> np.ndarray:
    return sosfilt(butter(2, f, btype='high', fs=SR, output='sos'), x)


def drum(kind: str) -> np.ndarray:
    n = int(SR * 0.6)
    t = np.arange(n) / SR
    noise = _rng.standard_normal(n)
    if kind == 'kick':
        f = 48 + 90 * np.exp(-t / 0.035)
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * _env(n, 0.22)
        x += 0.25 * _band(noise, 1500, 5000) * _env(n, 0.004)
    elif kind == 'snare':
        x = 0.55 * np.sin(2 * np.pi * 190 * t) * _env(n, 0.06)
        x += 0.7 * _band(noise, 1200, 8000) * _env(n, 0.09)
    elif kind == 'clap':
        x = np.zeros(n)
        for d in (0.0, 0.011, 0.022):
            k = int(d * SR)
            x[k:] += _band(noise, 900, 4000)[: n - k] * _env(n - k, 0.012 if d < 0.02 else 0.11)
    elif kind == 'hat':
        x = _hp(noise, 7000) * _env(n, 0.025)
    elif kind == 'open_hat':
        x = _hp(noise, 6500) * _env(n, 0.16)
    elif kind == 'shaker':
        a = np.minimum(1, t / 0.012)
        x = _band(noise, 5000, 11000) * a * _env(n, 0.035)
    elif kind == 'doum':  # darbuka low stroke
        f = 92 + 70 * np.exp(-t / 0.02)
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * _env(n, 0.17)
        x += 0.18 * _band(noise, 200, 900) * _env(n, 0.01)
    elif kind == 'tak':  # darbuka rim stroke
        x = 0.6 * np.sin(2 * np.pi * 420 * t) * _env(n, 0.03)
        x += 0.9 * _band(noise, 1800, 7000) * _env(n, 0.018)
    elif kind == 'ka':  # soft left-hand tak
        x = 0.5 * _band(noise, 2000, 7000) * _env(n, 0.012)
    elif kind == 'riq':  # frame-drum jingles
        x = _band(noise, 5500, 12000) * _env(n, 0.07)
        x *= 1 + 0.5 * np.sin(2 * np.pi * 38 * t)
    elif kind == 'tick':  # clock tick
        x = _band(noise, 2500, 6000) * _env(n, 0.006)
        x += 0.4 * np.sin(2 * np.pi * 2100 * t) * _env(n, 0.01)
    elif kind == 'tom':
        f = 110 + 60 * np.exp(-t / 0.05)
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * _env(n, 0.2)
    else:
        raise ValueError(kind)
    return (x / (np.max(np.abs(x)) + 1e-9)).astype(np.float32)


_drums: dict[str, np.ndarray] = {}


# --------------------------------------------------------------------------
# Song
# --------------------------------------------------------------------------

@dataclass
class Song:
    bpm: float
    beats: float  # loop length in beats
    swing: float = 0.0  # delays off-beat eighths by this fraction of a beat
    reverb: float = 0.18  # wet level
    events: list = field(default_factory=list)

    @property
    def spb(self) -> float:
        return 60.0 / self.bpm

    def at(self, beat: float) -> float:
        whole = np.floor(beat)
        frac = beat - whole
        if self.swing and abs(frac - 0.5) < 1e-6:
            frac += self.swing
        return (whole + frac) * self.spb

    # ---- adding notes -----------------------------------------------------

    def note(self, inst, pitch, beat, dur, vel=0.8, pan=0.0, legato=1.0):
        self.events.append(('n', inst, midi(pitch), beat, dur * legato, vel, pan))

    def chord(self, inst, pitches, beat, dur, vel=0.6, pan=0.0, strum=0.0, legato=1.0):
        for i, p in enumerate(pitches):
            self.note(inst, p, beat + i * strum, dur, vel * (0.96 ** i), pan, legato)

    def hit(self, kind, beat, vel=0.8, pan=0.0):
        self.events.append(('d', kind, 0, beat, 0, vel, pan))

    def line(self, inst, text, start, vel=0.8, pan=0.0, legato=0.95, octave=0):
        """Write a phrase as 'D4:1 E4:.5 r:.5 F4:2' (pitch:beats, r = rest).
        Returns the beat after the phrase."""
        b = start
        for tok in text.split():
            if tok == '|':
                continue
            p, _, d = tok.partition(':')
            d = float(d or 1)
            if p != 'r':
                accent = 1.0
                if p.endswith('!'):
                    p, accent = p[:-1], 1.15
                self.note(inst, midi(p) + 12 * octave, b, d, min(1.0, vel * accent), pan, legato)
            b += d
        return b

    def pattern(self, text, start, bars, beats_per_bar=4, vel=0.8, pan=0.0, step=0.25):
        """Drum grid per bar, one char per step: 'K' kick, 'S' snare, 'C' clap,
        'h' hat, 'o' open hat, 's' shaker, 'D' doum, 'T' tak, 'k' ka, 'R' riq,
        't' tick, 'm' tom, '.' rest. Uppercase = accent for the light voices."""
        kinds = {'K': 'kick', 'S': 'snare', 'C': 'clap', 'h': 'hat', 'H': 'hat',
                 'o': 'open_hat', 's': 'shaker', 'D': 'doum', 'T': 'tak', 'k': 'ka',
                 'R': 'riq', 'r': 'riq', 't': 'tick', 'm': 'tom'}
        steps = text.replace(' ', '')
        for bar in range(bars):
            for i, ch in enumerate(steps):
                if ch == '.':
                    continue
                v = vel * (0.62 if ch in 'hsrkt' else 1.0)
                self.hit(kinds[ch], start + bar * beats_per_bar + i * step, v, pan)

    # ---- rendering --------------------------------------------------------

    def render(self) -> np.ndarray:
        # Nudge the tempo so the loop is a whole number of MP3 frames (1152
        # samples): then both ends of the loop encode identically.
        L = int(round(self.beats * self.spb * SR / 1152)) * 1152
        self.bpm = self.beats * 60 * SR / L
        tail = int(SR * 6)
        buf = np.zeros((L + tail, 2), dtype=np.float64)

        for kind, inst, pitch, beat, dur, vel, pan in self.events:
            start = int(round(self.at(beat) * SR)) % L
            ang = (pan + 1) * np.pi / 4
            gl, gr = np.cos(ang) * vel, np.sin(ang) * vel
            if kind == 'd':
                if inst not in _drums:
                    _drums[inst] = drum(inst)
                x = _drums[inst]
                end = min(start + len(x), len(buf))
                buf[start:end, 0] += x[: end - start] * gl * 0.5
                buf[start:end, 1] += x[: end - start] * gr * 0.5
                continue
            s = sample(inst, pitch)
            hold = int(max(0.06, dur * self.spb) * SR)
            rel = int(0.12 * SR)
            n = min(len(s), hold + rel, len(buf) - start)
            env = np.ones(n)
            if n > hold:
                k = n - hold
                env[hold:] = 0.5 * (1 + np.cos(np.pi * np.arange(k) / max(1, rel)))
            attack = min(n, int(0.004 * SR))
            env[:attack] *= np.linspace(0, 1, attack)
            buf[start:start + n, 0] += s[:n, 0] * env * gl
            buf[start:start + n, 1] += s[:n, 1] * env * gr

        # fold everything past the loop end back onto the start
        loop = buf[:L].copy()
        rest = buf[L:]
        for k in range(0, len(rest), L):
            seg = rest[k:k + L]
            loop[: len(seg)] += seg

        loop = _hp(loop.T, 30).T
        if self.reverb > 0:
            loop = loop + self.reverb * _circular_reverb(loop)
        return _master(loop)

    def export(self, out_mp3: str, kbps: int = 128) -> dict:
        loop = self.render()
        L = len(loop)
        p = int(PAD * SR)
        full = np.concatenate([loop[-p:], loop, loop[:p]])
        raw = out_mp3 + '.f32'
        full.astype('<f4').tofile(raw)
        subprocess.run(
            ['ffmpeg', '-y', '-v', 'error', '-f', 'f32le', '-ac', '2', '-ar', str(SR),
             '-i', raw, '-codec:a', 'libmp3lame', '-b:a', f'{kbps}k', '-reservoir', '0', out_mp3],
            check=True,
        )
        os.remove(raw)
        return {'loopStart': round(PAD, 6), 'loopEnd': round(PAD + L / SR, 6),
                'seconds': round(L / SR, 2)}


_ir_cache: dict[int, np.ndarray] = {}


def _circular_reverb(x: np.ndarray) -> np.ndarray:
    """Room reverb applied as a circular convolution so the loop stays seamless."""
    L = len(x)
    n = min(int(SR * 1.8), L)
    if n not in _ir_cache:
        t = np.arange(n) / SR
        ir = np.stack([_rng.standard_normal(n), _rng.standard_normal(n)], axis=1)
        ir *= np.exp(-t / 0.42)[:, None]
        ir[: int(0.012 * SR)] = 0  # pre-delay
        ir = _band(ir.T, 250, 7000).T
        _ir_cache[n] = ir / np.sqrt(np.sum(ir ** 2, axis=0, keepdims=True))
    ir = _ir_cache[n]
    out = np.zeros_like(x)
    for c in range(2):
        y = fftconvolve(x[:, c], ir[:, c])
        out[:, c] = y[:L]
        tail = y[L:]
        out[: len(tail), c] += tail
    return out


def _master(x: np.ndarray) -> np.ndarray:
    """Level to a steady loudness and soft-clip peaks (pointwise, so it stays loopable)."""
    rms = float(np.sqrt(np.mean(x ** 2)) + 1e-9)
    x = x * (0.16 / rms)
    return np.tanh(x * 1.1) / np.tanh(1.1) * 0.9


def write_manifest(path: str, data: dict):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write('\n')
