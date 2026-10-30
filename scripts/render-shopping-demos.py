"""Render two fictional customer journeys for the inline service demos.

The UI is original vector artwork, not a recording of a client website.
Requires the same Pillow / ffmpeg tools as render-motion.py.
"""
from pathlib import Path
import importlib.util
import math
import shutil
import subprocess
import sys

sys.dont_write_bytecode = True

spec = importlib.util.spec_from_file_location('motion', Path(__file__).with_name('render-motion.py'))
motion = importlib.util.module_from_spec(spec)
spec.loader.exec_module(motion)
Scene, OUT = motion.Scene, motion.OUT
PAPER, INK, ORANGE, GREEN, MUTED = motion.PAPER, motion.INK, motion.ORANGE, motion.GREEN, motion.MUTED


def polygon(s, points, fill, stroke=None, width=2):
    if s.alpha:
        s.draw.polygon([(round(x*motion.SCALE),round(y*motion.SCALE)) for x,y in points], fill=s.colour(fill))
        if stroke:s.line(points+[points[0]],stroke,width)
    s.svg.append(f'<polygon points="{" ".join(f"{x},{y}" for x,y in points)}" fill="{fill}" stroke="{stroke or "none"}" stroke-width="{width}"/>')


def cursor(s, x, y, click=False):
    if click:
        s.circle(x,y,21,None,ORANGE,2)
        s.circle(x,y,30,None,'#e6a78f',1)
    polygon(s,[(x,y),(x+9,y+32),(x+16,y+23),(x+27,y+22)],INK,PAPER,2)


def ease(a,b,p):
    p=max(0,min(1,p));return a+(b-a)*(p*p*(3-2*p))


def pointer(s,t,start,end,fromxy,toxy):
    p=(t-start)/(end-start)
    cursor(s,ease(fromxy[0],toxy[0],p),ease(fromxy[1],toxy[1],p),end-.25<t<end+.25)


def bag(s,cx,cy,scale=1):
    k=scale
    s.circle(cx,cy-56*k,40*k,None,'#8c6e4c',5*k)
    s.rect(cx-72*k,cy-57*k,144*k,153*k,'#cba477','#886c4b',7*k,2*k)
    s.line([(cx-56*k,cy-40*k),(cx-56*k,cy+75*k)],'#e4c69e',2*k)
    s.line([(cx+56*k,cy-40*k),(cx+56*k,cy+75*k)],'#e4c69e',2*k)
    s.rect(cx-34*k,cy+4*k,68*k,35*k,'#eddbbf',None,2*k)
    s.text(cx-25*k,cy+16*k,'everyday.',11*k,'#806447')


def tee(s,cx,cy,scale=1):
    k=scale
    points=[(-35,-75),(-80,-48),(-59,-5),(-34,-17),(-40,85),(40,85),(34,-17),(59,-5),(80,-48),(35,-75),(20,-82),(-20,-82)]
    polygon(s,[(cx+x*k,cy+y*k)for x,y in points],'#82947a','#4f6649',2*k)
    s.line([(cx-20*k,cy-80*k),(cx-15*k,cy-64*k),(cx+15*k,cy-64*k),(cx+20*k,cy-80*k)],'#e6ebde',5*k)
    s.rect(cx+7*k,cy-31*k,24*k,29*k,'#92a088',None,2*k)


def shell(s, catalog=False, whatsapp=False, bag_count=0):
    s.rect(0,0,1280,720,'#e9eddf')
    s.rect(38,30,1210,660,'#d5ddc9',None,13)
    s.rect(30,22,1210,660,'#fffdf8','#c0c9b3',13,1.5)
    s.rect(31,23,1208,35,'#efefe6',None,12)
    s.rect(31,43,1208,16,'#efefe6')
    for i,col in enumerate(['#d37b65','#d7ba7a','#9bb184']):s.circle(49+i*15,40,4,col)
    s.text(494,33,'web.whatsapp.com / demo' if whatsapp else 'yourbrand.store / demo',13,MUTED)
    s.text(1068,34,'ILLUSTRATIVE DEMO',10,MUTED)
    if whatsapp:return
    s.text(75,83,'the everyday.',30,INK)
    s.text(511,93,'Shop',15,INK,True)
    s.text(589,93,'Our story',15,MUTED)
    s.text(712,93,'Contact',15,MUTED)
    s.text(1057,94,'CATALOG' if catalog else f'BAG  ({bag_count})',13,INK,True)
    s.line([(75,136),(1195,136)],'#e1e4d9',1)


