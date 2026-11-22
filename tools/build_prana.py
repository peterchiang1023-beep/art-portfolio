"""Build the Prana Sans web fonts from Archivo (SIL Open Font License 1.1).

Prana Sans treats every glyph as a small body: an axis, and breath moving around it.
  - every shape draws in slightly at its waist (the middle of its height), like a held breath
  - straight lines are the axis: they breathe much less, and both edges of a stroke move at
    the same height, so the axis stays straight
  - round inner spaces (o, e, a, b, d, p, q, the upper loop of g...) turn a few degrees as one piece

Two strengths exist:
  QUIET  — the agreed design ("draft 6"), used for all static fonts
  STRONG — the stronger "draft 4": deeper waist, every shape slightly twisted at its waist
The breathing fonts are variable fonts with one custom axis, BRTH (0 = quiet, 100 = strong),
so the letters can breathe between the two with CSS (font-variation-settings: "BRTH" n).

Usage: python3 build_prana.py [--strong] <Archivo[wdth,wght].ttf> <Archivo-Italic[wdth,wght].ttf> <out-dir>
(--strong builds only the experimental STRONG static fonts, family "Prana Sans Strong")
"""
import math
import sys
import tempfile
from pathlib import Path

from fontTools import subset
from fontTools.designspaceLib import AxisDescriptor, DesignSpaceDocument, SourceDescriptor
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables import ttProgram
from fontTools.ttLib.tables._g_l_y_f import Glyph, GlyphCoordinates
from fontTools.varLib import build as build_variable
from fontTools.varLib.instancer import instantiateVariableFont

# (weight, width, italic) combinations the portfolio uses
STATIC = [(400, 100, 0), (500, 100, 0), (600, 100, 0), (400, 112, 0), (700, 112, 0),
          (400, 125, 0), (500, 125, 0), (700, 125, 0), (800, 125, 0),
          (300, 100, 1), (300, 112, 1)]
BREATHING = [(800, 125, 0), (700, 125, 0), (400, 100, 0), (300, 100, 1)]
WIDTH_NAMES = {100: "", 112: "SemiExpanded", 125: "Expanded"}
WEIGHT_NAMES = {300: "Light", 400: "Regular", 500: "Medium", 600: "SemiBold", 700: "Bold", 800: "ExtraBold"}
UNICODES = (
    list(range(0x20, 0x7F)) + list(range(0xA0, 0x250)) + list(range(0x2000, 0x2070))
    + list(range(0x20A0, 0x20C0)) + list(range(0x2100, 0x2200)) + [0x2212, 0x25CF, 0xFB01, 0xFB02]
)

QUIET = dict(name="quiet", axis=0.25, small=0.6, twist=0.0, counter_turn=-6.0, counter_depth=0.8,
             depth=lambda w: 4.2 + (w - 400) / 400 * 4.8)
STRONG = dict(name="strong", axis=1.0, small=0.85, twist=-4.0, counter_turn=0.0, counter_depth=1.0,
              depth=lambda w: 9.5 + (w - 400) / 400 * 11.5)


