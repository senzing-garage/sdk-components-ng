const fs = require('fs-extra');
const concat = require('concat');
var sass = require('node-sass');

(async function build() {
  // do styles first
  await sass.render({
    file: "./src/lib/scss/styles.scss",
    includePaths: ["./src/lib/scss/"]
  }, function(err, result) {
    if(err){
      console.log('SASSY ERROR: ',err.message);
    } else {
      // make styles dir
      fs.mkdir('./dist/@senzing/sdk-components-ng/styles', { recursive: true }, (err) => {
        if(!(err)){
          // was able to create styles dir

          // now write file to it
          fs.writeFile('./dist/@senzing/sdk-components-ng/styles/styles.css', result.css, function(err){
            if(!err){
              //file written on disk
              console.log('wrote ./dist/@senzing/sdk-components-ng/styles.css');
            } else {
              console.log('could not write ./dist/@senzing/sdk-components-ng/styles.css ',err);
            }
          });

        }
      });

    }
  });

  // documentation
  await fs.copy(
    './docs',
    './dist/@senzing/sdk-components-ng/docs'
  ).catch((err)=>{
    console.log('build err #1: could not copy documentation to package.');
  });

  // now themes
  await fs.copy(
    './src/lib/scss/themes',
    './dist/@senzing/sdk-components-ng/styles/themes'
  ).catch((err)=>{
    console.log('build err #2: could not copy themes to package.');
  });

  // root readme.md file to under sdk project(so the npm readme stays in sync)
  await fs.copyFile(
    './README.md',
    './src/README.md'
  ).catch((err)=>{
    console.log('build err #3: could not copy README.md to package.');
  });

  // do readme and markdown files
  await fs.copyFile(
    './src/README.md',
    './dist/@senzing/sdk-components-ng/README.md'
  ).catch((err)=>{
    console.log('build err #4: could not copy README.md to package.');
  });

  await fs.copyFile(
    './src/LICENSE',
    './dist/@senzing/sdk-components-ng/LICENSE'
  ).catch((err)=>{
    console.log('build err #5: could not copy LICENSE to package.');
  });

})();
