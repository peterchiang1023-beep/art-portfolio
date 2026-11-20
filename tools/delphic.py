"""Generate the Delphic-E graphics (SVG).

Glyph: a stem, a horizontal bar, and outward arcs. The arcs belong to an elongated
ellipse that touches the stems, so repeated it forms an endless chain  |0|0|0|  whose
waists at the stems read as a sideways hourglass and, tilted, like a DNA strand.
Stroke ends are square-cut, matching the extended grotesque.

Files:
  delphic-tile.svg       crisp chain, two offset rows (mask)
  delphic-tile-ink.svg   the same chain swollen and blurred, for the ink-bleed layer (mask)
  melt-mask.svg          where the crisp chain survives: bold liquid blobs + drips
  melt-mask-ink.svg      where the ink bleeds: the same shape, spread wider and softer
  delphic-e.svg          the diagonal mark: stem | loop | stem
  favicon.svg            the mark on coral red
"""
import math, os, sys

out = sys.argv[1]
SW = 40            # stroke width
B = 150            # ellipse half-height (stroke centre)
A = round(B * 1.45)  # ellipse half-length (stroke centre) -> the "longer circle"
L = 2 * (A + SW)   # stem-to-stem distance = tile width
STEM = B + SW / 2 + 16  # half-height of a stem (a little taller than the loop)
ANGLE = -28


def chain_row(cy, shift=False):
    """One row of the chain. shift=False: stem in the middle, loops centred on the tile edges.
    shift=True: loop in the middle, stems on the edges (each half shows, so it tiles)."""
    p = [f'<rect x="-20" y="{cy - SW/2}" width="{L + 40}" height="{SW}"/>']
    stems = [L / 2] if not shift else [0, L]
    loops = [0, L] if not shift else [L / 2]
    for x in stems:
        p.append(f'<rect x="{x - SW/2}" y="{cy - STEM}" width="{SW}" height="{2*STEM}"/>')
    for x in loops:
        p.append(f'<ellipse cx="{x}" cy="{cy}" rx="{A}" ry="{B}" fill="none" stroke="#fff" stroke-width="{SW}"/>')
    return "".join(p)


TH = 960
rows = f'{chain_row(240)}{chain_row(720, shift=True)}'
open(os.path.join(out, "delphic-tile.svg"), "w").write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {L} {TH}" width="{L}" height="{TH}">'
    f'<g fill="#fff">{rows}</g></svg>')