# ---------- outlines ----------
def contours_of(glyph, glyf):
    """TrueType contours as lists of segments ('L', p0, p1) / ('Q', p0, c, p1)."""
    coords, ends, flags = glyph.getCoordinates(glyf)
    out, start = [], 0
    for end in ends:
        pts = [(coords[i][0], coords[i][1], flags[i] & 1) for i in range(start, end + 1)]
        start = end + 1
        if not pts:
            continue
        k = next((i for i, p in enumerate(pts) if p[2]), None)
        if k is None:
            a, b = pts[0], pts[1]
            pts = [((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 1)] + pts[1:] + [pts[0]]
        else:
            pts = pts[k:] + pts[:k]
        segs, cur, ctrl = [], (pts[0][0], pts[0][1]), None
        for x, y, on in pts[1:] + [pts[0]]:
            if on:
                segs.append(("Q", cur, ctrl, (x, y)) if ctrl else ("L", cur, (x, y)))
                cur, ctrl = (x, y), None
            else:
                if ctrl:
                    mid = ((ctrl[0] + x) / 2, (ctrl[1] + y) / 2)
                    segs.append(("Q", cur, ctrl, mid))
                    cur = mid
                ctrl = (x, y)
        out.append([s for s in segs if not (s[0] == "L" and s[1] == s[2])])
    return [c for c in out if c]


def bbox(segs):
    xs = [p[0] for s in segs for p in s[1:] if p is not None]
    ys = [p[1] for s in segs for p in s[1:] if p is not None]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    return dict(x0=x0, x1=x1, y0=y0, y1=y1, w=x1 - x0, h=y1 - y0, cx=(x0 + x1) / 2, cy=(y0 + y1) / 2)


def area(segs):
    pts = [s[-1] for s in segs]
    return sum(pts[i - 1][0] * pts[i][1] - pts[i][0] * pts[i - 1][1] for i in range(len(pts))) / 2


def roundish(segs, b):
    return not any(s[0] == "L" and math.dist(s[1], s[2]) > b["h"] * 0.22 for s in segs)


def sample(segs):
    """Dense polyline; points on long straight lines are flagged (they are axes).
    The result depends only on the original outline, so every strength gets the same points."""
    pts = [(segs[0][1][0], segs[0][1][1], 0)]
    for s in segs:
        if s[0] == "L":
            pts.append((s[2][0], s[2][1], 0))
        else:
            p0, c, p1 = s[1], s[2], s[3]
            n = max(4, math.ceil((math.dist(p0, p1) + 1) / 9))
            for i in range(1, n + 1):
                t = i / n
                u = 1 - t
                pts.append((u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1], 0))
    out = []
    for i, p in enumerate(pts):
        q = pts[(i + 1) % len(pts)]
        out.append(p)
        ln = math.dist(p[:2], q[:2])
        n = int(ln // 12)
        straight = 1 if ln > 120 else 0
        for k in range(1, n):
            out.append((p[0] + (q[0] - p[0]) * k / n, p[1] + (q[1] - p[1]) * k / n, straight))
    clean = []
    for p in out:
        if not clean or math.dist(p[:2], clean[-1][:2]) > 1.5:
            clean.append(p)
    while len(clean) > 2 and math.dist(clean[0][:2], clean[-1][:2]) < 1.5:
        clean.pop()
    return clean


def rotate_pts(pts, cx, cy, deg):
    a = math.radians(deg)
    co, si = math.cos(a), math.sin(a)
    return [(cx + (x - cx) * co - (y - cy) * si, cy + (x - cx) * si + (y - cy) * co, f) for x, y, f in pts]


def gesture(pts, depth, band, style):
    """Move every point into the ink by a breath centred on the waist; optionally twist."""
    n = len(pts)
    xs = [p[0] for p in pts]
    cy, h = band
    cx = (min(xs) + max(xs)) / 2
    sig = max(40.0, h * 0.3)
    small = min(1.0, max(style["small"], h / 260))
    nrm, soft = [], []
    for i in range(n):
        x, y = pts[i][:2]
        p, q = pts[i - 2], pts[(i + 2) % n]
        tx, ty = q[0] - p[0], q[1] - p[1]
        tl = math.hypot(tx, ty) or 1
        nrm.append((ty / tl, -tx / tl))  # into the ink (TrueType winding)
        p1, q1 = pts[i - 1], pts[(i + 1) % n]
        ax, ay, bx, by = x - p1[0], y - p1[1], q1[0] - x, q1[1] - y
        c = (ax * bx + ay * by) / ((math.hypot(ax, ay) * math.hypot(bx, by)) or 1)
        soft.append(max(0.0, min(1.0, (c + 0.2) / 1.1)))
    R = 6
    calm = []
    for i in range(n):
        m = 1.0
        for k in range(-R, R + 1):
            v = soft[(i + k) % n]
            m = min(m, v + (1 - v) * abs(k) / (R + 1))
        calm.append(m)
    line = [style["axis"] if p[2] else 1.0 for p in pts]
    blend = []
    for i in range(n):
        s = w = 0.0
        for k in range(-5, 6):
            ww = 6 - abs(k)
            s += line[(i + k) % n] * ww
            w += ww
        blend.append(min(1.0, s / w) if line[i] == 1 else s / w)
    out = []
    tw = math.radians(style["twist"])
    for i in range(n):
        x, y = pts[i][:2]
        g = math.exp(-(((y - cy) / sig) ** 2))
        if tw:
            a = tw * g
            dx, dy = x - cx, y - cy
            x, y = cx + dx * math.cos(a) - dy * math.sin(a), cy + dx * math.sin(a) + dy * math.cos(a)
        k = depth * g * small * calm[i] * blend[i]
        out.append((x + nrm[i][0] * k, y + nrm[i][1] * k))
    return out


def keep_indices(pts, tol):
    """Douglas-Peucker on a closed polyline; returns the indices worth keeping."""
    n = len(pts)
    if n < 8:
        return set(range(n))
    far = max(range(n), key=lambda i: math.dist(pts[0], pts[i]))
    keep = {0, far}

    def dp(i0, i1):  # indices i0..i1 along the loop (i1 may be n meaning 0)
        a, b = pts[i0 % n], pts[i1 % n]
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dy) or 1
        idx, dmax = None, -1
        for i in range(i0 + 1, i1):
            p = pts[i % n]
            d = abs(dy * (p[0] - a[0]) - dx * (p[1] - a[1])) / L
            if d > dmax:
                idx, dmax = i, d
        if idx is not None and dmax > tol:
            keep.add(idx % n)
            dp(i0, idx)
            dp(idx, i1)

    dp(0, far)
    dp(far, n)
    return keep


