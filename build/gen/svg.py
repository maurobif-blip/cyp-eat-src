def pat(pid, scale=None, sep=True):
    s = ' stroke="#fff" stroke-width="2.5"' if sep else ''
    tr = f' patternTransform="scale({scale})"' if scale else ''
    return (f'<pattern id="{pid}" patternUnits="userSpaceOnUse" width="48" height="72"{tr}>'
      f'<rect width="48" height="72" fill="#198A00"></rect>'
      f'<polygon points="0,-18 24,-38 48,-18 48,0 24,-20 0,0" fill="#EF7D00"{s}></polygon>'
      f'<polygon points="0,0 24,-20 48,0 48,18 24,-2 0,18" fill="#198A00"{s}></polygon>'
      f'<polygon points="0,18 24,-2 48,18 48,36 24,16 0,36" fill="#DE2010"{s}></polygon>'
      f'<polygon points="0,36 24,16 48,36 48,54 24,34 0,54" fill="#111111"{s}></polygon>'
      f'<polygon points="0,54 24,34 48,54 48,72 24,52 0,72" fill="#EF7D00"{s}></polygon>'
      f'<polygon points="0,72 24,52 48,72 48,90 24,70 0,90" fill="#198A00"{s}></polygon></pattern>')

CYP_W = ('<g stroke="#0091D5"><path d="M127,52 C110,30 95,23 80,23 C45,23 23,55 23,100 C23,145 45,177 80,177 C95,177 110,170 127,148"></path>'
  '<path d="M155,-10 L228,105 L301,-10"></path><path d="M228,105 L228,200"></path>'
  '<path d="M345,200 L345,23 L397,23 C427,23 444,40 444,66 C444,92 427,109 397,109 L345,109"></path></g>')
WORDS = {
 'EAT': '<path d="M621,23 L534,23 L534,177 L621,177"></path><path d="M534,100 L606,100"></path><path d="M650,212 L696,-4 L728,-4 L774,212"></path><path d="M676,142 L748,142"></path><path d="M803,23 L953,23"></path><path d="M878,23 L878,200"></path>',
 'FIN': '<path d="M621,23 L534,23 L534,200"></path><path d="M534,100 L606,100"></path><path d="M637,23 L787,23"></path><path d="M637,177 L787,177"></path><path d="M712,0 L712,200"></path><path d="M826,200 L826,0 L930,200 L930,0"></path>',
 'EDU': '<path d="M621,23 L534,23 L534,177 L621,177"></path><path d="M534,100 L606,100"></path><path d="M660,23 L702,23 C742,23 764,55 764,100 C764,145 742,177 702,177 L660,177 Z"></path><path d="M826,0 L826,115 C826,155 848,177 878,177 C908,177 930,155 930,115 L930,0"></path>',
}
def wordmark(word='EAT', pid='w', style='width:100%;height:auto;display:block'):
    return (f'<svg role="img" aria-label="CYP {word}" viewBox="0 0 953 200" style="{style}">'
      f'<defs>{pat(pid+"p")}<clipPath id="{pid}c"><rect width="953" height="200"></rect></clipPath></defs>'
      f'<g clip-path="url(#{pid}c)" fill="none" stroke-width="46">{CYP_W}<g stroke="url(#{pid}p)">{WORDS[word]}</g></g></svg>')

def icon(pid='i', style='width:100%;height:auto;display:block', label=True):
    lab = 'role="img" aria-label="CYP EAT icon"' if label else 'aria-hidden="true"'
    return (f'<svg {lab} viewBox="0 0 512 512" style="{style}"><defs>{pat(pid+"p", 0.85)}{pat(pid+"b", 0.8)}'
      f'<clipPath id="{pid}r"><rect width="485" height="200"></rect></clipPath></defs><rect width="512" height="512" fill="#ffffff"></rect>'
      f'<g transform="translate(88,86) scale(0.6907)"><g clip-path="url(#{pid}r)" fill="none" stroke-width="46" stroke="#0091D5">'
      '<path d="M127,52 C110,30 95,23 80,23 C45,23 23,55 23,100 C23,145 45,177 80,177 C95,177 110,170 127,148"></path>'
      '<path d="M169.5,-10 L242.5,105 L315.5,-10"></path><path d="M242.5,105 L242.5,200"></path>'
      '<path d="M363,200 L363,23 L415,23 C445,23 462,40 462,66 C462,92 445,109 415,109 L363,109"></path></g></g>'
      f'<g transform="translate(88,251) scale(0.6907)"><g clip-path="url(#{pid}r)" fill="none" stroke-width="46" stroke="url(#{pid}p)">'
      '<path d="M150,23 L23,23 L23,177 L150,177"></path><path d="M23,100 L135,100"></path>'
      '<path d="M180.5,212 L226.5,-4 L258.5,-4 L304.5,212"></path><path d="M206.5,142 L278.5,142"></path>'
      '<path d="M335,23 L485,23"></path><path d="M410,23 L410,200"></path></g></g>'
      f'<rect x="0" y="460" width="512" height="52" fill="url(#{pid}b)"></rect></svg>')

def page(title, body, w, h, script_extra='', props=None):
    import json
    p = {"$preview": {"width": w, "height": h}}
    if props: p.update(props)
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<style>
body{{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans",Arial,sans-serif;color:#14213D}}
a{{color:#0B5FA5}}a:hover{{color:#14213D}}
</style>
</helmet>
{body}
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{json.dumps(p)}'>
class Component extends DCLogic {{
{script_extra or "renderVals() { return {}; }"}
}}
</script>
</body>
</html>
'''
