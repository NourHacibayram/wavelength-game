"""One looping theme per game. Run `python tools/music/build.py` to render."""

from engine import Song, midi

# Chord voicings used across tracks (low to high)
CH = {
    'Dm': ['D3', 'A3', 'D4', 'F4'],
    'Gm': ['G3', 'Bb3', 'D4', 'G4'],
    'C': ['C3', 'G3', 'C4', 'E4'],
    'F': ['F3', 'A3', 'C4', 'F4'],
    'Bb': ['Bb2', 'F3', 'Bb3', 'D4'],
    'A7': ['A2', 'E3', 'G3', 'C#4'],
    'Fmaj7': ['F3', 'A3', 'C4', 'E4'],
    'Am7': ['A3', 'C4', 'E4', 'G4'],
    'Bbmaj7': ['Bb3', 'D4', 'F4', 'A4'],
    'Dm7': ['D3', 'F3', 'A3', 'C4'],
    'Gm7': ['G3', 'Bb3', 'D4', 'F4'],
    'Cadd9': ['C3', 'G3', 'D4', 'E4'],
    # open fifths for maqam pieces, so the melody's quarter tones never clash
    'D5': ['D3', 'A3', 'D4'],
    'G5': ['G2', 'D3', 'G3'],
    'C5': ['C3', 'G3', 'C4'],
    'F5': ['F2', 'C3', 'F3'],
    'Bb5': ['Bb2', 'F3', 'Bb3'],
    # hijaz on D
    'D': ['D3', 'F#3', 'A3', 'D4'],
    'Eb': ['Eb3', 'G3', 'Bb3', 'Eb4'],
    'Cm': ['C3', 'G3', 'C4', 'Eb4'],
}


def root(name: str) -> str:
    return CH[name][0]


# ---------------------------------------------------------------------------
# Lobby — "سهرة الشلّة": warm evening, maqam Nahawand on D, maqsum groove
# ---------------------------------------------------------------------------

def lobby() -> Song:
    s = Song(bpm=100, beats=64, swing=0.04, reverb=0.22)
    prog = ['Dm', 'Dm', 'Gm', 'A7', 'Dm', 'Bb', 'Gm', 'A7',
            'F', 'C', 'Gm', 'A7', 'Bb', 'F', 'Gm', 'Dm']
    for bar, c in enumerate(prog):
        b = bar * 4
        s.chord('acoustic_guitar_nylon', CH[c], b, 1.4, vel=0.55, pan=-0.3, strum=0.025)
        s.chord('acoustic_guitar_nylon', CH[c][1:], b + 1.5, 0.9, vel=0.42, pan=-0.3, strum=0.02)
        s.chord('acoustic_guitar_nylon', CH[c][1:], b + 2.5, 0.9, vel=0.45, pan=-0.3, strum=0.02)
        s.chord('acoustic_guitar_nylon', CH[c][1:], b + 3.5, 0.5, vel=0.38, pan=-0.3, strum=0.02)
        r = root(c)
        s.note('acoustic_bass', r, b, 1.4, vel=0.85)
        s.note('acoustic_bass', r, b + 2, 0.9, vel=0.7)
        s.note('acoustic_bass', r, b + 3, 0.9, vel=0.65)
        s.chord('string_ensemble_1', CH[c][1:], b, 4, vel=0.16, pan=0.1)

    s.line('pan_flute', 'A4:1.5 G4:.5 F4:.5 E4:.5 F4:1 | D4:1 E4:.5 F4:.5 G4:1 A4:1 | '
           'Bb4:1.5 A4:.5 G4:1 Bb4:1 | A4:1 C#5:1 E5:1 C#5:1 | '
           'D5:1.5 C5:.5 Bb4:.5 A4:.5 Bb4:1 | D5:1 Bb4:1 F4:1 Bb4:1 | '
           'G4:1 Bb4:1 A4:1 G4:.5 E4:.5 | F4:.5 E4:.5 D4:3', 0, vel=0.72, pan=0.2)
    s.line('orchestral_harp', 'F5:.5 E5:.5 F5:.5 G5:.5 A5:1 F5:1 | E5:.5 D5:.5 E5:.5 F5:.5 G5:1 E5:1 | '
           'D5:.5 C5:.5 Bb4:.5 C5:.5 D5:1 G4:1 | C#5:1 E5:.5 D5:.5 C#5:1 A4:1 | '
           'D5:.5 F5:.5 Bb5:1 A5:.5 G5:.5 F5:1 | A5:.5 G5:.5 F5:.5 E5:.5 F5:1 C5:1 | '
           'Bb4:.5 C5:.5 D5:.5 E5:.5 C#5:1 E5:1 | D5:3 r:1', 32, vel=0.7, pan=0.25)
    # soft ney echo under the qanun answer
    s.line('pan_flute', 'A4:4 | G4:4 | Bb4:4 | A4:4 | F4:4 | A4:4 | G4:2 E4:2 | F4:4', 32,
           vel=0.3, pan=-0.15)

    s.pattern('D.T.T.D.D.T.T...', 0, 16, vel=0.75, pan=0.05, step=0.25)
    s.pattern('..k...k...k...kk', 0, 16, vel=0.6, pan=0.15, step=0.25)
    s.pattern('r.r.r.r.r.r.r.r.', 32, 8, vel=0.4, pan=-0.2, step=0.25)
    return s


# ---------------------------------------------------------------------------
# Boom Deck — "الفتيل الملعون": ticking fuse, maqam Hijaz on D, builds up
# ---------------------------------------------------------------------------

def boomdeck() -> Song:
    s = Song(bpm=126, beats=64, swing=0.0, reverb=0.14)
    prog = ['D', 'Eb', 'Cm', 'D']
    ost = {
        'D': ['D4', 'A3', 'Eb4', 'A3', 'F#4', 'A3', 'Eb4', 'A3'],
        'Eb': ['Eb4', 'Bb3', 'G4', 'Bb3', 'F#4', 'Bb3', 'G4', 'Bb3'],
        'Cm': ['C4', 'G3', 'Eb4', 'G3', 'D4', 'G3', 'Eb4', 'G3'],
    }
    for cycle in range(4):
        for i, c in enumerate(prog):
            b = cycle * 16 + i * 4
            for k, p in enumerate(ost[c]):
                s.note('pizzicato_strings', p, b + k * 0.5, 0.4, vel=0.7 if k % 2 == 0 else 0.5, pan=-0.25)
            s.note('acoustic_bass', root(c).replace('3', '2'), b, 1.5, vel=0.85)
            s.note('acoustic_bass', root(c).replace('3', '2'), b + 2.5, 1, vel=0.6)
        base = cycle * 16
        if cycle >= 1:
            for half in (0, 8):
                s.line('bassoon', 'D3:1 Eb3:.5 F#3:.5 G3:1 F#3:.5 Eb3:.5 | D3:2 r:1 A2:1',
                       base + half, vel=0.7, pan=0.2, legato=0.8)
        if cycle >= 2:
            s.line('clarinet', 'A4:.5 Bb4:.5 A4:.5 G4:.5 F#4:1 Eb4:1 | G4:.5 F#4:.5 Eb4:.5 D4:.5 Eb4:2 | '
                   'C4:.5 Eb4:.5 G4:.5 Bb4:.5 A4:1 G4:1 | F#4:1 G4:.5 F#4:.5 Eb4:.5 D4:1.5',
                   base, vel=0.66, pan=0.3)
            s.pattern('K.......K.......', base, 4, vel=0.8, step=0.25)
        if cycle == 3:
            for i, c in enumerate(prog):
                s.chord('string_ensemble_1', CH[c][1:], base + i * 4, 4, vel=0.24, pan=-0.05)
            s.pattern('....S.......S...', base, 4, vel=0.45, pan=0.1, step=0.25)
        s.hit('tom', base + 15, 0.7, -0.2)
        s.hit('tom', base + 15.5, 0.75, 0.2)
    # the fuse: a clock tick on every eighth the whole way through
    s.pattern('t.t.t.t.t.t.t.t.', 0, 16, vel=0.55, pan=0.35, step=0.25)
    return s


