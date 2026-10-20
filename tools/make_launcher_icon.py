"""Draws the Android adaptive launcher icon layers (compass ring + red needle).

The launcher fills its own shape (circle, squircle...) with the background colour
in res/values/launcher.xml, so there is no white plate around the icon.
Run from the repo root:  python3 -I tools/make_launcher_icon.py
"""
from PIL import Image, ImageDraw

RES = 'android/app/src/main/res'
DENSITIES = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
RING, NEEDLE, SHADE = (226, 232, 227, 255), (194, 84, 84, 255), (122, 42, 42, 255)
SS = 4  # supersampling for smooth edges


def layer(px, mono=False):
    """One 108dp foreground layer at px pixels square. Units below are dp."""
    n = px * SS
    k = n / 108
    im = Image.new('RGBA', (n, n), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c = 54 * k
    ro, ri = 24 * k, 20.5 * k          # ring outer/inner radius
    d.ellipse([c - ro, c - ro, c + ro, c + ro], fill=RING)
    d.ellipse([c - ri, c - ri, c + ri, c + ri], fill=(0, 0, 0, 0))
    top, bot, half = 19.5 * k, 19.5 * k, 7.2 * k   # needle reach above/below centre, half width
    d.polygon([(c, c - top), (c + half, c), (c, c + bot), (c - half, c)], fill=NEEDLE)
    if not mono:
        d.polygon([(c, c), (c + half, c), (c, c + bot)], fill=SHADE)
    return im.resize((px, px), Image.LANCZOS)


for name, scale in DENSITIES.items():
    px = round(108 * scale)
    layer(px).save(f'{RES}/mipmap-{name}/ic_launcher_foreground.png')
    layer(px, mono=True).save(f'{RES}/mipmap-{name}/ic_launcher_monochrome.png')