# ink version: swollen + blurred strokes (edges of the tile wrap, so blur only inside)
open(os.path.join(out, "delphic-tile-ink.svg"), "w").write(
    f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {L} {TH}" width="{L}" height="{TH}">
<defs><filter id="ink" x="-5%" y="-5%" width="110%" height="110%">
  <feMorphology operator="dilate" radius="10"/>
  <feGaussianBlur stdDeviation="16"/>
  <feComponentTransfer><feFuncA type="linear" slope="1.4"/></feComponentTransfer>
</filter></defs>
<g fill="#fff" filter="url(#ink)">{rows}</g></svg>''')


def mask_svg(bleed):
    """Bold, watery ruin. Big liquid blobs eat the field; drips pull it down; a gooey
    threshold keeps edges smooth like ink. The bleed version is spread wider and softer."""
    tail = ('''
    <feMorphology in="core" operator="dilate" radius="16" result="wide"/>
    <feGaussianBlur in="wide" stdDeviation="20" result="soft"/>
    <feColorMatrix in="soft" type="luminanceToAlpha"/>''' if bleed else '''
    <feColorMatrix in="core" type="luminanceToAlpha"/>''')
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" width="1600" height="1000" preserveAspectRatio="none">
<defs>
  <radialGradient id="v" cx="0.6" cy="0.4" r="0.56">
    <stop offset="0" stop-color="#fff"/><stop offset="0.2" stop-color="#fff"/><stop offset="1" stop-color="#000"/>
  </radialGradient>
  <filter id="m" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB">
    <!-- large liquid warping of the whole field -->
    <feTurbulence type="fractalNoise" baseFrequency="0.0032 0.0055" numOctaves="4" seed="3" result="t1"/>
    <feDisplacementMap in="SourceGraphic" in2="t1" scale="560" xChannelSelector="R" yChannelSelector="G" result="warp"/>
    <!-- drips: vertical streak noise drags it downward -->
    <feTurbulence type="fractalNoise" baseFrequency="0.014 0.0012" numOctaves="2" seed="11" result="t2"/>
    <feDisplacementMap in="warp" in2="t2" scale="340" xChannelSelector="B" yChannelSelector="G" result="drip"/>
    <!-- blotches: big holes punched through, deeper into the centre -->
    <feTurbulence type="fractalNoise" baseFrequency="0.0055 0.0075" numOctaves="5" seed="8" result="n"/>
    <feColorMatrix in="n" type="matrix" values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 1" result="ng"/>
    <feComposite in="drip" in2="ng" operator="arithmetic" k1="0" k2="1.35" k3="1.7" k4="-1.08" result="c"/>
    <!-- gooey threshold: blur then steep contrast = smooth, bold, liquid edges -->
    <feGaussianBlur in="c" stdDeviation="9" result="cb"/>
    <feComponentTransfer in="cb" result="goo">
      <feFuncR type="linear" slope="14" intercept="-6.6"/>
      <feFuncG type="linear" slope="14" intercept="-6.6"/>
      <feFuncB type="linear" slope="14" intercept="-6.6"/>
      <feFuncA type="linear" slope="0" intercept="1"/>
    </feComponentTransfer>
    <!-- spatter: scattered ink droplets around the blot -->
    <feTurbulence type="fractalNoise" baseFrequency="0.013" numOctaves="2" seed="33" result="t4"/>
    <feComponentTransfer in="t4" result="drops">
      <feFuncR type="linear" slope="30" intercept="-20.4"/>
      <feFuncG type="linear" slope="30" intercept="-20.4"/>
      <feFuncB type="linear" slope="30" intercept="-20.4"/>
      <feFuncA type="linear" slope="0" intercept="1"/>
    </feComponentTransfer>
    <feComposite in="drops" in2="warp" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="dropsW"/>
    <feComponentTransfer in="dropsW" result="dropsIn">
      <feFuncR type="linear" slope="6" intercept="-1.2"/>
      <feFuncG type="linear" slope="6" intercept="-1.2"/>
      <feFuncB type="linear" slope="6" intercept="-1.2"/>
      <feFuncA type="linear" slope="0" intercept="1"/>
    </feComponentTransfer>
    <feComposite in="goo" in2="dropsIn" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="gooSp"/>
    <!-- feathered ink fringe on the edges -->
    <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="21" result="t3"/>
    <feDisplacementMap in="gooSp" in2="t3" scale="18" xChannelSelector="R" yChannelSelector="G" result="core"/>{tail}
  </filter>
</defs>
<rect width="1600" height="1000" fill="url(#v)" filter="url(#m)"/>
</svg>'''


open(os.path.join(out, "melt-mask.svg"), "w").write(mask_svg(False))
open(os.path.join(out, "melt-mask-ink.svg"), "w").write(mask_svg(True))


# ---- the mark: stem | loop | stem, bar from stroke to stroke, tilted like the field ----
def mark(fill, sw):
    a = A * sw / SW if False else A  # keep proportions of the loop
    w = 2 * a + 3 * sw              # stem + loop + stem, loop touching both stems
    stem_h = B + sw / 2 + 16
    cx = w / 2
    g = (f'<rect x="0" y="{-sw/2}" width="{w}" height="{sw}"/>'
         f'<rect x="0" y="{-stem_h}" width="{sw}" height="{2*stem_h}"/>'
         f'<rect x="{w - sw}" y="{-stem_h}" width="{sw}" height="{2*stem_h}"/>'
         f'<ellipse cx="{cx}" cy="0" rx="{a}" ry="{B}" fill="none" stroke="{fill}" stroke-width="{sw}"/>')
    rad = math.radians(abs(ANGLE))
    h = 2 * stem_h
    bw = w * math.cos(rad) + h * math.sin(rad)
    bh = w * math.sin(rad) + h * math.cos(rad)
    return bw, bh, f'<g fill="{fill}" transform="translate({bw/2} {bh/2}) rotate({ANGLE}) translate({-w/2} 0)">{g}</g>'

bw, bh, g = mark("#000", SW)
open(os.path.join(out, "delphic-e.svg"), "w").write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {bw:.0f} {bh:.0f}">{g}</svg>')
# favicon: heavier strokes so it survives 16px
fw, fh, fg = mark("#0b0a09", 64)
side = max(fw, fh) * 1.06
open(os.path.join(out, "favicon.svg"), "w").write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{-(side-fw)/2:.0f} {-(side-fh)/2:.0f} {side:.0f} {side:.0f}">'
    f'<rect x="{-(side-fw)/2:.0f}" y="{-(side-fh)/2:.0f}" width="{side:.0f}" height="{side:.0f}" fill="#ff4040"/>{fg}</svg>')
print(f"tile {L}x{TH}, mark {bw:.0f}x{bh:.0f} (aspect {bw/bh:.3f})")