# ---------------------------------------------------------------------------
# Wavelength — "عَ نفس الموجة": dreamy, telepathic, lo-fi groove in F
# ---------------------------------------------------------------------------

def wavelength() -> Song:
    s = Song(bpm=90, beats=64, swing=0.1, reverb=0.3)
    prog = ['Fmaj7', 'Am7', 'Bbmaj7', 'Cadd9', 'Dm7', 'Am7', 'Bbmaj7', 'Gm7'] * 2
    for bar, c in enumerate(prog):
        b = bar * 4
        s.chord('electric_piano_1', CH[c], b, 1.8, vel=0.5, pan=-0.2, strum=0.03)
        s.chord('electric_piano_1', CH[c][1:], b + 2.5, 1.3, vel=0.38, pan=-0.2, strum=0.03)
        s.chord('pad_2_warm', CH[c], b, 4, vel=0.22)
        r = root(c).replace('3', '2')
        s.note('acoustic_bass', r, b, 2.4, vel=0.8)
        s.note('acoustic_bass', r, b + 3.5, 0.5, vel=0.55)
    mel = ('C5:1 F5:1 A5:1 G5:1 | E5:1.5 C5:.5 D5:1 E5:1 | F5:1 D5:1 A4:1 Bb4:1 | C5:3 r:1 | '
           'A5:1 F5:1 D5:1 F5:1 | E5:1.5 G5:.5 E5:1 C5:1 | D5:1 F5:1 A5:1 C6:1 | Bb5:1 A5:1 G5:2')
    s.line('vibraphone', mel, 0, vel=0.62, pan=0.25)
    s.line('celesta', mel, 32, vel=0.5, pan=0.3)
    s.line('vibraphone', mel, 32, vel=0.3, pan=-0.3, octave=-1)
    s.pattern('K.......K.K.....', 0, 16, vel=0.75, step=0.25)
    s.pattern('....C.......C...', 0, 16, vel=0.5, pan=0.05, step=0.25)
    s.pattern('h.h.h.h.h.h.h.h.', 0, 16, vel=0.45, pan=0.3, step=0.25)
    s.pattern('..s...s...s...s.', 32, 8, vel=0.4, pan=-0.3, step=0.25)
    return s


# ---------------------------------------------------------------------------
# Shared helpers for the themes below
# ---------------------------------------------------------------------------

QUALITIES = {
    '': [0, 4, 7], 'm': [0, 3, 7], '7': [0, 4, 7, 10], 'm7': [0, 3, 7, 10],
    'maj7': [0, 4, 7, 11], 'dim': [0, 3, 6], 'sus4': [0, 5, 7], '6': [0, 4, 7, 9],
    'm6': [0, 3, 7, 9], 'add9': [0, 4, 7, 14], '5': [0, 7, 12], 'm7b5': [0, 3, 6, 10],
    '9': [0, 4, 7, 10, 14],
}


def parse(name: str) -> tuple[float, list[int]]:
    """'F#m7' -> (pitch class as a midi number in octave 3, intervals)."""
    rootname = name[:2] if len(name) > 1 and name[1] in '#b' else name[:1]
    return midi(rootname + '3'), QUALITIES[name[len(rootname):]]


def voicing(name: str, octave: int = 0) -> list[float]:
    r, iv = parse(name)
    return [r + i + 12 * octave for i in iv]


def bass_root(name: str) -> float:
    return parse(name)[0] - 12


# accompaniment rhythms: (beat offset, length, velocity factor, upper voices only)
COMP = {
    'strum': [(0, 1.4, 1.0, False), (1.5, 0.9, 0.8, True), (2.5, 0.9, 0.85, True), (3.5, 0.5, 0.7, True)],
    'offbeat': [(0.5, 0.35, 1.0, True), (1.5, 0.35, 0.9, True), (2.5, 0.35, 1.0, True), (3.5, 0.35, 0.9, True)],
    'twofour': [(1, 0.5, 1.0, True), (3, 0.5, 1.0, True)],
    'block': [(0, 1.8, 1.0, False), (2.5, 1.3, 0.8, False)],
    'pad': [(0, 4, 1.0, False)],
    'waltz': [(1, 0.6, 1.0, True), (2, 0.6, 0.9, True)],
    'pad3': [(0, 3, 1.0, False)],
}


def comp(s: Song, inst, prog, style, start=0.0, bar=4, vel=0.45, pan=0.0, octave=0, strum=0.02):
    for i, c in enumerate(prog):
        v = voicing(c, octave)
        for off, dur, vf, upper in COMP[style]:
            s.chord(inst, v[1:] if upper else v, start + i * bar + off, dur, vel * vf, pan, strum)


def arp(s: Song, inst, prog, start=0.0, bar=4, vel=0.4, pan=0.0, octave=1, step=0.5, shape=(0, 1, 2, 3, 2, 1)):
    for i, c in enumerate(prog):
        v = voicing(c, octave)
        tones = v + [p + 12 for p in v]
        n = int(round(bar / step))
        for k in range(n):
            s.note(inst, tones[shape[k % len(shape)] % len(tones)], start + i * bar + k * step,
                   step * 1.6, vel * (1.0 if k % 2 == 0 else 0.8), pan)


