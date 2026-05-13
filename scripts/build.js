const esbuild = require('esbuild');
const path = require('path');

const root = path.join(__dirname, '..');
const handlers = ['websocket-handler', 'rest-handler', 'fanout-handler'];

Promise.all(
  handlers.map(handler =>
    esbuild.build({
      entryPoints: [path.join(root, 'src', 'handlers', `${handler}.ts`)],
      bundle: true,
      platform: 'node',
      target: 'node20',
      outfile: path.join(root, 'dist', handler, 'index.js'),
      external: ['@aws-sdk/*'],
    })
  )
)
  .then(() => console.log('Build complete — handlers bundled to dist/'))
  .catch(err => { console.error(err); process.exit(1); });