def shape_glyph(glyph, glyf, weight, styles):
    """Return one new Glyph per style, all with exactly the same point structure."""
    cs = contours_of(glyph, glyf)
    if not cs:
        return None
    boxes = [bbox(c) for c in cs]
    areas = [area(c) for c in cs]
    skin = math.copysign(1, max(areas, key=abs)) if any(areas) else 1
    per_style = [[] for _ in styles]
    for c, b, a in zip(cs, boxes, areas):
        pts = sample(c)
        inner = math.copysign(1, a) != skin
        host = b
        if inner:
            host = next((o for o, oa in zip(boxes, areas) if math.copysign(1, oa) == skin
                         and o["x0"] <= b["x0"] + 1 and o["x1"] >= b["x1"] - 1
                         and o["y0"] <= b["y0"] + 1 and o["y1"] >= b["y1"] - 1), b)
        ys = [p[1] for p in pts]
        own = ((min(ys) + max(ys)) / 2, max(ys) - min(ys)) if len(pts) >= 3 else (b["cy"], b["h"])
        results = []
        for st in styles:
            if len(pts) < 3:
                results.append([p[:2] for p in pts])
                continue
            depth = st["depth"](weight)
            if inner:
                p2 = pts
                if st["counter_turn"] and b["h"] > 120 and roundish(c, b):
                    p2 = rotate_pts(pts, b["cx"], b["cy"], st["counter_turn"])
                if st["name"] == "quiet":
                    band = (host["cy"], host["h"])
                else:
                    band = (b["cy"], max(b["h"], (host["h"] + b["h"]) / 2.4) if host is not b else b["h"])
                results.append(gesture(p2, depth * st["counter_depth"], band, st))
            else:
                results.append(gesture(pts, depth, own, st))
        keep = set()
        for r in results:
            keep |= keep_indices(r, 0.35)
        idx = sorted(keep)
        for s, r in enumerate(results):
            per_style[s].append([r[i] for i in idx])
    glyphs = []
    for contours in per_style:
        g = Glyph()
        coords, ends, flags = [], [], []
        for cont in contours:
            for x, y in cont:
                coords.append((round(x), round(y)))
                flags.append(1)
            ends.append(len(coords) - 1)
        g.coordinates = GlyphCoordinates(coords)
        g.endPtsOfContours = ends
        g.flags = bytearray(flags)
        g.numberOfContours = len(ends)
        g.program = ttProgram.Program()
        g.program.fromBytecode(b"")
        glyphs.append(g)
    return glyphs


# ---------- fonts ----------
def base_instance(vf_path, weight, width):
    font = instantiateVariableFont(TTFont(vf_path), {"wght": weight, "wdth": width})
    opts = subset.Options()
    opts.layout_features = ["*"]
    opts.name_IDs = ["*"]
    opts.notdef_outline = True
    opts.hinting = False
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=UNICODES)
    sub.subset(font)
    for t in ("fpgm", "prep", "cvt ", "hdmx", "LTSH", "VDMX", "STAT"):
        if t in font:
            del font[t]
    return font


