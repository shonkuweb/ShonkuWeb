"""Render original vector scenes to animated SVG and silent H.264 MP4.

Authoring only: requires Pillow and ffmpeg. The website has no runtime dependency.
Run: python3 scripts/render-motion.py
"""
from contextlib import contextmanager
from html import escape
from pathlib import Path
import math
import shutil
import subprocess
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'motion'
WIDTH, HEIGHT, FPS, SCALE = 1280, 720, 24, 1.5
PAPER, INK, ORANGE, GREEN, MUTED = '#f7f6f2', '#202d25', '#c94623', '#dce7bc', '#68735f'
FONT_ROOT = Path('/System/Library/Fonts/Supplemental')
FONT_REGULAR = FONT_ROOT / 'Arial.ttf'
FONT_BOLD = FONT_ROOT / 'Arial Bold.ttf'
if not FONT_REGULAR.exists():
    FONT_REGULAR = Path('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
    FONT_BOLD = Path('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')
FONTS = {}


def font(size, bold=False):
    key = (size, bold)
    if key not in FONTS:
        FONTS[key] = ImageFont.truetype(str(FONT_BOLD if bold else FONT_REGULAR), round(size * SCALE))
    return FONTS[key]


class Scene:
    """The same geometry produces raster frames and editable SVG primitives."""
    def __init__(self, time, duration, animated=False):
        self.time, self.duration, self.animated = time, duration, animated
        self.image = Image.new('RGB', (round(WIDTH * SCALE), round(HEIGHT * SCALE)), PAPER)
        self.draw = ImageDraw.Draw(self.image, 'RGBA')
        self.svg, self.alpha = [], 1.0

    def colour(self, value):
        return tuple(int(value[i:i + 2], 16) for i in (1, 3, 5)) + (round(255 * self.alpha),)

    @contextmanager
    def group(self, start, end):
        previous = self.alpha
        p = max(0, min(1, (self.time - start) / .55, (end - self.time) / .35))
        opacity = previous * p * p * (3 - 2 * p)
        parent_image, parent_draw = self.image, self.draw
        # Composite a partially visible group as one layer. Drawing transparent
        # text directly on RGB images is inconsistent across Pillow versions.
        partial = 0 < opacity < 1
        if partial:
            self.image = Image.new('RGBA', parent_image.size, (0, 0, 0, 0))
            self.draw = ImageDraw.Draw(self.image, 'RGBA')
        self.alpha = 1 if opacity > 0 else 0
        if self.animated:
            points = [(0, 0), (start, 0), (start + .55, 1), (end - .35, 1), (end, 0), (self.duration, 0)]
            points = sorted({max(0, min(self.duration, t)): v for t, v in points}.items())
            times = ';'.join(f'{t/self.duration:.5f}' for t, _ in points)
            values = ';'.join(str(v) for _, v in points)
            self.svg.append(f'<g opacity="0"><animate attributeName="opacity" dur="{self.duration}s" repeatCount="indefinite" keyTimes="{times}" values="{values}"/>')
        else:
            self.svg.append(f'<g opacity="{opacity:.3f}">')
        try:
            yield
        finally:
            self.svg.append('</g>')
            if partial:
                self.image.putalpha(self.image.getchannel('A').point(lambda value: round(value * opacity)))
                parent_image.paste(self.image, (0, 0), self.image)
                self.image, self.draw = parent_image, parent_draw
            self.alpha = previous

    def rect(self, x, y, w, h, fill=PAPER, stroke=None, radius=0, width=1.5):
        box = [round(v*SCALE) for v in (x, y, x+w, y+h)]
        if self.alpha:
            self.draw.rounded_rectangle(box, radius=round(radius*SCALE), fill=self.colour(fill), outline=self.colour(stroke) if stroke else None, width=max(1, round(width*SCALE)))
        self.svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{fill}" stroke="{stroke or "none"}" stroke-width="{width}"/>')

    def circle(self, x, y, r, fill=GREEN, stroke=None, width=1.5):
        if self.alpha:
            self.draw.ellipse([round(v*SCALE) for v in (x-r, y-r, x+r, y+r)], fill=self.colour(fill) if fill else None, outline=self.colour(stroke) if stroke else None, width=max(1,round(width*SCALE)))
        self.svg.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill or "none"}" stroke="{stroke or "none"}" stroke-width="{width}"/>')

    def line(self, points, colour=INK, width=2):
        if self.alpha:
            self.draw.line([(round(x*SCALE),round(y*SCALE)) for x,y in points], fill=self.colour(colour), width=max(1,round(width*SCALE)), joint='curve')
        self.svg.append(f'<polyline points="{" ".join(f"{x},{y}" for x,y in points)}" fill="none" stroke="{colour}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round"/>')

    def text(self, x, y, text, size=22, colour=INK, bold=False):
        if self.alpha:
            self.draw.text((round(x*SCALE),round(y*SCALE)), text, font=font(size,bold), fill=self.colour(colour), anchor='lt')
        self.svg.append(f'<text x="{x}" y="{y+size*.78}" font-family="Arial,sans-serif" font-size="{size}" font-weight="{700 if bold else 400}" fill="{colour}">{escape(text)}</text>')

    def moving_dot(self, x1, x2, y, start):
        progress = ((self.time - start) % 1.8) / 1.8
        x = x1 + (x2-x1) * progress
        if self.alpha:
            self.draw.ellipse([round(v*SCALE) for v in (x-4,y-4,x+4,y+4)],fill=self.colour(ORANGE))
        self.svg.append(f'<circle cx="{x1}" cy="{y}" r="4" fill="{ORANGE}"><animate attributeName="cx" from="{x1}" to="{x2}" dur="1.8s" begin="{start}s" repeatCount="indefinite"/></circle>')

    def output_svg(self, title):
        return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}" role="img" aria-labelledby="title"><title id="title">{escape(title)}</title><rect width="1280" height="720" fill="{PAPER}"/>'+''.join(self.svg)+'</svg>'


