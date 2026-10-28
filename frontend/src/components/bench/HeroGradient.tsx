import { useEffect, useRef } from "react";

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
// Flowing mesh-gradient (Stripe-like) in obsidian / violet / emerald
const FRAG = `precision highp float;
uniform vec2 r;uniform float t;
vec3 hash3(vec2 p){return fract(sin(vec3(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)),dot(p,vec2(419.2,371.9))))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
float a=hash3(i).x,b=hash3(i+vec2(1,0)).x,c=hash3(i+vec2(0,1)).x,d=hash3(i+vec2(1,1)).x;
return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p*=2.02;a*=.5;}return v;}
void main(){
 vec2 uv=gl_FragCoord.xy/r;vec2 p=uv*vec2(r.x/r.y,1.)*1.6;
 float s=t*.06;
 vec2 q=vec2(fbm(p+s),fbm(p+vec2(5.2,1.3)-s));
 vec2 w=vec2(fbm(p+3.*q+vec2(1.7,9.2)+s*1.5),fbm(p+3.*q+vec2(8.3,2.8)-s));
 float f=fbm(p+3.*w);
 vec3 bg=vec3(.039);
 vec3 violet=vec3(.541,.169,.886);
 vec3 lav=vec3(.71,.54,1.);
 vec3 em=vec3(.28,.85,.69);
 vec3 col=mix(bg,violet,smoothstep(.35,.85,f));
 col=mix(col,lav,smoothstep(.7,1.,f*length(w))*.8);
 col=mix(col,em,smoothstep(.75,1.,q.y*f)*.35);
 // ribbon highlight lines
 float line=abs(sin((f*10.+t*.3)))*.0+smoothstep(.02,.0,abs(fract(f*6.-t*.05)-.5)-.47);
 col+=lav*line*.25*f;
 // fade to black on the left for text legibility
 col*=smoothstep(.0,.75,uv.x)*.9+.1;
 gl_FragColor=vec4(col,1.);
}`;

export function HeroGradient({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const gl = c?.getContext("webgl", { antialias: false, alpha: false });
    if (!c || !gl) return;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uR = gl.getUniformLocation(prog, "r"), uT = gl.getUniformLocation(prog, "t");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const t0 = performance.now();
    const frame = () => {
      const dpr = Math.min(window.devicePixelRatio, 1.5) * 0.6; // render at lower res, it's a soft gradient
      const w = Math.floor(c.clientWidth * dpr), h = Math.floor(c.clientHeight * dpr);
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; gl.viewport(0, 0, w, h); }
      gl.uniform2f(uR, w, h);
      gl.uniform1f(uT, (performance.now() - t0) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!reduce) raf = requestAnimationFrame(frame);
    };
    frame();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} aria-hidden className={className} />;
}