def bass(s: Song, inst, prog, style, start=0.0, bar=4, vel=0.8, pan=0.0):
    for i, c in enumerate(prog):
        r, iv = parse(c)
        r -= 12
        third = iv[1] if len(iv) > 1 and iv[1] in (3, 4) else 7
        nxt = bass_root(prog[(i + 1) % len(prog)])
        b = start + i * bar
        if style == 'root':
            s.note(inst, r, b, bar * 0.95, vel, pan)
        elif style == 'half':
            s.note(inst, r, b, 1.8, vel, pan)
            s.note(inst, r + 7, b + 2, 1.8, vel * 0.85, pan)
        elif style == 'oompah':
            s.note(inst, r, b, 0.8, vel, pan)
            s.note(inst, r + 7 - 12, b + 2, 0.8, vel * 0.85, pan)
        elif style == 'waltz':
            s.note(inst, r, b, 0.9, vel, pan)
            s.note(inst, r + 7, b + 2, 0.6, vel * 0.6, pan)
        elif style == 'walk':
            approach = nxt - 1 if nxt > r else nxt + 1
            for k, p in enumerate([r, r + third, r + 7, approach]):
                s.note(inst, p, b + k, 0.9, vel * (1.0 if k == 0 else 0.82), pan)
        elif style == 'pulse8':
            for k in range(int(bar * 2)):
                s.note(inst, r, b + k * 0.5, 0.4, vel * (1.0 if k % 2 == 0 else 0.75), pan)
        elif style == 'funk':
            for off, iv_, d in [(0, 0, 0.4), (0.75, 12, 0.2), (1, 7, 0.4), (1.5, 10, 0.4),
                                (2, 0, 0.4), (2.75, 12, 0.2), (3, 7, 0.4), (3.5, 5, 0.4)]:
                s.note(inst, r + iv_, b + off, d, vel * (1.0 if off in (0, 2) else 0.78), pan)
        elif style == 'heart':
            s.note(inst, r, b, 1.5, vel, pan)
            s.note(inst, r, b + 2.5, 1.0, vel * 0.7, pan)
        else:
            raise ValueError(style)


# ---------------------------------------------------------------------------
# Rose Trap — "وردة ولا فخ؟": a gothic, cheeky waltz in A minor
# ---------------------------------------------------------------------------

def skull() -> Song:
    s = Song(bpm=138, beats=96, reverb=0.24, seed=11)
    A = ['Am', 'E7', 'Am', 'Dm', 'Am', 'F', 'E7', 'Am']
    B = ['F', 'C', 'Dm', 'E7', 'F', 'Dm', 'E7', 'Am']
    prog = A + B
    tune_a = ('E5:1 A5:1 C6:1 | B5:1.5 A5:.5 G#5:1 | A5:1 E5:1 C5:1 | D5:2 F5:1 | '
              'E5:1 C5:.5 D5:.5 E5:1 | F5:1 A5:1 C6:1 | B5:1 G#5:1 E5:1 | A5:3')
    tune_b = ('A4:1 C5:1 F5:1 | E5:1.5 D5:.5 C5:1 | D5:1 F5:1 A5:1 | G#5:2 E5:1 | '
              'F5:1 E5:.5 D5:.5 C5:1 | D5:1 C5:.5 B4:.5 A4:1 | B4:1 D5:1 G#4:1 | A4:2 E4:1')
    for half, (lead_a, lead_b) in enumerate([('celesta', 'clarinet'), ('pizzicato_strings', 'bassoon')]):
        o = half * 48
        bass(s, 'acoustic_bass', prog, 'waltz', start=o, bar=3, vel=0.8)
        comp(s, 'harpsichord', prog, 'waltz', start=o, bar=3, vel=0.42, pan=-0.3)
        s.line(lead_a, tune_a, o, vel=0.7, pan=0.25, bar=3, legato=0.95 if half == 0 else 0.5)
        s.line(lead_b, tune_b, o + 24, vel=0.66, pan=0.2, bar=3, octave=0 if half == 0 else -1)
        if half == 1:
            s.line('celesta', tune_b, o + 24, vel=0.32, pan=-0.25, bar=3, octave=1)
    s.pattern('s.....s.....', 0, 32, beats_per_bar=3, vel=0.45, pan=0.3, step=0.25)
    return s


# ---------------------------------------------------------------------------
# Smuggler's Run — "مهرّب الجمارك": a dusty border-town trot
# ---------------------------------------------------------------------------

def sheriff() -> Song:
    s = Song(bpm=116, beats=64, swing=0.14, reverb=0.16, seed=12)
    A = ['G', 'G', 'C', 'G', 'D', 'C', 'G', 'D']
    B = ['Em', 'C', 'G', 'D', 'Em', 'C', 'D', 'G']
    prog = A + B
    bass(s, 'acoustic_bass', prog, 'oompah', vel=0.85)
    comp(s, 'acoustic_guitar_steel', prog, 'twofour', vel=0.5, pan=-0.3)
    arp(s, 'banjo', prog, vel=0.3, pan=0.35, octave=1, shape=(0, 2, 1, 3))
    s.line('harmonica', 'D4:.5 G4:.5 B4:1 A4:.5 G4:.5 E4:1 | D4:1 G4:1 B4:2 | '
           'C5:.5 B4:.5 A4:1 G4:.5 E4:.5 G4:1 | D5:3 r:1 | A4:.5 B4:.5 C5:1 B4:.5 A4:.5 F#4:1 | '
           'G4:1 E4:1 C4:2 | B4:.5 A4:.5 G4:1 D4:1 G4:1 | A4:2 F#4:1 D4:1', 0, vel=0.72, pan=0.15)
    s.line('whistle', 'B4:1 E5:1 G5:1 E5:1 | G5:1.5 E5:.5 C5:2 | D5:1 B4:1 G4:1 B4:1 | A4:3 r:1 | '
           'E5:.5 F#5:.5 G5:1 F#5:.5 E5:.5 B4:1 | C5:1 E5:1 G5:2 | F#5:1 E5:1 D5:1 A4:1 | G4:3 D4:1',
           32, vel=0.55, pan=0.15)
    s.pattern('t.....t.t.....t.', 0, 16, vel=0.6, pan=-0.35, step=0.25)
    s.pattern('K.......K.......', 0, 16, vel=0.55, step=0.25)
    s.pattern('....S.......S...', 0, 16, vel=0.3, pan=0.1, step=0.25)
    return s


# ---------------------------------------------------------------------------
# Loot Standoff — "قسمة العصابة": a smoky noir heist with a walking bass
# ---------------------------------------------------------------------------

