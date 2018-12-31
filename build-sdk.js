const fs = require('fs-extra');
const concat = require('concat');
var sass = require('node-sass');

(async function build() {
  // do styles first
  await sass.render({
    file: "./projects/sdk-components-ng/src/lib/scss/styles.scss",
    includePaths: ["./projects/sdk-components-ng/src/lib/scss/"]
  }, function(err, result) {
    if(err){
      console.log('SASSY ERROR: ',err.message);
    } else {
      fs.writeFile('./dist/@senzing/sdk-components-ng/styles/styles.css', result.css, function(err){
        if(!err){
          //file written on disk
        }
      });
    }
  });

  // documentation
  await fs.copy(
    './docs',
    './dist/@senzing/sdk-components-ng/docs'
  ).catch((err)=>{
    console.log('build err #1: could not copy themes to package.');
  });

  // now themes
  await fs.copy(
    './projects/sdk-components-ng/src/lib/scss/themes',
    './dist/@senzing/sdk-components-ng/styles/themes'
  ).catch((err)=>{
    console.log('build err #1: could not copy themes to package.');
  });

  // do readme and markdown files
  await fs.copyFile(
    './projects/sdk-components-ng/README.md',
    './dist/@senzing/sdk-components-ng/README.md'
  ).catch((err)=>{
    console.log('build err #2: could not copy README.md to package.');
  });
  await fs.copyFile(
    './projects/sdk-components-ng/LICENSE',
    './dist/@senzing/sdk-components-ng/LICENSE'
  ).catch((err)=>{
    console.log('build err #3: could not copy LICENSE to package.');
  });

})();
