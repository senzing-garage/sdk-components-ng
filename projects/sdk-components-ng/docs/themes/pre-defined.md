# Pre Defined

We've included some pre-built themes for quick usage to get you up and running. You'll almost certainly want to create your own, or tweak things to match your application's styling as needed. The compiled css files are located in the styles/themes directory in the package being used.

## using sass
if you're using sass(and scss processor can reference node_modules), open up your main scss file(src/styles.scss in default angular layout) and include the following.

```scss
@import '@senzing/sdk-components-ng/styles/themes/senzing.css';
```

## using css
open up your main html file and include the css reference in the HEAD of your document.

```html
<link rel="stylesheet" href="node_modules/@senzing/sdk-components-ng/styles/themes/senzing.css">
```
for production it is recommended you copy the theme stylesheet you will be using over to a static directory(probably a bad idea to leave node_modules open to the world) and change the above reference to point to it's location. 