def cashnguns() -> Song:
    s = Song(bpm=132, beats=64, swing=0.16, reverb=0.2, seed=13)
    A = ['Cm7', 'Cm7', 'Fm7', 'Fm7', 'Ab7', 'G7', 'Cm7', 'G7']
    B = ['Fm7', 'Bb7', 'Ebmaj7', 'Abmaj7', 'Fm7', 'G7', 'Cm7', 'G7']
    prog = A + B
    bass(s, 'acoustic_bass', prog, 'walk', vel=0.8)
    comp(s, 'vibraphone', prog, 'block', vel=0.3, pan=-0.3)
    s.line('muted_trumpet', 'G4:.5 Bb4:.5 C5:1 Eb5:.5 D5:.5 C5:1 | G4:3 r:1 | '
           'Ab4:.5 C5:.5 Eb5:1 F5:.5 Eb5:.5 C5:1 | Ab4:3 r:1 | Eb5:1 C5:.5 Ab4:.5 Gb4:1 Ab4:1 | '
           'B4:1.5 D5:.5 F5:1 D5:1 | Eb5:.5 D5:.5 C5:.5 Bb4:.5 G4:2 | D5:1 B4:1 G4:1 r:1',
           0, vel=0.72, pan=0.2)
    s.line('tenor_sax', 'C5:1 Ab4:.5 F4:.5 Ab4:1 C5:1 | D5:1.5 C5:.5 Ab4:1 F4:1 | '
           'G4:1 Bb4:1 D5:1 Eb5:1 | C5:3 r:1 | Ab4:.5 Bb4:.5 C5:.5 Eb5:.5 F5:1 Eb5:1 | '
           'D5:1 B4:1 G4:1 F4:1 | Eb4:1 G4:1 C5:2 | B4:2 D5:1 r:1', 32, vel=0.68, pan=0.2)
    s.pattern('o..h.ho..h.ho..h', 0, 16, vel=0.32, pan=0.3, step=0.25)
    s.pattern('....k.......k...', 0, 16, vel=0.4, pan=-0.1, step=0.25)
    return s


# ---------------------------------------------------------------------------
# Wolf Night — "ليلة الذئب": moonlit, eerie music box over a heartbeat
# ---------------------------------------------------------------------------

def onenight() -> Song:
    s = Song(bpm=80, beats=64, reverb=0.32, seed=14)
    A = ['Cm', 'Ab', 'Fm', 'G', 'Cm', 'Ab', 'Bb', 'G']
    B = ['Ab', 'Eb', 'Fm', 'G', 'Ab', 'Fm', 'Ddim', 'G']
    prog = A + B
    comp(s, 'tremolo_strings', prog, 'pad', vel=0.2, pan=-0.1)
    bass(s, 'acoustic_bass', prog, 'heart', vel=0.7)
    arp(s, 'orchestral_harp', prog, vel=0.28, pan=-0.35, octave=1, step=0.5, shape=(0, 1, 2, 1))
    s.line('celesta', 'G5:1 Eb5:1 C5:1 D5:1 | Eb5:2 C5:2 | Ab5:1 G5:1 F5:1 C5:1 | B4:3 r:1 | '
           'G5:1 Eb5:1 C5:1 G4:1 | Ab4:1 C5:1 Eb5:1 Ab5:1 | G5:1 F5:1 D5:1 Bb4:1 | B4:2 D5:2',
           0, vel=0.62, pan=0.25)
    s.line('french_horn', 'C4:2 Eb4:2 | G4:3 Bb3:1 | Ab4:2 G4:1 F4:1 | G4:4 | Eb4:2 Ab4:2 | '
           'C5:2 Ab4:2 | F4:2 D4:2 | B3:2 D4:2', 32, vel=0.58, pan=0.1)
    s.line('choir_aahs', 'Eb5:4 | G5:4 | F5:4 | D5:4 | Eb5:4 | F5:4 | F5:4 | D5:4', 32,
           vel=0.24, pan=-0.2)
    s.pattern('K..K............', 0, 16, vel=0.6, step=0.25)
    s.pattern('m...............', 0, 16, vel=0.3, pan=0.2, step=0.25)
    return s


# ---------------------------------------------------------------------------
# Secret Mission — "المهمة السرية": surf-guitar spy chase
# ---------------------------------------------------------------------------

def resistance() -> Song:
    s = Song(bpm=128, beats=64, reverb=0.18, seed=15)
    A = ['Em', 'Em', 'C', 'B7', 'Em', 'Em', 'C', 'B7']
    B = ['Am', 'Em', 'C', 'B7', 'Am', 'Em', 'C', 'B7']
    prog = A + B
    riff = {'Em': 'E3 E3 F#3 F#3 G3 G3 F#3 F#3', 'C': 'C3 C3 D3 D3 E3 E3 D3 D3',
            'B7': 'B2 B2 C#3 C#3 D#3 D#3 C#3 C#3', 'Am': 'A2 A2 B2 B2 C3 C3 B2 B2'}
    for i, c in enumerate(prog):
        for k, p in enumerate(riff[c].split()):
            s.note('electric_guitar_clean', p, i * 4 + k * 0.5, 0.42, 0.62 if k % 2 == 0 else 0.5, -0.25)
            s.note('acoustic_bass', midi(p) - 12, i * 4 + k * 0.5, 0.42, 0.55, 0.0)
        if c in ('C', 'B7'):
            s.chord('brass_section', voicing(c, 1)[:3], i * 4 + 3.5, 0.4, 0.42, 0.2)
    s.line('trumpet', 'B4:2 C5:.5 B4:.5 A4:1 | G4:1.5 E4:.5 E4:2 | C5:1 B4:.5 A4:.5 G4:1 E4:1 | '
           'F#4:2 D#4:2 | B4:.5 B4:.5 E5:1 D5:.5 B4:.5 G4:1 | A4:1 B4:1 E4:2 | '
           'G4:.5 A4:.5 B4:.5 C5:.5 E5:1 C5:1 | B4:3 r:1', 0, vel=0.64, pan=0.2)
    s.line('electric_guitar_clean', 'E5:1 C5:1 A4:1 C5:1 | B4:2 G4:2 | E5:.5 D5:.5 C5:1 B4:1 G4:1 | '
           'F#4:1 A4:1 D#5:2 | A5:1 E5:1 C5:1 E5:1 | G5:1.5 F#5:.5 E5:2 | '
           'C5:.5 D5:.5 E5:.5 G5:.5 E5:1 C5:1 | D#5:2 F#5:1 B4:1', 32, vel=0.6, pan=0.3)
    s.pattern('K...K...K...K...', 0, 16, vel=0.7, step=0.25)
    s.pattern('....S.......S..S', 0, 16, vel=0.5, pan=0.05, step=0.25)
    s.pattern('h.h.h.h.h.h.h.h.', 0, 16, vel=0.4, pan=0.3, step=0.25)
    return s


# ---------------------------------------------------------------------------
# Masterpiece Auction — "مزاد الخربشات": a bouncy ragtime parlour piano
# ---------------------------------------------------------------------------

