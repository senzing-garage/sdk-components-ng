const fs = require('fs-extra');
const concat = require('concat');
var sass = require('sass');

(async function build() {
  // documentation
  await fs.copy(
    './docs/images',
    './docs/docs/images'
  ).catch((err)=>{
    console.log('build err #1: could not readme images to docs/docs/images.');
  });

})();
