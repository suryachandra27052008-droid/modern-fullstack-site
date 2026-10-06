'use strict';
// Offline-rendered 3D frames. Only 2D canvas compositing runs on visitors' devices.
(() => {
  const section = document.getElementById('connected-business');
  const canvas = document.getElementById('automation-sequence');
  const context = canvas.getContext('2d', {alpha:true});
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 800px)');
  const chapters = [...section.querySelectorAll('[data-chapter]')];
  const controls = [...section.querySelectorAll('[data-sequence-chapter]')];
  const count = 120;
  const clamp = (n, min, max) => Math.max(min, Math.min(max,n));
  let currentChapter = -1;
  let generation = 0;
  let cleanup = () => {};

  function setChapter(index) {
    if (index === currentChapter) return;
    currentChapter = index;
    chapters.forEach((chapter,i) => {chapter.hidden=i!==index;chapter.classList.toggle('is-current',i===index);});
    controls.forEach((control,i) => {control.classList.toggle('is-current',i===index);control.setAttribute('aria-pressed',String(i===index));});
  }

  function configure() {
    cleanup();
    const run = ++generation;
    section.classList.remove('sequence-ready','sequence-active','sequence-enhanced');
    canvas.removeAttribute('data-frame');
    const lowData = navigator.connection?.saveData;
    const small = mobile.matches || lowData;
    const folder = small ? 'mobile' : 'desktop';
    const width = small ? 720 : 1440, height = small ? 600 : 1200;
    canvas.width=width;canvas.height=height;
    if (!context || reduced.matches || !('IntersectionObserver' in window) || !('ResizeObserver' in window)) {
      section.classList.add('sequence-static');
      setChapter(0);
      cleanup=()=>{};
      return;
    }
    section.classList.remove('sequence-static');
    section.classList.add('sequence-enhanced');
    // Compressed frames are prefetched; decoded images use a bounded LRU cache.
    const blobs = new Map(), decoded = new Map(), pending = new Set(), jobs = [];
    const controller = new AbortController();
    const limit = small ? 12 : 16;
    let fetches=0, decodes=0, frame=0, visible=false, started=false;
    let target=0, smooth=0, drawn=-1, lastTime=0, start=0, span=1;
    const stride=lowData ? 4 : 1;
    const snap = index => clamp(Math.round(index/stride)*stride,0,count-1);
    const path = index => `assets/automation-core/${folder}/${String(index).padStart(3,'0')}.webp`;

    function requestTick() { if (!frame && visible && !document.hidden) frame=requestAnimationFrame(tick); }
    function preload(index, priority=false) {
      index=snap(index);
      if (blobs.has(index)) return;
      if (pending.has(index)) {
        if(priority){const queued=jobs.indexOf(index);if(queued>0){jobs.splice(queued,1);jobs.unshift(index);}}
        return;
      }
      pending.add(index);
      if(priority) jobs.unshift(index); else jobs.push(index);
      pump();
    }
    function pump() {
      while(fetches<4 && jobs.length) {
        const index=jobs.shift();fetches++;
        fetch(path(index),{signal:controller.signal,cache:'force-cache'})
          .then(response=>{if(!response.ok)throw new Error('Frame unavailable');return response.blob();})
          .then(blob=>{if(run===generation){blobs.set(index,blob);requestTick();}})
          .catch(()=>{})
          .finally(()=>{pending.delete(index);fetches--;if(run===generation)pump();});
      }
    }
    async function decode(index) {
      if(decoded.has(index) || pending.has(`decode-${index}`) || !blobs.has(index) || decodes>=2) return;
      pending.add(`decode-${index}`);decodes++;
      let bitmap;
      try {
        if(typeof createImageBitmap==='function') bitmap=await createImageBitmap(blobs.get(index));
        else {
          const url=URL.createObjectURL(blobs.get(index));
          try { bitmap=new Image();bitmap.src=url;await bitmap.decode(); } finally {URL.revokeObjectURL(url);}
        }
        if(run!==generation){bitmap.close?.();return;}
        decoded.set(index,bitmap);
        while(decoded.size>limit){const old=decoded.keys().next().value;decoded.get(old).close?.();decoded.delete(old);}
        requestTick();
      } catch { /* The poster remains available if image decoding fails. */ }
      finally {pending.delete(`decode-${index}`);decodes--;}
    }
    function measure() {
      start=section.getBoundingClientRect().top+scrollY-parseFloat(getComputedStyle(section).getPropertyValue('--sequence-top'));
      span=Math.max(1,section.offsetHeight-section.querySelector('.sequence-sticky').offsetHeight);
      onScroll();
    }
    function onScroll() {
      target=clamp((scrollY-start)/span,0,1)*(count-1);
      if(visible) requestTick();
    }
    function tick(time) {
      frame=0;
      if(!visible || document.hidden) {lastTime=0;return;}
      const delta=lastTime ? Math.min(50,time-lastTime) : 16.7;
      lastTime=time;
      smooth+=(target-smooth)*(1-Math.exp(-delta/65));
      if(Math.abs(target-smooth)<.07)smooth=target;
      const index=snap(Math.round(smooth));
      const destination=snap(Math.round(target));
      [index,destination,index-stride,index+stride].forEach(i=>{i=clamp(i,0,count-1);preload(i,true);decode(snap(i));});
      let nearest=index;
      if(!decoded.has(index)) {
        let distance=count;
        decoded.forEach((_,i)=>{if(Math.abs(i-index)<distance){distance=Math.abs(i-index);nearest=i;}});
      }
      if(decoded.has(nearest) && drawn!==nearest) {
        const bitmap=decoded.get(nearest);decoded.delete(nearest);decoded.set(nearest,bitmap);
        context.clearRect(0,0,width,height);context.drawImage(bitmap,0,0,width,height);
        drawn=nearest;canvas.dataset.frame=String(nearest);section.classList.add('sequence-ready');
      }
      const progress=smooth/(count-1);
      section.style.setProperty('--sequence-progress',progress.toFixed(4));
      setChapter(progress<.32?0:progress<.69?1:2);
      if(Math.abs(target-smooth)>.07)requestTick();
    }
    function onVisibility() {if(document.hidden){cancelAnimationFrame(frame);frame=0;lastTime=0;}else{onScroll();requestTick();}}
    const warmup = new IntersectionObserver(entries=>{
      if(!entries[0].isIntersecting || started)return;
      started=true;
      // Spread keyframes first so a fast scroll still has a nearby image.
      [0,30,60,90,119].forEach(i=>preload(i));
      for(let i=0;i<count;i+=stride)preload(i);
      warmup.disconnect();
    },{rootMargin:'1000px 0px'});
    const observer = new IntersectionObserver(entries=>{
      visible=entries[0].isIntersecting;
      section.classList.toggle('sequence-active',visible);
      if(visible){measure();requestTick();}else{cancelAnimationFrame(frame);frame=0;lastTime=0;}
    });
    const resize = new ResizeObserver(measure);
    warmup.observe(section);observer.observe(section);resize.observe(section);
    window.addEventListener('scroll',onScroll,{passive:true});
    window.addEventListener('resize',measure,{passive:true});
    document.addEventListener('visibilitychange',onVisibility);
    measure();
    cleanup=()=>{
      controller.abort();warmup.disconnect();observer.disconnect();resize.disconnect();cancelAnimationFrame(frame);
      window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',measure);document.removeEventListener('visibilitychange',onVisibility);
      decoded.forEach(bitmap=>bitmap.close?.());decoded.clear();blobs.clear();
    };
  }

  controls.forEach((button,index)=>button.addEventListener('click',()=>{
    if(reduced.matches || section.classList.contains('sequence-static')){setChapter(index);return;}
    const top=section.getBoundingClientRect().top+scrollY-parseFloat(getComputedStyle(section).getPropertyValue('--sequence-top'));
    const span=section.offsetHeight-section.querySelector('.sequence-sticky').offsetHeight;
    window.scrollTo({top:top+span*[0,.5,1][index],behavior:'smooth'});
  }));
  reduced.addEventListener('change',configure);mobile.addEventListener('change',configure);
  configure();
})();

// Decorative motion only runs when its section is on screen.
if('IntersectionObserver' in window) {
  const motion = new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('motion-visible',entry.isIntersecting)),{rootMargin:'60px'});
  document.querySelectorAll('.hero-visual,.portfolio-section,.contact-section').forEach(section=>motion.observe(section));
}