def artauction() -> Song:
    s = Song(bpm=112, beats=64, swing=0.1, reverb=0.16, seed=16)
    A = ['F', 'D7', 'Gm', 'C7', 'F', 'F7', 'Bb', 'C7']
    B = ['Bb', 'F', 'G7', 'C7', 'F', 'D7', 'G7', 'C7']
    prog = A + B
    bass(s, 'acoustic_grand_piano', prog, 'oompah', vel=0.6, pan=-0.2)
    comp(s, 'acoustic_grand_piano', prog, 'twofour', vel=0.42, pan=-0.2)
    bass(s, 'acoustic_bass', prog, 'oompah', vel=0.55)
    s.line('clarinet', 'A4:.5 C5:.5 F5:1 E5:.5 F5:.5 A5:1 | F#5:1 D5:.5 C5:.5 A4:2 | '
           'Bb4:.5 D5:.5 G5:1 F5:.5 D5:.5 Bb4:1 | C5:1 E5:1 G5:1 Bb5:1 | A5:1 F5:.5 C5:.5 A4:1 C5:1 | '
           'Eb5:1 C5:.5 A4:.5 F4:2 | D5:.5 F5:.5 Bb5:1 A5:.5 G5:.5 F5:1 | E5:1 G5:1 C5:2',
           0, vel=0.68, pan=0.25)
    s.line('acoustic_grand_piano', 'F5:.5 D5:.5 Bb4:.5 D5:.5 F5:1 Bb5:1 | A5:1 F5:.5 A5:.5 C6:2 | '
           'B5:.5 G5:.5 D5:.5 F5:.5 B5:1 G5:1 | Bb5:1 G5:1 E5:1 C5:1 | '
           'C5:.5 F5:.5 A5:.5 C6:.5 A5:1 F5:1 | F#5:.5 A5:.5 C6:.5 A5:.5 F#5:2 | '
           'G5:1 F5:1 D5:1 B4:1 | C5:1 E5:1 G5:1 Bb5:1', 32, vel=0.62, pan=0.2)
    s.pattern('..s...s...s...s.', 0, 16, vel=0.32, pan=0.3, step=0.25)
    return s


# ---------------------------------------------------------------------------
# Draw Your Alibi — "ارسم حجّتك": a tiptoeing cartoon detective
# ---------------------------------------------------------------------------

def alibi() -> Song:
    s = Song(bpm=104, beats=64, swing=0.12, reverb=0.18, seed=17)
    A = ['Em', 'Em', 'Am', 'B7', 'Em', 'C7', 'B7', 'Em']
    B = ['Am', 'Em', 'Am', 'B7', 'C', 'B7', 'Em', 'B7']
    prog = A + B
    bass(s, 'pizzicato_strings', prog, 'walk', vel=0.7, pan=-0.15)
    bass(s, 'acoustic_bass', prog, 'walk', vel=0.6)
    comp(s, 'electric_piano_1', prog, 'twofour', vel=0.3, pan=-0.3)
    s.line('tenor_sax', 'r:.5 D#4:.5 E4:1 r:.5 F#4:.5 G4:1 | r:.5 D#4:.5 E4:.5 F#4:.5 G4:.5 C5:.5 B4:1 | '
           'r:.5 E4:.5 G4:.5 B4:.5 Bb4:2 | A4:.5 G4:.5 E4:.5 G4:.5 F#4:2 | '
           'r:.5 D#4:.5 E4:1 r:.5 F#4:.5 G4:1 | r:.5 G4:.5 E5:1 Eb5:2 | '
           'D#5:.5 C5:.5 B4:.5 A4:.5 F#4:1 D#4:1 | E4:3 r:1', 0, vel=0.7, pan=0.2)
    s.line('clarinet', 'A4:.5 C5:.5 E5:1 D#5:.5 E5:.5 C5:1 | B4:2 G4:1 E4:1 | '
           'A4:.5 B4:.5 C5:.5 E5:.5 A5:2 | G5:.5 F#5:.5 D#5:.5 B4:.5 A4:2 | '
           'G4:.5 A4:.5 C5:1 E5:1 G5:1 | F#5:2 D#5:1 B4:1 | E5:.5 D5:.5 B4:.5 G4:.5 E4:2 | '
           'D#4:1 F#4:1 B4:2', 32, vel=0.62, pan=0.2)
    s.pattern('h..hh..hh..hh..h', 0, 16, vel=0.34, pan=0.3, step=0.25)
    s.pattern('....C.......C...', 0, 16, vel=0.32, pan=-0.1, step=0.25)
    return s


# ---------------------------------------------------------------------------
# Honor Among Thieves — "شرف اللصوص": a ticking trust-or-betray showdown
# ---------------------------------------------------------------------------

def splitsteal() -> Song:
    s = Song(bpm=96, beats=64, reverb=0.26, seed=18)
    A = ['Fm', 'Db', 'Ab', 'Eb', 'Fm', 'Db', 'Bbm', 'C']
    B = ['Db', 'Ab', 'Eb', 'Fm', 'Db', 'Bbm', 'C', 'C']
    prog = A + B
    arp(s, 'acoustic_grand_piano', prog, vel=0.4, pan=-0.2, octave=1, step=0.5, shape=(0, 1, 2, 1))
    comp(s, 'synth_strings_1', prog, 'pad', vel=0.22, pan=0.1)
    bass(s, 'acoustic_bass', prog, 'root', vel=0.7)
    s.line('string_ensemble_1', 'C5:2 Ab4:2 | Ab4:3 F4:1 | Eb5:2 C5:2 | Bb4:4 | C5:1 Db5:1 C5:1 Ab4:1 | '
           'F5:3 Db5:1 | Db5:2 F5:2 | E5:4', 0, vel=0.5, pan=0.15)
    s.line('acoustic_grand_piano', 'F5:1 Ab5:1 F5:1 Db5:1 | Eb5:1 C5:1 Ab4:2 | G5:1 Bb5:1 G5:1 Eb5:1 | '
           'F5:3 r:1 | Ab5:1 F5:1 Db5:1 F5:1 | Db6:2 Bb5:2 | G5:1 E5:1 C5:1 E5:1 | G5:4',
           32, vel=0.6, pan=0.2)
    s.pattern('K..K............', 0, 16, vel=0.62, step=0.25)
    s.pattern('t...t...t...t...', 0, 16, vel=0.4, pan=0.3, step=0.25)
    return s


# ---------------------------------------------------------------------------
# Who's Clueless? — "مين الدخيل؟": Gulf-style claps, maqam Kurd on D
# ---------------------------------------------------------------------------

