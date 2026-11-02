"""One looping theme per game. Run `python tools/music/build.py` to render."""

from engine import Song

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
# Trix — "تركس الملوك": Levantine card table, maqam Bayati on D with quarter tones
# ---------------------------------------------------------------------------

def trix() -> Song:
    s = Song(bpm=112, beats=64, swing=0.05, reverb=0.2)
    harm = ['D5', 'D5', 'D5', 'G5', 'C5', 'D5', 'G5', 'D5',
            'D5', 'G5', 'F5', 'D5', 'C5', 'Bb5', 'C5', 'D5']
    for bar, c in enumerate(harm):
        b = bar * 4
        s.chord('acoustic_guitar_nylon', CH[c], b, 0.9, vel=0.5, pan=-0.3, strum=0.02)
        s.chord('acoustic_guitar_nylon', CH[c][1:], b + 1.5, 0.45, vel=0.4, pan=-0.3)
        s.chord('acoustic_guitar_nylon', CH[c][1:], b + 2, 0.9, vel=0.45, pan=-0.3)
        s.chord('acoustic_guitar_nylon', CH[c][1:], b + 3, 0.45, vel=0.38, pan=-0.3)
        r = CH[c][0].replace('3', '2') if CH[c][0].endswith('3') else CH[c][0]
        s.note('acoustic_bass', r, b, 1, vel=0.85)
        s.note('acoustic_bass', r, b + 1.5, 0.5, vel=0.6)
        s.note('acoustic_bass', r, b + 2, 1, vel=0.75)

    s.line('accordion', 'D4:.5 E~4:.5 F4:.5 G4:.5 A4:1 G4:.5 F4:.5 | E~4:.5 F4:.5 E~4:.5 D4:.5 D4:2 | '
           'A4:.5 Bb4:.5 A4:.5 G4:.5 F4:.5 G4:.5 A4:1 | G4:.5 F4:.5 E~4:.5 F4:.5 G4:2 | '
           'C5:.5 Bb4:.5 A4:.5 G4:.5 A4:1 Bb4:1 | A4:.5 G4:.5 F4:.5 G4:.5 A4:2 | '
           'G4:.5 A4:.5 Bb4:.5 A4:.5 G4:.5 F4:.5 E~4:.5 F4:.5 | E~4:1 D4:3', 0, vel=0.7, pan=0.2)
    s.line('orchestral_harp', 'A4:.25 Bb4:.25 C5:.25 D5:.25 C5:.5 Bb4:.5 A4:1 A4:1 | '
           'G4:.25 A4:.25 Bb4:.25 C5:.25 Bb4:.5 A4:.5 G4:2 | '
           'F4:.25 G4:.25 A4:.25 Bb4:.25 A4:.5 G4:.5 F4:1 G4:1 | A4:2 r:1 A4:.5 Bb4:.5 | '
           'C5:.5 D5:.5 C5:.5 Bb4:.5 A4:.5 Bb4:.5 C5:1 | Bb4:.5 A4:.5 G4:.5 A4:.5 Bb4:2 | '
           'A4:.5 G4:.5 F4:.5 E~4:.5 F4:.5 G4:.5 E~4:1 | D4:3 r:1', 32, vel=0.75, pan=0.25, octave=1)
    s.line('accordion', 'D4:4 | D4:4 | F4:4 | A4:4 | G4:4 | F4:4 | A4:4 | A3:4', 32, vel=0.3, pan=-0.1)

    s.pattern('D...T.T.D.D.T...', 0, 16, vel=0.8, pan=0.05, step=0.25)
    s.pattern('.k.k...k.k.k...k', 0, 16, vel=0.55, pan=0.15, step=0.25)
    s.pattern('R.r.R.r.R.r.R.r.', 0, 16, vel=0.42, pan=-0.25, step=0.25)
    return s


TRACKS = {
    'lobby': lobby,
    'boomdeck': boomdeck,
    'wavelength': wavelength,
    'trix': trix,
}