def button(s,x,y,w,text,colour=INK):
    s.rect(x,y,w,54,colour,None,5)
    s.text(x+22,y+18,text,18,PAPER,True)
    s.text(x+w-37,y+15,'→',24,PAPER)


def browse(s,catalog):
    shell(s,catalog)
    s.text(75,167,'Little things. Everyday favourites.',35,INK,True)
    s.text(75,214,'Made to be part of your day.',17,MUTED)
    for i,name in enumerate(['Everyday tote','Weekend tee','Mini everyday tote']):
        x=75+i*380
        s.rect(x,263,354,280,['#eee3d2','#e2e9da','#ecdfd5'][i],None,6)
        if i==1:tee(s,x+177,395,1.15)
        else:bag(s,x+177,390,.95 if i==0 else .77)
        s.text(x,564,name,23,INK,True)
        s.text(x,601,['Rs. 1,290','Rs. 890','Rs. 990'][i],18,MUTED)
        s.text(x+260,605,'View →',16,INK)


def detail(s,catalog,t):
    shell(s,catalog)
    s.text(75,157,'Shop / Everyday tote',14,MUTED)
    s.rect(75,193,510,423,'#eee3d2',None,6)
    bag(s,330,391,1.5)
    s.text(658,191,'THE EVERYDAY COLLECTION',12,MUTED)
    s.text(658,225,'Everyday tote',43,INK,True)
    s.text(658,287,'Rs. 1,290',26)
    s.text(658,335,'Room for the things you take everywhere.',18,MUTED)
    s.text(658,379,'Colour: Sand',16,INK,True)
    for i,col in enumerate(['#cba477','#82947a','#494f45']):
        s.circle(675+i*47,425,15,col)
        if i==0:s.circle(675,425,21,None,INK,1.5)
    s.text(658,472,'Quantity',15,MUTED)
    s.rect(751,457,116,40,PAPER,'#c5cdbb',4)
    s.text(769,468,'−     1     +',18)
    button(s,658,529,478,'Enquire on WhatsApp' if catalog else 'Add to bag')


def cart(s):
    shell(s,bag_count=1)
    s.text(75,167,'Your bag',38,INK,True)
    s.text(75,217,'One good choice.',17,MUTED)
    s.rect(75,270,710,274,'#f5f3ec',None,6)
    s.rect(97,292,183,223,'#eee3d2',None,5)
    bag(s,187,389,.8)
    s.text(317,305,'Everyday tote',28,INK,True)
    s.text(317,353,'Sand / Quantity: 1',18,MUTED)
    s.text(317,400,'Rs. 1,290',23)
    s.text(317,479,'Remove',14,MUTED)
    s.rect(839,270,356,274,'#edf0e4',None,6)
    s.text(864,299,'Order summary',24,INK,True)
    s.text(864,353,'Subtotal',17,MUTED)
    s.text(1056,353,'Rs. 1,290',17)
    s.line([(864,391),(1169,391)],'#c8d1bc',1)
    s.text(864,419,'Total',19,INK,True)
    s.text(1050,419,'Rs. 1,290',19,INK,True)
    button(s,839,573,356,'Continue to checkout')


def checkout(s,t):
    shell(s,bag_count=1)
    s.text(75,166,'Checkout',38,INK,True)
    s.text(75,219,'Contact & delivery',22,INK,True)
    fields=[(75,263,326,'Name','Alex'),(423,263,362,'Email','alex@example.com'),(75,366,710,'Delivery address','Demo delivery address')]
    for x,y,w,label,value in fields:
        s.text(x,y,label,14,MUTED)
        s.rect(x,y+25,w,53,PAPER,'#c8cebf',4)
        # The cursor fills the sample form; all contact data is fictional.
        count=int(max(0,min(1,(t-9.1)/.8))*len(value))
        s.text(x+14,y+43,value[:count],18)
    s.text(75,488,'Payment',22,INK,True)
    s.rect(75,531,710,70,'#edf0e4','#bac8aa',5)
    s.circle(102,565,8,INK)
    s.text(125,555,'Demo payment method',19,INK,True)
    s.rect(840,221,355,247,'#edf0e4',None,6)
    s.text(866,250,'Your order',24,INK,True)
    s.text(866,310,'Everyday tote × 1',18)
    s.text(866,351,'Sand',16,MUTED)
    s.line([(866,389),(1168,389)],'#c5ceb9',1)
    s.text(866,418,'Total   Rs. 1,290',23,INK,True)
    button(s,840,506,355,'Pay & place order')