def chameleon() -> Song:
    s = Song(bpm=100, beats=64, swing=0.06, reverb=0.2, seed=19)
    A = ['D5', 'D5', 'Bb5', 'C5', 'D5', 'Eb', 'C5', 'D5']
    B = ['Bb5', 'C5', 'D5', 'D5', 'Bb5', 'C5', 'Eb', 'D5']
    prog = A + B
    comp(s, 'acoustic_guitar_nylon', prog, 'strum', vel=0.45, pan=-0.3)
    bass(s, 'acoustic_bass', prog, 'half', vel=0.8)
    s.line('orchestral_harp', 'D5:.5 Eb5:.5 F5:.5 G5:.5 F5:.5 Eb5:.5 D5:1 | '
           'C5:.5 D5:.5 Eb5:.5 D5:.5 C5:.5 Bb4:.5 A4:1 | Bb4:.5 C5:.5 D5:.5 Eb5:.5 F5:1 D5:1 | '
           'Eb5:.5 D5:.5 C5:.5 Bb4:.5 C5:2 | D5:.5 F5:.5 A5:1 G5:.5 F5:.5 Eb5:1 | '
           'G5:.5 F5:.5 Eb5:.5 D5:.5 Eb5:2 | C5:.5 D5:.5 Eb5:.5 F5:.5 Eb5:.5 D5:.5 C5:1 | D5:3 r:1',
           0, vel=0.75, pan=0.25)
    s.line('oboe', 'F4:1 G4:.5 A4:.5 Bb4:2 | C5:1 Bb4:.5 A4:.5 G4:2 | A4:.5 Bb4:.5 A4:.5 G4:.5 F4:1 Eb4:1 | '
           'D4:3 r:1 | D5:1 C5:.5 Bb4:.5 C5:2 | Eb5:1 D5:.5 C5:.5 Bb4:2 | '
           'G4:.5 Bb4:.5 Eb5:1 D5:.5 C5:.5 Bb4:1 | A4:1 G4:.5 F4:.5 Eb4:1 D4:1', 32, vel=0.62, pan=0.15)
    s.pattern('D.T...TkD.T...Tk', 0, 16, vel=0.7, pan=0.05, step=0.25)
    s.pattern('..C...C...C.C...', 0, 16, vel=0.55, pan=-0.2, step=0.25)
    return s


# ---------------------------------------------------------------------------
# Dream Tales — "خيال الشلّة": a floating fairy-tale waltz
# ---------------------------------------------------------------------------

def dixit() -> Song:
    s = Song(bpm=104, beats=96, reverb=0.34, seed=20)
    A = ['Eb', 'Cm', 'Ab', 'Bb', 'Eb', 'Gm', 'Ab', 'Bb']
    B = ['Cm', 'Ab', 'Eb', 'Bb', 'Ab', 'Fm', 'Bbsus4', 'Bb']
    prog = (A + B) * 2
    arp(s, 'orchestral_harp', prog, bar=3, vel=0.36, pan=-0.3, octave=1, step=0.5,
        shape=(0, 1, 2, 3, 2, 1))
    comp(s, 'string_ensemble_1', prog, 'pad3', bar=3, vel=0.2, pan=0.1)
    bass(s, 'acoustic_bass', prog, 'waltz', bar=3, vel=0.6)
    tune_a = ('G5:2 Bb5:1 | C6:1.5 Bb5:.5 G5:1 | Ab5:2 C6:1 | Bb5:3 | Eb6:1 D6:1 Bb5:1 | '
              'G5:2 Bb5:1 | C6:1 Bb5:1 Ab5:1 | F5:3')
    tune_b = ('G5:1 Eb5:1 C5:1 | Eb5:2 C5:1 | Bb4:1 Eb5:1 G5:1 | F5:3 | Ab5:1 G5:1 F5:1 | '
              'Ab5:2 F5:1 | Eb5:2 F5:1 | D5:3')
    s.line('celesta', tune_a, 0, vel=0.62, pan=0.25, bar=3)
    s.line('flute', tune_b, 24, vel=0.6, pan=0.2, bar=3)
    s.line('flute', tune_a, 48, vel=0.58, pan=0.2, bar=3, octave=-1)
    s.line('celesta', tune_a, 48, vel=0.3, pan=-0.2, bar=3)
    s.line('orchestral_harp', tune_b, 72, vel=0.6, pan=0.25, bar=3)
    s.line('choir_aahs', 'Eb5:3 | C5:3 | Eb5:3 | D5:3 | C5:3 | C5:3 | Bb4:3 | Bb4:3', 72, vel=0.2,
           pan=-0.2, bar=3)
    return s


# ---------------------------------------------------------------------------
# Don't Say It! — "الكلمات الممنوعة": a funky game-show buzzer groove
# ---------------------------------------------------------------------------

def taboo() -> Song:
    s = Song(bpm=118, beats=64, swing=0.08, reverb=0.14, seed=21)
    A = ['F7', 'F7', 'Bb7', 'F7', 'C7', 'Bb7', 'F7', 'C7']
    B = ['Bb7', 'Bb7', 'F7', 'F7', 'G7', 'C7', 'F7', 'C7']
    prog = A + B
    bass(s, 'slap_bass_1', prog, 'funk', vel=0.75)
    comp(s, 'electric_piano_1', prog, 'offbeat', vel=0.38, pan=-0.3)
    s.line('brass_section', 'r:.5 A4:.5 C5:.5 Eb5:.5 F5:1 r:1 | r:.5 Eb5:.5 F5:.5 Eb5:.5 C5:1 A4:1 | '
           'r:.5 D5:.5 F5:.5 Ab5:.5 Bb5:1 r:1 | A5:.5 F5:.5 C5:1 r:2 | '
           'r:.5 E5:.5 G5:.5 Bb5:.5 C6:1 r:1 | r:.5 D5:.5 F5:.5 Ab5:.5 Bb5:1 Ab5:1 | '
           'F5:.5 Eb5:.5 C5:.5 A4:.5 F4:2 | G4:1 Bb4:1 C5:1 r:1', 0, vel=0.62, pan=0.2, legato=0.7)
    s.line('trumpet', 'F5:1 D5:.5 F5:.5 Ab5:2 | G5:.5 F5:.5 D5:1 Bb4:2 | C5:1 A4:.5 C5:.5 Eb5:2 | '
           'D5:.5 C5:.5 A4:1 F4:2 | B4:.5 D5:.5 F5:1 G5:2 | E5:1 G5:1 Bb5:1 G5:1 | A5:2 F5:2 | '
           'E5:1 C5:1 G4:2', 32, vel=0.6, pan=0.2)
    s.pattern('K.....K...K.....', 0, 16, vel=0.75, step=0.25)
    s.pattern('....C.......C...', 0, 16, vel=0.55, pan=0.05, step=0.25)
    s.pattern('hhhhhhhhhhhhhhho', 0, 16, vel=0.3, pan=0.3, step=0.25)
    return s


# ---------------------------------------------------------------------------
# Odd Brush Out — "مين الخربوط؟": a Paris café accordion waltz
# ---------------------------------------------------------------------------

