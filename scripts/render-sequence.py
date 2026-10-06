"""Render AutixAI's actual 3D scene offline into scroll-scrubbed WebP frames.

Requires numpy, Pillow and moderngl. No 3D library is shipped to the website.
Run with --preview for one frame, otherwise render the complete sequence.
"""
import argparse
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.render-runtime'))
import moderngl
import numpy as np
from PIL import Image

VERTEX = '''#version 330
in vec2 position;
out vec2 uv;
void main() { uv = position; gl_Position = vec4(position, 0., 1.); }
'''
FRAGMENT = '''#version 330
in vec2 uv;
out vec4 frag;
uniform vec2 resolution;
uniform float progress;
const float PI = 3.14159265;
mat2 rot(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }
float box(vec3 p, vec3 size, float r) {
  vec3 q = abs(p) - size + r;
  return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.) - r;
}
float torus(vec3 p, float r, float tube) { return length(vec2(length(p.xz)-r,p.y))-tube; }
float capsule(vec3 p, vec3 a, vec3 b, float r) {
  vec3 v=p-a, w=b-a; return length(v-w*clamp(dot(v,w)/dot(w,w),0.,1.))-r;
}
vec2 scene(vec3 p) {
  float t = smoothstep(0.,1.,progress);
  p.xz = rot(t*1.5-.35)*p.xz;
  p.xy = rot(.14)*p.xy;
  vec3 core=p; core.xz=rot(.3)*core.xz;
  // Five rounded ceramic layers draw together into one connected core.
  float spread = mix(.44,.255,smoothstep(.08,.65,t));
  vec2 hit=vec2(100.,0.);
  for(int j=0;j<5;j++) {
    vec3 q=core-vec3(0.,float(j-2)*spread,0.);
    q.xz=rot((1.-t)*float(j-2)*.12)*q.xz;
    float d=box(q,vec3(.61,.105,.61),.085);
    if(d<hit.x) hit=vec2(d,j==2?2.:1.);
  }
  vec3 ring=p; ring.xy=rot(.65+t*.25)*ring.xy;
  float radius=mix(1.75,1.33,t);
  float d=torus(ring,radius,.029);
  if(d<hit.x)hit=vec2(d,3.);
  ring=p; ring.yz=rot(.88-t*.35)*ring.yz;
  d=torus(ring,radius+.16,.016);
  if(d<hit.x)hit=vec2(d,3.);
  float orbit=mix(2.2,1.77,t);
  for(int j=0;j<5;j++) {
    float a=float(j)*2.*PI/5.+.3;
    vec3 c=vec3(cos(a)*orbit,sin(a*2.)*.32,sin(a)*orbit);
    vec3 q=p-c; q.xz=rot(-a+.4+t*.25)*q.xz;
    q.xy=rot(.12*sin(a))*q.xy;
    d=box(q,vec3(.255,.31,.11),.065);
    if(d<hit.x)hit=vec2(d,4.);
    // Recessed olive face inside the translucent-looking champagne casing.
    d=box(q-vec3(0.,0.,.113),vec3(.185,.215,.014),.035);
    if(d<hit.x)hit=vec2(d,2.);
    if(t>.16) {
      vec3 b=normalize(c)*.75;
      vec3 end=mix(b,c*.83,smoothstep(.16,.55,t));
      d=capsule(p,b,end,.009);
      if(d<hit.x)hit=vec2(d,3.);
    }
    float a2=a+t*2.;
    vec3 particle=vec3(cos(a2)*radius,0.,sin(a2)*radius);
    particle.xy=rot(-.65-t*.25)*particle.xy;
    d=length(p-particle)-.055;
    if(d<hit.x)hit=vec2(d,5.);
  }
  return hit;
}
vec3 normalAt(vec3 p) {
  vec2 e=vec2(.0015,0.);
  return normalize(vec3(scene(p+e.xyy).x-scene(p-e.xyy).x,
    scene(p+e.yxy).x-scene(p-e.yxy).x,scene(p+e.yyx).x-scene(p-e.yyx).x));
}
float shadow(vec3 p,vec3 l) {
  float shade=1., travel=.03;
  for(int i=0;i<22;i++) {
    float d=scene(p+l*travel).x;
    shade=min(shade,10.*d/travel); travel+=clamp(d,.045,.3);
    if(travel>4.)break;
  }
  return clamp(shade,.25,1.);
}
void main() {
  vec2 xy=uv; xy.x*=resolution.x/resolution.y;
  vec3 eye=vec3(0.,2.55,7.8);
  vec3 forward=normalize(-eye);
  vec3 right=normalize(cross(forward,vec3(0.,1.,0.)));
  vec3 up=cross(right,forward);
  vec3 ray=normalize(forward*2.9+right*xy.x+up*xy.y);
  float travel=0.; vec2 hit=vec2(1.);
  for(int i=0;i<180;i++) {
    hit=scene(eye+ray*travel);
    if(hit.x<.0015 || travel>12.)break;
    travel+=hit.x*.82;
  }
  if(travel>12. || hit.x>=.0015) { frag=vec4(0.); return; }
  vec3 pos=eye+ray*travel, n=normalAt(pos), v=-ray;
  vec3 key=normalize(vec3(-3.,5.,4.));
  vec3 fill=normalize(vec3(4.,2.,1.));
  vec3 base=vec3(.34,.39,.19);
  float gloss=70., metal=.28;
  if(hit.y==2.) {base=vec3(.20,.26,.095);gloss=100.;metal=.32;}
  if(hit.y==3.) {base=vec3(.68,.52,.32);gloss=115.;metal=.85;}
  if(hit.y==4.) {base=vec3(.79,.73,.59);gloss=130.;metal=.52;}
  if(hit.y==5.) {base=vec3(.93,.83,.61);gloss=85.;metal=.65;}
  float ao=1.;
  for(int j=1;j<4;j++) {float h=float(j)*.12;ao-=(h-scene(pos+n*h).x)*(.30/float(j));}
  float diffuse=max(dot(n,key),0.)*shadow(pos+n*.012,key);
  float spec=pow(max(dot(n,normalize(key+v)),0.),gloss);
  float fillSpec=pow(max(dot(n,normalize(fill+v)),0.),gloss*.3);
  float fresnel=pow(1.-max(dot(n,v),0.),4.);
  // Broad studio reflection bands give polished material depth.
  vec3 refl=reflect(-v,n);
  float softbox=exp(-pow((refl.x+.4)*3.,2.)-pow((refl.y-.6)*2.,2.));
  vec3 color=base*(.29*ao+diffuse*.8+max(dot(n,fill),0.)*.22);
  color+=vec3(1.,.94,.79)*(spec*.8+fillSpec*.25+softbox*metal*.58);
  color+=vec3(.76,.74,.54)*fresnel*.42;
  color=pow(max(color,0.),vec3(.8));
  frag=vec4(color,1.);
}
'''

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--preview', action='store_true')
    args = parser.parse_args()
    ctx = moderngl.create_standalone_context()
    width, height, count = 1440, 1200, 120
    program = ctx.program(vertex_shader=VERTEX, fragment_shader=FRAGMENT)
    quad = np.array([-1,-1, 3,-1, -1,3], dtype='f4')
    vao = ctx.simple_vertex_array(program, ctx.buffer(quad), 'position')
    framebuffer = ctx.simple_framebuffer((width,height), components=4)
    framebuffer.use()
    program['resolution'].value = (width,height)
    output = ROOT / 'dist' / 'assets' / 'automation-core'
    for folder in ['desktop','mobile']:
        (output/folder).mkdir(parents=True, exist_ok=True)
    indices = [70] if args.preview else range(count)
    for index in indices:
        program['progress'].value = index/(count-1)
        framebuffer.clear(0,0,0,0)
        vao.render()
        frame = Image.frombytes('RGBA',(width,height),framebuffer.read(components=4)).transpose(Image.Transpose.FLIP_TOP_BOTTOM)
        frame.save(output/'desktop'/f'{index:03d}.webp', quality=84, method=5)
        frame.resize((720,600),Image.Resampling.LANCZOS).save(output/'mobile'/f'{index:03d}.webp',quality=80,method=5)
        if index%15==0 or args.preview: print(f'Rendered {index+1}/{count}',flush=True)
    if not args.preview:
        manifest={'frames':count,'desktop':{'width':width,'height':height},'mobile':{'width':720,'height':600},'format':'webp'}
        (output/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
        print(f'Complete: {sum(p.stat().st_size for p in output.rglob("*.webp"))/1024/1024:.2f} MB',flush=True)

if __name__=='__main__': main()