def shaped_fonts(vf_path, weight, width, styles):
    fonts = [base_instance(vf_path, weight, width) for _ in styles]
    glyf0 = fonts[0]["glyf"]
    for name in fonts[0].getGlyphOrder():
        g = glyf0[name]
        if g.isComposite() or g.numberOfContours <= 0:
            for f in fonts:
                gg = f["glyf"][name]
                if hasattr(gg, "program"):
                    gg.program = ttProgram.Program()
                    gg.program.fromBytecode(b"")
            continue
        new = shape_glyph(g, glyf0, weight, styles)
        if new:
            for f, ng in zip(fonts, new):
                f["glyf"][name] = ng
    return fonts


def set_names(font, family, style, extra=""):
    name = font["name"]
    for rec in list(name.names):
        if rec.nameID in (1, 2, 3, 4, 6, 16, 17, 21, 22, 25):
            name.removeNames(nameID=rec.nameID)
    full = f"{family} {style}"
    ps = full.replace(" ", "")
    simple = style in ("Regular", "Bold", "Italic", "Bold Italic")
    for nid, val in ((1, family if simple else full), (2, style if simple else ("Italic" if "Italic" in style else "Regular")),
                     (3, f"{ps};PranaSans{extra}"), (4, full), (6, ps), (16, family), (17, style)):
        name.setName(val, nid, 3, 1, 0x409)
    old = name.getDebugName(0) or ""
    if "Prana Sans" not in old:
        name.setName(old + " Prana Sans: modified from Archivo for Chiang Cheng-Te, 2026.", 0, 3, 1, 0x409)


def file_stem(weight, width, italic, breathing=False):
    w = WEIGHT_NAMES[weight] + ("Italic" if italic else "")
    return f"PranaSans{'Breath' if breathing else ''}{WIDTH_NAMES[width]}-{w}"


def build(upright, italic_vf, out_dir):
    out_dir.mkdir(parents=True, exist_ok=True)
    for weight, width, italic in STATIC:
        (font,) = shaped_fonts(italic_vf if italic else upright, weight, width, [QUIET])
        style = WEIGHT_NAMES[weight] + (" Italic" if italic else "")
        set_names(font, ("Prana Sans " + WIDTH_NAMES[width]).strip(), style)
        path = out_dir / (file_stem(weight, width, italic) + ".woff2")
        font.flavor = "woff2"
        font.save(path)
        print(f"{path.name}: {path.stat().st_size // 1024} KB")
    with tempfile.TemporaryDirectory() as tmp:
        for weight, width, italic in BREATHING:
            quiet, strong = shaped_fonts(italic_vf if italic else upright, weight, width, [QUIET, STRONG])
            ds = DesignSpaceDocument()
            ax = AxisDescriptor()
            ax.tag, ax.name, ax.minimum, ax.default, ax.maximum = "BRTH", "Breath", 0, 0, 100
            ds.addAxis(ax)
            for loc, f in ((0, quiet), (100, strong)):
                p = Path(tmp) / f"m{loc}.ttf"
                f.save(p)
                src = SourceDescriptor()
                src.path, src.location = str(p), {"Breath": loc}
                ds.addSource(src)
            vf, _, _ = build_variable(ds)
            style = WEIGHT_NAMES[weight] + (" Italic" if italic else "")
            set_names(vf, ("Prana Sans Breath " + WIDTH_NAMES[width]).strip(), style, "Breath")
            path = out_dir / (file_stem(weight, width, italic, True) + ".woff2")
            vf.flavor = "woff2"
            vf.save(path)
            print(f"{path.name}: {path.stat().st_size // 1024} KB (variable, BRTH 0-100)")


def build_strong(upright, italic_vf, out_dir):
    """Experimental: every static combination in the STRONG strength, as family "Prana Sans Strong"."""
    out_dir.mkdir(parents=True, exist_ok=True)
    for weight, width, italic in STATIC:
        (font,) = shaped_fonts(italic_vf if italic else upright, weight, width, [STRONG])
        style = WEIGHT_NAMES[weight] + (" Italic" if italic else "")
        set_names(font, ("Prana Sans Strong " + WIDTH_NAMES[width]).strip(), style, "Strong")
        path = out_dir / (file_stem(weight, width, italic).replace("PranaSans", "PranaSansStrong") + ".woff2")
        font.flavor = "woff2"
        font.save(path)
        print(f"{path.name}: {path.stat().st_size // 1024} KB")


if __name__ == "__main__":
    args = sys.argv[1:]
    if args and args[0] == "--strong":
        build_strong(Path(args[1]), Path(args[2]), Path(args[3]))
    else:
        build(Path(args[0]), Path(args[1]), Path(args[2]))