def fakeartist() -> Song:
    s = Song(bpm=150, beats=96, reverb=0.18, seed=22)
    A = ['G', 'D7', 'D7', 'G', 'G', 'C', 'D7', 'G']
    B = ['Em', 'Am', 'D7', 'G', 'Em', 'Am', 'D7', 'D7']
    prog = A + B
    tune_a = ('D5:1 G5:1 B5:1 | A5:1.5 G5:.5 F#5:1 | C5:1 D5:1 F#5:1 | G5:2 D5:1 | '
              'B4:1 D5:.5 G5:.5 B5:1 | C6:1 B5:.5 A5:.5 G5:1 | F#5:1 A5:1 C5:1 | B4:2 D5:1')
    tune_b = ('E5:1 G5:1 B5:1 | C6:1.5 B5:.5 A5:1 | F#5:1 A5:1 D5:1 | G5:2 B4:1 | '
              'B4:1 E5:.5 F#5:.5 G5:1 | A5:1 G5:.5 F#5:.5 E5:1 | D5:1 F#5:1 A5:1 | C5:2 A4:1')
    for half in (0, 1):
        o = half * 48
        bass(s, 'acoustic_bass', prog, 'waltz', start=o, bar=3, vel=0.8)
        comp(s, 'acoustic_guitar_nylon', prog, 'waltz', start=o, bar=3, vel=0.42, pan=-0.3)
        s.line('accordion', tune_a, o, vel=0.66, pan=0.2, bar=3)
        s.line('clarinet' if half == 0 else 'accordion', tune_b, o + 24, vel=0.62, pan=0.2, bar=3)
        s.line('accordion' if half == 0 else 'clarinet',
               'B4:3 | C5:3 | A4:3 | B4:3 | G4:3 | C5:3 | A4:3 | F#4:3', o + 24, vel=0.24, pan=-0.2, bar=3)
        if half == 1:
            s.line('glockenspiel', tune_a, o, vel=0.28, pan=-0.3, bar=3, octave=1)
    return s


# ---------------------------------------------------------------------------
# Guess & Bet — "مزايدة التخمين": a bright quiz-show bounce
# ---------------------------------------------------------------------------

def wits() -> Song:
    s = Song(bpm=124, beats=64, swing=0.08, reverb=0.16, seed=23)
    A = ['G', 'Em', 'C', 'D', 'G', 'Em', 'A7', 'D']
    B = ['C', 'D', 'Bm', 'Em', 'C', 'D', 'G', 'D7']
    prog = A + B
    bass(s, 'acoustic_bass', prog, 'half', vel=0.8)
    comp(s, 'acoustic_grand_piano', prog, 'offbeat', vel=0.36, pan=-0.25)
    s.line('xylophone', 'D5:.5 G5:.5 B5:.5 G5:.5 D5:1 B4:1 | E5:.5 G5:.5 B5:.5 G5:.5 E5:2 | '
           'C5:.5 E5:.5 G5:.5 C6:.5 B5:1 G5:1 | A5:3 r:1 | B5:.5 A5:.5 G5:.5 F#5:.5 G5:1 D5:1 | '
           'E5:.5 F#5:.5 G5:.5 B5:.5 E6:2 | C#6:1 A5:1 G5:1 E5:1 | F#5:2 D5:2', 0, vel=0.66, pan=0.25)
    s.line('brass_section', 'E5:1 G5:.5 E5:.5 C5:2 | F#5:1 A5:.5 F#5:.5 D5:2 | B4:.5 D5:.5 F#5:1 B5:2 | '
           'G5:1 E5:1 B4:2 | C5:.5 E5:.5 G5:.5 E5:.5 C6:2 | A5:1 F#5:1 D5:2 | G5:1 B5:1 D6:2 | '
           'C6:1 A5:1 F#5:1 D5:1', 32, vel=0.55, pan=0.2)
    s.pattern('K.......K.......', 0, 16, vel=0.65, step=0.25)
    s.pattern('....C.......C...', 0, 16, vel=0.45, pan=0.05, step=0.25)
    s.pattern('..s...s...s...s.', 0, 16, vel=0.35, pan=0.3, step=0.25)
    return s


# ---------------------------------------------------------------------------
# Mind Meld — "التقاء العقول": weightless lydian shimmer
# ---------------------------------------------------------------------------

def medium() -> Song:
    s = Song(bpm=72, beats=64, reverb=0.36, seed=24)
    A = ['Dmaj7', 'E', 'Dmaj7', 'E', 'Bm7', 'E', 'Gmaj7', 'A']
    B = ['Gmaj7', 'A', 'F#m7', 'Bm7', 'Gmaj7', 'A', 'Dmaj7', 'E']
    prog = A + B
    comp(s, 'pad_2_warm', prog, 'pad', vel=0.26)
    arp(s, 'kalimba', prog, vel=0.34, pan=-0.3, octave=1, step=0.5, shape=(0, 2, 1, 3, 2, 1, 3, 0))
    bass(s, 'acoustic_bass', prog, 'root', vel=0.55)
    s.line('vibraphone', 'F#5:2 A5:2 | G#5:3 B5:1 | C#6:2 A5:2 | B5:4 | D6:2 B5:1 A5:1 | G#5:2 E5:2 | '
           'F#5:2 D5:1 B4:1 | C#5:4', 0, vel=0.56, pan=0.25)
    s.line('vibraphone', 'D6:2 C#6:2 | E6:4 | C#6:2 A5:2 | B5:4 | D6:1 C#6:1 B5:1 A5:1 | C#6:4 | '
           'A5:2 F#5:2 | G#5:4', 32, vel=0.5, pan=0.25)
    s.line('choir_aahs', 'B4:4 | C#5:4 | A4:4 | D5:4 | F#5:4 | E5:4 | F#5:4 | G#5:4', 32, vel=0.24,
           pan=-0.15)
    s.pattern('K.......K.......', 0, 16, vel=0.4, step=0.25)
    return s


# ---------------------------------------------------------------------------
# Link Board — "شفرة الأربع كلمات": cosy puzzle-solving marimba
# ---------------------------------------------------------------------------

def soclover() -> Song:
    s = Song(bpm=100, beats=64, swing=0.1, reverb=0.2, seed=25)
    A = ['A', 'F#m', 'D', 'E', 'A', 'F#m', 'Bm', 'E']
    B = ['D', 'E', 'C#m', 'F#m', 'D', 'E', 'A', 'E']
    prog = A + B
    bass(s, 'acoustic_bass', prog, 'half', vel=0.75)
    comp(s, 'pizzicato_strings', prog, 'offbeat', vel=0.36, pan=-0.3)
    s.line('marimba', 'E5:.5 A5:.5 C#6:.5 A5:.5 E5:1 C#5:1 | F#5:.5 A5:.5 C#6:1 B5:.5 A5:.5 F#5:1 | '
           'D5:.5 F#5:.5 A5:1 B5:.5 A5:.5 F#5:1 | E5:1 G#5:1 B5:2 | '
           'C#6:.5 B5:.5 A5:.5 E5:.5 C#5:1 E5:1 | A5:1 F#5:.5 E5:.5 C#5:2 | '
           'D5:.5 F#5:.5 B5:1 A5:.5 F#5:.5 D5:1 | E5:3 r:1', 0, vel=0.68, pan=0.2)
    s.line('kalimba', 'F#5:1 A5:1 D6:1 A5:1 | G#5:1 B5:1 E6:2 | E5:.5 G#5:.5 C#6:1 B5:1 G#5:1 | '
           'A5:2 F#5:2 | D6:.5 C#6:.5 A5:.5 F#5:.5 D5:2 | E5:.5 G#5:.5 B5:.5 E6:.5 D6:2 | '
           'C#6:1 A5:1 E5:2 | B5:2 G#5:1 E5:1', 32, vel=0.66, pan=0.25)
    s.pattern('s.s.s.s.s.s.s.s.', 0, 16, vel=0.32, pan=0.3, step=0.25)
    s.pattern('K.......K.......', 0, 16, vel=0.45, step=0.25)
    return s


