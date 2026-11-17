"""Split brandpack2026.svg into standalone component SVGs.

Pass 1 (this script, mode=write): extract groups, inline CSS classes as
presentation attributes, prefix gradient ids, write files with the full
artboard viewBox.  Pass 2 (mode=crop): read bboxes.json (from Chrome) and
set tight viewBoxes.
"""
import sys, re, os, json, copy, base64
import xml.etree.ElementTree as ET

SRC, OUT, MODE = sys.argv[1], sys.argv[2], sys.argv[3]
SVG = 'http://www.w3.org/2000/svg'
XL = 'http://www.w3.org/1999/xlink'
ET.register_namespace('', SVG)
ET.register_namespace('xlink', XL)
q = lambda t: '{%s}%s' % (SVG, t)

COMPONENTS = {
    'logo/bintang-wordmark':                  ['2/1'],
    'tiger/head':                             ['3/2'],
    'tiger/full-body':                        ['3/0'],
    'tiger/stamp':                            ['3/1'],
    'tiger/stamp-head':                       ['3/1/0'],
    'tiger/stamp-ring':                       ['3/1/1'],
    'frames/photo-frame/photo-frame-complete': ['1/1', '1/2', '1/3', '1/12'],
    'frames/photo-frame/photo-frame-empty':   ['1/1', '1/2', '1/3'],
    'frames/photo-frame/ornament':            ['1/1'],
    'frames/photo-frame/oval-gold-rim':        ['1/2'],
    'frames/photo-frame/oval-fill':           ['1/3'],
    'frames/photo-frame/plate-photo':         ['1/12'],
    'frames/badge/badge-complete':            ['1/4', '1/5', '1/6', '1/7', '1/8', '1/9', '1/10', '1/11'],
    'frames/badge/badge-blank':               ['1/4', '1/5', '1/6'],
    'frames/badge/badge-shape':               ['1/4/0', '1/4/1'],
    'frames/badge/star-medallion':            ['1/4/3', '1/5'],
    'frames/badge/bintang-brunch-lettering':  ['1/7', '1/8'],
}

if MODE == 'crop':
    boxes = json.load(open(os.path.join(OUT, 'bboxes.json')))
    PAD = 2
    for name, b in boxes.items():
        p = os.path.join(OUT, name + '.svg')
        s = open(p).read()
        x, y, w, h = b['x'] - PAD, b['y'] - PAD, b['w'] + 2 * PAD, b['h'] + 2 * PAD
        vb = 'viewBox="%.2f %.2f %.2f %.2f" width="%.2f" height="%.2f"' % (x, y, w, h, w, h)
        s = re.sub(r'viewBox="[^"]*"', vb, s, count=1)
        open(p, 'w').write(s)
    sys.exit()

tree = ET.parse(SRC)
root = tree.getroot()
defs = root.find(q('defs'))

# --- parse the stylesheet into class -> ordered declarations
css = defs.find(q('style')).text
rules = []
for sel, body in re.findall(r'([^{}]+)\{([^}]*)\}', css):
    decls = [tuple(x.strip() for x in d.split(':', 1)) for d in body.split(';') if ':' in d]
    for c in re.findall(r'\.([\w-]+)', sel):
        rules.append((c, decls))

def inline(el):
    for e in el.iter():
        cls = e.attrib.pop('class', None)
        if not cls:
            continue
        classes = cls.split()
        for c, decls in rules:          # source order = cascade order
            if c in classes:
                for k, v in decls:
                    e.set(k, v)

gradients = {g.get('id'): g for g in defs if g.tag != q('style')}

def node(path):
    el = root
    for i in path.split('/'):
        el = list(el)[int(i)]
    return el

os.makedirs(OUT, exist_ok=True)
W, H = root.get('viewBox').split()[2:]
for name, paths in COMPONENTS.items():
    slug = name.split('/')[-1]
    body = [copy.deepcopy(node(p)) for p in paths]
    for b in body:
        inline(b)
    # collect referenced gradients (+ their xlink:href parents)
    xml = ''.join(ET.tostring(b, encoding='unicode') for b in body)
    need, todo = [], re.findall(r'url\(#([\w-]+)\)', xml)
    while todo:
        gid = todo.pop()
        if gid in need: continue
        need.append(gid)
        href = gradients[gid].get('{%s}href' % XL)
        if href: todo.append(href[1:])
    svg = ET.Element(q('svg'), {'viewBox': '0 0 %s %s' % (W, H)})
    if '<text' in xml or ':text' in xml:
        st = ET.SubElement(svg, q('style'))
        st.text = '@import url("https://use.typekit.net/pev2vne.css");'
    if need:
        d = ET.SubElement(svg, q('defs'))
        for gid in [g for g in gradients if g in need]:   # keep original order
            g = copy.deepcopy(gradients[gid]); g.set('id', slug + '-' + gid)
            h = g.get('{%s}href' % XL)
            if h: g.set('{%s}href' % XL, '#' + slug + '-' + h[1:])
            d.append(g)
    for b in body:
        for e in b.iter():
            for k, v in list(e.attrib.items()):
                if 'url(#' in v:
                    e.set(k, re.sub(r'url\(#([\w-]+)\)', lambda m: 'url(#%s-%s)' % (slug, m.group(1)), v))
            if e.get('id') and e.tag != q('image'):
                e.attrib.pop('id')
            e.attrib.pop('data-name', None)
        g = ET.SubElement(svg, q('g'), {'id': slug})
        g.append(b)
    p = os.path.join(OUT, name + '.svg')
    os.makedirs(os.path.dirname(p), exist_ok=True)
    ET.ElementTree(svg).write(p, encoding='unicode', xml_declaration=False)
    with open(p) as f: s = f.read()
    with open(p, 'w') as f: f.write('<?xml version="1.0" encoding="UTF-8"?>\n' + s + '\n')

# raw photo, unrotated, as a standalone PNG
img = node('1/12/1')
data = img.get('{%s}href' % XL).split('base64,', 1)[1]
open(os.path.join(OUT, 'frames/photo-frame/plate-photo-source.png'), 'wb').write(base64.b64decode(data))
json.dump(list(COMPONENTS), open(os.path.join(OUT, 'names.json'), 'w'))
print('wrote', len(COMPONENTS), 'components')