def success(s):
    shell(s)
    s.circle(635,282,64,GREEN)
    s.line([(604,282),(625,303),(669,256)],INK,5)
    s.text(438,385,'Your order is placed.',38,INK,True)
    s.text(489,449,'Thanks for shopping with us.',20,MUTED)
    s.text(546,492,'Order #DEMO-001',17,MUTED)
    button(s,485,555,300,'Continue shopping')


def whatsapp(s,t):
    shell(s,True,True)
    s.rect(31,60,1208,621,'#e6e9dd')
    s.rect(31,60,1208,83,'#f4f5ef')
    s.circle(89,101,24,GREEN)
    s.text(78,89,'e.',25,INK,True)
    s.text(132,83,'the everyday.',24,INK,True)
    s.text(133,117,'Business account · demo',13,MUTED)
    s.rect(31,600,1208,81,'#f0f2e9')
    message="Hi! I'd like to order 1 Everyday tote in Sand."
    if t<11.2:
        s.rect(67,615,1067,51,PAPER,None,24)
        count=int(max(0,min(1,(t-7.4)/1.5))*len(message))
        s.text(90,633,message[:count],20)
    else:
        s.rect(632,198,553,156,'#d9e8bb',None,9)
        s.text(660,220,"Hi! I'd like to order 1 Everyday tote",23)
        s.text(660,260,'in Sand.',23)
        s.text(1066,320,'12:00  ✓✓',13,MUTED)
        s.rect(67,615,1067,51,PAPER,None,24)
        s.text(90,633,'Type a message',18,MUTED)
    s.circle(1175,641,25,'#476b43')
    polygon(s,[(1166,630),(1188,641),(1166,652),(1171,641)],PAPER)


def ecommerce(t,animated=False):
    s=Scene(t,16,animated)
    if t<3:
        browse(s,False);pointer(s,t,.5,2.8,(1115,610),(258,401))
    elif t<6:
        detail(s,False,t);pointer(s,t,3.3,5.7,(258,401),(926,555))
    elif t<8.6:
        cart(s);pointer(s,t,6.2,8.3,(926,555),(1015,596))
    elif t<12:
        checkout(s,t);pointer(s,t,10,11.8,(346,399),(1010,530))
    else:
        success(s);cursor(s,1080,593)
    return s


def catalog(t,animated=False):
    s=Scene(t,15,animated)
    if t<3:
        browse(s,True);pointer(s,t,.5,2.8,(1115,610),(258,401))
    elif t<7:
        detail(s,True,t);pointer(s,t,4,6.8,(258,401),(926,555))
    else:
        whatsapp(s,t);pointer(s,t,9.4,11.2,(720,642),(1175,641))
    return s


def render(name,painter,duration):
    OUT.mkdir(exist_ok=True)
    (OUT/f'{name}-poster.svg').write_text(painter(.3).output_svg('Illustrative customer journey'))
    command=[shutil.which('ffmpeg'),'-hide_banner','-loglevel','error','-y','-f','rawvideo','-pixel_format','rgb24','-video_size','1280x720','-framerate','24','-i','-','-an','-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',str(OUT/f'{name}.mp4')]
    p=subprocess.Popen(command,stdin=subprocess.PIPE)
    try:
        for frame in range(duration*24):
            image=painter(frame/24).image.resize((1280,720),motion.Image.Resampling.LANCZOS)
            p.stdin.write(image.tobytes())
            if frame%96==0:print(f'{name}: {frame//24}/{duration}s',flush=True)
    finally:p.stdin.close()
    if p.wait():raise RuntimeError('Video export failed')
    print(f'Finished {name}',flush=True)


if __name__=='__main__':
    render('ecommerce-shopping-demo',ecommerce,16)
    render('catalog-shopping-demo',catalog,15)