# ---------------------------------------------------------------------------
# Rank It! — "تخاطر الأرقام": a cute counting tune on music box
# ---------------------------------------------------------------------------

def ito() -> Song:
    s = Song(bpm=112, beats=64, swing=0.06, reverb=0.22, seed=26)
    A = ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'G']
    B = ['F', 'C', 'G', 'Am', 'F', 'C', 'Dm7', 'G']
    prog = A + B
    bass(s, 'acoustic_bass', prog, 'half', vel=0.7)
    arp(s, 'acoustic_guitar_nylon', prog, vel=0.36, pan=-0.3, octave=0, step=0.5, shape=(0, 2, 1, 2))
    s.line('music_box', 'C5:.5 D5:.5 E5:.5 G5:.5 C6:1 G5:1 | B5:.5 A5:.5 G5:.5 D5:.5 G5:2 | '
           'A5:.5 G5:.5 E5:.5 C5:.5 E5:1 A5:1 | F5:3 r:1 | E5:.5 F5:.5 G5:.5 C6:.5 E6:1 C6:1 | '
           'D6:1 B5:1 G5:2 | A5:.5 G5:.5 F5:.5 A5:.5 C6:1 A5:1 | G5:2 B5:1 D6:1', 0, vel=0.66, pan=0.2)
    s.line('glockenspiel', 'A5:1 C6:1 F6:2 | E6:1 C6:1 G5:2 | D6:.5 C6:.5 B5:.5 A5:.5 G5:2 | E6:3 r:1 | '
           'F6:.5 E6:.5 D6:.5 C6:.5 A5:2 | G5:.5 C6:.5 E6:1 D6:1 C6:1 | D6:1 F6:1 A5:1 C6:1 | B5:2 D6:2',
           32, vel=0.5, pan=0.25)
    s.pattern('....C.......C...', 0, 16, vel=0.4, pan=-0.1, step=0.25)
    s.pattern('K.......K.......', 0, 16, vel=0.45, step=0.25)
    return s


# ---------------------------------------------------------------------------
# Word Bomb — "قنبلة الحروف": a frantic race against the fuse
# ---------------------------------------------------------------------------

def wordbomb() -> Song:
    s = Song(bpm=152, beats=64, reverb=0.14, seed=27)
    A = ['Em', 'C', 'D', 'B', 'Em', 'C', 'D', 'B']
    B = ['Am', 'Em', 'C', 'B', 'Am', 'C', 'D', 'B']
    prog = A + B
    bass(s, 'acoustic_bass', prog, 'pulse8', vel=0.7)
    comp(s, 'string_ensemble_1', prog, 'offbeat', vel=0.4, pan=-0.25)
    s.line('xylophone', 'E5:.5 G5:.5 B5:.5 G5:.5 E5:.5 G5:.5 B5:.5 E6:.5 | E6:.5 C6:.5 G5:.5 E5:.5 G5:.5 C6:.5 E6:1 | '
           'F#6:.5 D6:.5 A5:.5 F#5:.5 A5:.5 D6:.5 F#6:1 | D#6:1 B5:1 F#5:1 D#5:1 | '
           'E6:.5 D6:.5 B5:.5 G5:.5 E5:1 G5:1 | C6:.5 B5:.5 G5:.5 E5:.5 C5:1 E5:1 | '
           'D5:.5 F#5:.5 A5:.5 D6:.5 C6:1 A5:1 | B5:2 D#6:2', 0, vel=0.62, pan=0.25)
    s.line('brass_section', 'A4:1 C5:1 E5:2 | G5:1 E5:1 B4:2 | C5:1 E5:1 G5:2 | F#5:2 D#5:2 | '
           'E5:.5 F#5:.5 G5:.5 A5:.5 C6:2 | B5:1 G5:1 E5:2 | F#5:.5 G5:.5 A5:.5 B5:.5 D6:2 | D#6:2 B5:2',
           32, vel=0.55, pan=0.2)
    s.pattern('K.....K.K.......', 0, 16, vel=0.7, step=0.25)
    s.pattern('....S.......S...', 0, 16, vel=0.5, pan=0.05, step=0.25)
    s.pattern('t.t.t.t.t.t.t.t.', 0, 16, vel=0.5, pan=0.35, step=0.25)
    return s


# ---------------------------------------------------------------------------
# Silent Pulse — "نبض الصمت": sparse piano and a slow heartbeat
# ---------------------------------------------------------------------------

def themind() -> Song:
    s = Song(bpm=66, beats=64, reverb=0.38, seed=28)
    A = ['Am', 'Fmaj7', 'C', 'G', 'Am', 'Fmaj7', 'Dm7', 'E']
    B = ['Fmaj7', 'C', 'G', 'Am', 'Fmaj7', 'C', 'Dm7', 'E']
    prog = A + B
    comp(s, 'pad_2_warm', prog, 'pad', vel=0.24)
    comp(s, 'acoustic_grand_piano', prog, 'block', vel=0.26, pan=-0.2, strum=0.04)
    bass(s, 'acoustic_bass', prog, 'root', vel=0.5)
    s.line('acoustic_grand_piano', 'E5:2 C5:2 | A4:3 r:1 | G5:2 E5:2 | D5:4 | C5:1 E5:1 A5:2 | G5:2 E5:2 | '
           'F5:2 D5:2 | G#4:4', 0, vel=0.55, pan=0.2)
    s.line('acoustic_grand_piano', 'A5:2 G5:1 E5:1 | E5:4 | D5:2 B4:2 | C5:4 | C6:2 A5:2 | G5:2 E5:2 | '
           'D5:2 F5:2 | E5:2 G#4:2', 32, vel=0.52, pan=0.2)
    s.pattern('K..K............', 0, 16, vel=0.45, step=0.25)
    return s


TRACKS = {
    'lobby': lobby,
    'boomdeck': boomdeck,
    'wavelength': wavelength,
    'skull': skull,
    'sheriff': sheriff,
    'cashnguns': cashnguns,
    'onenight': onenight,
    'resistance': resistance,
    'artauction': artauction,
    'alibi': alibi,
    'splitsteal': splitsteal,
    'chameleon': chameleon,
    'dixit': dixit,
    'taboo': taboo,
    'fakeartist': fakeartist,
    'wits': wits,
    'medium': medium,
    'soclover': soclover,
    'ito': ito,
    'wordbomb': wordbomb,
    'themind': themind,
}
