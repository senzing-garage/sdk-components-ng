# Themes
By default things will come unstyled. It's much easier to add styles than it is to remove them. Component styles are opt-in rather than opt-out.

The theming of components is handled via CSS Variables. Essentially you add the css-var key and it's css value to which the selector/property combination applies to your documents body styles like below:
```scss
body {
        --sz-search-button-submit-padding: 0 30px 0 30px;
        --sz-search-button-border-radius: 3px;
        --sz-search-button-clear-font-size: 10px;
        --sz-search-label-margin: 0 0 10px 4px;
        --sz-search-input-border-radius: 8px;
}
```



## Pre-Built
For a list of precompiled themes and how to use them 
see [the docs](./themes/pre-built.html) for more information.

## Custom
For more information about creating a custom theme 
see [the docs](./themes/customizing.html) for more information.