def symbol(s, name, x, y):
    """Small geometric illustrations, drawn without fonts or external artwork."""
    s.circle(x+52,y+48,57,GREEN)
    if name == 'browse':
        s.rect(x,y+8,104,78,PAPER,INK,8,2)
        s.line([(x,y+28),(x+104,y+28)],INK,2)
        s.circle(x+12,y+18,3,ORANGE)
        s.rect(x+13,y+40,31,33,'#e3c8a2',None,3)
        s.rect(x+58,y+40,31,33,'#819474',None,3)
    elif name == 'pay':
        s.rect(x-4,y+12,112,72,ORANGE,INK,9,2)
        s.line([(x-3,y+33),(x+107,y+33)],'#f1c4a6',3)
        s.rect(x+11,y+47,24,17,'#f1c4a6',None,3)
        s.circle(x+82,y+65,13,PAPER)
        s.line([(x+75,y+65),(x+80,y+70),(x+90,y+58)],ORANGE,2.5)
    elif name == 'chat':
        s.rect(x+8,y-7,87,115,INK,None,13)
        s.rect(x+13,y-1,77,103,PAPER,None,9)
        s.rect(x+23,y+18,56,29,GREEN,None,5)
        s.line([(x+31,y+28),(x+69,y+28)],MUTED,2)
        s.rect(x+31,y+57,48,26,'#e5cfb5',None,5)
        s.line([(x+40,y+68),(x+68,y+68)],MUTED,2)
    elif name == 'order':
        s.rect(x+10,y-2,85,105,PAPER,INK,7,2)
        s.rect(x+32,y-9,40,15,GREEN,INK,3,1.5)
        s.circle(x+52,y+38,22,GREEN)
        s.line([(x+40,y+38),(x+49,y+47),(x+66,y+26)],INK,3)
        s.line([(x+28,y+76),(x+77,y+76)],MUTED,3)
        s.line([(x+28,y+87),(x+64,y+87)],MUTED,3)
    elif name == 'signal':
        s.line([(x+5,y+91),(x+99,y+91)],INK,2)
        for dx,h in [(13,31),(38,65),(63,46),(88,82)]:
            s.line([(x+dx,y+82),(x+dx,y+82-h)],INK,4)
        s.circle(x+88,y,6,ORANGE)
    elif name == 'idea':
        s.circle(x+52,y+35,33,PAPER,INK,2)
        s.rect(x+39,y+63,26,17,PAPER,INK,2)
        s.line([(x+42,y+88),(x+62,y+88)],INK,3)
        s.line([(x+39,y+34),(x+49,y+45),(x+68,y+23)],ORANGE,3)
        for a,b in [((52,-13),(52,-22)),((5,35),(-5,35)),((99,35),(109,35))]:
            s.line([(x+a[0],y+a[1]),(x+b[0],y+b[1])],INK,2)
    elif name == 'growth':
        s.line([(x+5,y+92),(x+102,y+92)],INK,2)
        for dx,h in [(15,25),(43,47),(71,72)]:
            s.rect(x+dx,y+90-h,18,h,GREEN,INK,1,2)
        s.line([(x+8,y+45),(x+41,y+23),(x+58,y+31),(x+95,y-5)],ORANGE,3)
        s.line([(x+80,y-4),(x+95,y-5),(x+95,y+10)],ORANGE,3)


def base(s, label):
    s.text(64,34,'ShonkuWEB',26,bold=True)
    s.circle(226,43,4,ORANGE)
    s.text(815,38,label,15,MUTED)
    s.line([(64,80),(1216,80)],'#d7decd',1)
    s.text(64,677,'Built in India. For the world.',16,MUTED)
    s.text(843,677,'Data-driven stores & systems.',16,MUTED)
    s.line([(64,657),(1216,657)],'#d7decd',1)
    # A quiet progress line makes the short films feel intentionally paced.
    s.rect(64,649,1152,2,'#dce2d4')
    s.rect(64,649,1152*(s.time/s.duration),2,ORANGE)


def arrow(s, x1, x2, y, start, end):
    with s.group(start,end):
        s.line([(x1,y),(x2,y)],'#a6b59a',2)
        s.line([(x2-8,y-6),(x2,y),(x2-8,y+6)],ORANGE,2)
        s.moving_dot(x1,x2,y,start)


