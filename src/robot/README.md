# AutixAI Companion 02

Imported from the owner's `rewire-robot/src/robot` design on 24 October 2026.
The authored model, motion and markup are preserved. The controller accepts two
additional callbacks so the website's Pause decorative motion setting and logo
intro cover can pause the robot. The original prototype is unchanged.

`dist/robot/companion.js` is the compiled, self-contained ES module. It bundles
Three.js 0.186.1 and RoomEnvironment using esbuild 0.28.2 from the prototype's
existing development tools. There are no remote assets, React runtime, Spline
runtime, analytics or API calls. The MIT licence is shipped beside the bundle.
Normal site builds use this checked-in bundle and need no new dependencies.

To regenerate after editing these sources, use esbuild's `build()` API with
`entryPoints: ['src/robot/companion.js']`, `outfile: 'dist/robot/companion.js'`,
`bundle: true`, `format: 'esm'`, `target: 'es2022'`, `minify: true`, and
`legalComments: 'eof'`. Supply a local installation of Three.js 0.186.1 through
`nodePaths` if it is not installed in this checkout. The standalone SVG is the
`robot-fallback` element from `template.js` with an SVG namespace.

`dist/hero-robot.js` mounts the companion only on the homepage, waits for the
loading/open intro to finish and tears down GPU resources on page exit. Styling
is scoped in `dist/hero-robot.css` to preserve the rest of the site.
