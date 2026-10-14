import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const input=process.argv[2];
if(!input) throw new Error('Usage: node scripts/encode-intro.mjs <original 60 fps video>');
function probe(path){
  const result=spawnSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',path],{encoding:'utf8'});
  if(result.status!==0)throw new Error(result.stderr||'ffprobe failed');
  return JSON.parse(result.stdout);
}
const original=probe(resolve(input));
const video=original.streams.find(stream=>stream.codec_type==='video');
if(video?.avg_frame_rate!=='60/1')throw new Error('Use the native 60 fps original; do not duplicate frames from a 30 fps copy.');
const output=fileURLToPath(new URL('../dist/media/',import.meta.url));
for(const [name,width,height,level,crf,maxrate] of [
  ['desktop',1280,720,'3.2','20','3000k'],
  ['mobile',960,540,'3.2','21','1800k']
]){
  const path=resolve(output,`autixai-intro-${name}-60fps-20261014.mp4`);
  const args=['-y','-hide_banner','-loglevel','warning','-i',resolve(input),'-map','0:v:0','-an',
    '-vf',`scale=${width}:${height}:flags=lanczos:in_range=full:out_range=limited:in_color_matrix=bt601:out_color_matrix=bt709,fps=60,format=yuv420p`,
    '-c:v','libx264','-preset','medium','-crf',crf,'-profile:v','baseline','-level:v',level,
    '-refs','1','-bf','0','-g','60','-keyint_min','60','-sc_threshold','0',
    '-maxrate',maxrate,'-bufsize',name==='mobile'?'4800k':'10000k',
    '-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709',
    '-tag:v','avc1','-movflags','+faststart',path];
  const result=spawnSync('ffmpeg',args,{stdio:'inherit'});
  if(result.status!==0)throw new Error(`Encoding failed: ${name}`);
  const encoded=probe(path),stream=encoded.streams.find(s=>s.codec_type==='video');
  if(stream.avg_frame_rate!=='60/1'||stream.nb_frames!==video.nb_frames||stream.pix_fmt!=='yuv420p'||encoded.streams.some(s=>s.codec_type==='audio')){
    throw new Error(`Unexpected frame count, pixel format or audio stream: ${name}`);
  }
  console.log(JSON.stringify({name,path,width:stream.width,height:stream.height,fps:stream.avg_frame_rate,frames:stream.nb_frames,bytes:Number(encoded.format.size),duration:encoded.format.duration}));
}