def stores(t, animated=False):
    s=Scene(t,16,animated)
    base(s,'01 / TWO WAYS TO SELL')
    modes=[(0,8,'ecommerce'),(8,16,'catalog')]
    for start,end,mode in modes:
        with s.group(start,end):
            s.text(64,112,'Beyond the DMs.',58,bold=True)
            s.text(64,184,'Your own store. An easier way to order.',26,MUTED)
            s.rect(961,113,255,44,INK,None,22)
            s.text(983,127,'ECOMMERCE STORE' if mode=='ecommerce' else 'WHATSAPP CATALOG',17,PAPER)
        items=[('browse','Browse your products.','An organised storefront.'),
               ('pay','Pay on the website.','Integrated payment gateway.') if mode=='ecommerce' else ('chat','Continue to WhatsApp.','Keep the conversation personal.'),
               ('order','Receive the order.','Website order management.') if mode=='ecommerce' else ('order','Confirm the order.','Orders stay on WhatsApp.')]
        for i,(name,title,desc) in enumerate(items):
            x=64+i*390
            with s.group(start+.45+i*.9,end):
                s.rect(x+5,258,372,267,'#dbe1cf',None,12)
                s.rect(x,251,372,267,PAPER,'#bec9b1',12)
                s.text(x+24,272,f'0{i+1}',15,MUTED)
                symbol(s,name,x+129,308)
                s.text(x+24,443,title,25,bold=True)
                s.text(x+24,483,desc,18,MUTED)
            if i<2:arrow(s,x+373,x+388,380,start+1+i*.9,end)
        with s.group(start+3.4,end):
            s.rect(64,552,1152,67,GREEN,None,10)
            s.text(89,575,'YOU MANAGE',16,MUTED)
            s.text(270,570,'Orders + inventory, in one admin panel.' if mode=='ecommerce' else 'Inventory in your admin. No website payment gateway.',25,bold=True)
    return s


def growth(t, animated=False):
    s=Scene(t,12,animated)
    base(s,'02 / FROM DATA TO DECISIONS')
    s.text(64,112,'Every visit tells a story.',54,bold=True)
    s.text(64,182,'We help you put it to work.',32,ORANGE)
    items=[('browse','Customer signal',['They revisit the','same product.']),
           ('signal','Useful insight',['Understand what','holds their interest.']),
           ('idea','Better decision',['Clarify details.','Make ordering easier.']),
           ('growth','The growth goal',['Turn more interest','into orders.'])]
    for i,(name,title,copy) in enumerate(items):
        x=64+i*292
        with s.group(.5+i*1.35,12):
            s.rect(x+4,266,274,292,'#d0dac2',None,11)
            s.rect(x,260,274,292,GREEN if i==3 else PAPER,'#bec9b1',11)
            s.text(x+20,280,f'0{i+1} / {title.upper()}',13,MUTED)
            symbol(s,name,x+84,326)
            for n,line in enumerate(copy):s.text(x+20,466+n*29,line,22,bold=n==0)
        if i<3:arrow(s,x+275,x+290,400,1.5+i*1.35,12)
    with s.group(6,12):
        s.text(64,587,'Observe. Improve. Learn again.',24,ORANGE,bold=True)
        s.text(704,592,'Illustrative workflow. Results depend on the business.',17,MUTED)
    return s


def render(name, painter, duration, title):
    OUT.mkdir(parents=True,exist_ok=True)
    (OUT/f'{name}.svg').write_text(painter(duration-.5,True).output_svg(title))
    (OUT/f'{name}-poster.svg').write_text(painter(6.5).output_svg(title))
    ffmpeg=shutil.which('ffmpeg')
    if not ffmpeg:raise SystemExit('ffmpeg is required to export MP4.')
    command=[ffmpeg,'-hide_banner','-loglevel','error','-y','-f','rawvideo','-pixel_format','rgb24','-video_size',f'{WIDTH}x{HEIGHT}','-framerate',str(FPS),'-i','-','-an','-c:v','libx264','-preset','fast','-crf','21','-pix_fmt','yuv420p','-movflags','+faststart',str(OUT/f'{name}.mp4')]
    process=subprocess.Popen(command,stdin=subprocess.PIPE)
    try:
        for frame in range(duration*FPS):
            # Hold a fully visible closing composition at the end of the MP4.
            # The editable SVG retains its fade for seamless repeated playback.
            scene=painter(min(frame/FPS, duration-.5))
            image=scene.image.resize((WIDTH,HEIGHT),Image.Resampling.LANCZOS)
            process.stdin.write(image.tobytes())
            if frame%(FPS*4)==0:print(f'{name}: {frame//FPS}/{duration}s',flush=True)
    finally:
        process.stdin.close()
    if process.wait()!=0:raise RuntimeError(f'Video render failed: {name}')
    print(f'Created {name}.mp4 and editable animated SVG.',flush=True)


if __name__=='__main__':
    render('stores-in-motion',stores,16,'ShonkuWEB: ecommerce stores and WhatsApp catalogs')
    render('data-to-growth',growth,12,'ShonkuWEB: customer signals become business decisions')
