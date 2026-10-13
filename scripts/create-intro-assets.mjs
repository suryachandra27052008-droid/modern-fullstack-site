import {readFile,writeFile} from 'node:fs/promises';
const base = new URL('../dist/branding/', import.meta.url);
const jpeg = (await readFile(new URL('autixai-logo-20261011.jpg',base))).toString('base64');
const defs = `<defs><filter id="matte" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  -1.5 -1.5 -1.5 0 4.38"/></filter><mask id="art" maskUnits="userSpaceOnUse" x="0" y="0" width="564" height="610"><image href="data:image/jpeg;base64,${jpeg}" width="564" height="610" filter="url(#matte)"/></mask></defs>`;
// Same source pixels, matte and continuous beige ring used by the supplied film.
// External images decode once instead of filtering live SVGs during travel.
await writeFile(new URL('autixai-intro-symbol-20261013.svg',base),`<svg xmlns="http://www.w3.org/2000/svg" width="236" height="156" viewBox="158 171 236 156">${defs}<defs><clipPath id="olive"><circle cx="236" cy="249.5" r="76.5"/></clipPath></defs><g clip-path="url(#olive)"><rect width="564" height="610" mask="url(#art)" fill="#5f6b39"/></g><circle cx="316" cy="249.5" r="72.5" fill="none" stroke="#c9bea0" stroke-width="8"/></svg>`);
await writeFile(new URL('autixai-intro-wordmark-20261013.svg',base),`<svg xmlns="http://www.w3.org/2000/svg" width="268" height="66" viewBox="139 449 268 66">${defs}<rect width="564" height="610" mask="url(#art)" fill="#45512f"/></svg>`);
console.log('Prepared two exact-artwork intro images.');
