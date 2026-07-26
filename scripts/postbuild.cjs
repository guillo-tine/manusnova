const fs = require('fs');
const p = 'dist/index.html';
try {
  fs.copyFileSync(p, 'dist/404.html');
  console.log('postbuild.cjs: copied 404.html');
} catch (err) {
  console.error('postbuild.cjs error:', err.message);
  process.exit(1);
}
