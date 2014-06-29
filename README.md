# grunt-jsdom-jquery

"Grunt Task that uses jsdom to postprocess compiled HTML files with jQuery",
  
A simple [Grunt][grunt] multitask that uses [jsdom][jsdom] to compile HTML on server side and allows manipulation with [jQuery][jquery].

It is possible to use own functions to manipulate the HTML, but there are also two predefined functions:
* toc - will create a table of content
* bib - will create a table of all cites and link them up


## Getting Started

### Use it with grunt

Install this grunt plugin next to your project's [grunt.js gruntfile][getting_started] with: `npm install grunt-jsdom-jquery`

Then add this line to your project's `grunt.js` gruntfile:

```javascript
grunt.loadNpmTasks('grunt-jsdom-jquery');
```

[jsdom]: https://github.com/tmpvar/jsdom
[jquery]: https://github.com/jquery/jquery
[grunt]: https://github.com/cowboy/grunt
[getting_started]: https://github.com/cowboy/grunt/blob/master/docs/getting_started.md
[bibtex-parser]: https://github.com/mikolalysenko/bibtex-parser
## Documentation
Simply add task definition in your gruntfile. See the folllowing example:

```javascript
    //...
    jsdom: {
      options: {
        // options
      },
      compile: {
        src: 'path/to/some/html/file/index.html',
        dest: 'pdf/output/'
      }
    },
    //...
```

Run `grunt jsdom` to execute all the targets or `grunt jsdom:targetname` to execute a specific target. Every `html` file defined by the `src` parameter will be post processed and saved to `dest` folder.


### Options
`options.functions` will take an array of functions, which will be executed in order.
In each function `this` will be bound to an object possessing the following properties: 
* `window`
* `document`
* jQuery's `$`.
Parameters for the functions are:
* `options` object 
* source (the HTML file) filename.

`functions` defaults to `["toc","tot","tof","bib"]` which are the names of the predefined functions.
These names can be used in conjunction with own functions.

##### Example
```coffee
jsdom: 
  options: 
    functions: [
      "toc",
      (options,src) ->
        $ = @$
        document = @document
        window = @window
        # do something
      ]   
      ,
  compile: 
    src: 'path/to/some/html/file/index.html'
    dest: 'pdf/output/'
```

### Predefined post processing
Options regarding the predefined functions can be accessed by `options.{{nameOfFunction}}`, so for the table of contents function `options.toc` will be responsible.
#### Table of contents (toc)

This function will search for the given selector (#toc)
and fill its element with a linked list of chapters, sections and subsections.

The selectors for these three can be individually defined, also the id for the found elements will be set to, e.g., `section1.1`.

##### Defaults for options:
```js
selector: "#toc", selector for the table of contents, content will be deleted.
chapter: ":not(.front-matter) > h2",
section: "h3",
subsection: "h4"
```
#### Bibliography (bib)
Searched for cite elements in the html file, modifies them according to a template and creates a linked table will all used cites.

Can be used with a `.json` or a `.bib` file. If the provided file has no `.json` in its name, [bibtex-parser][bibtex-parser] will be used for reading it. A `.json` file should contain a dictionary, where the keys are used to fetch the entries.

***Note:*** bibtex-parser will convert all keys to uppercase. So for lookup the provided keys will be also uppercased. Keep that in mind if using a '.json'.

##### Example:
```html
<cite>PhysRevB.89.035403</cite>
```
will be replaced by:
```html
<cite>
  <a href="#PHYSREVB.89.035403">
    <span class="citenumber">[1]</span>
  </a>
</cite>
```

##### Defaults for options:
```coffee
#selector for the bibliography, content will be deleted.
selector: "#bib" 

# selector for a single cite, note, that the innerHTML will be upper cased and 
# then be used to search the provided dictionary for an corresponding entry.
cite: ":not(blockquote) > cite"

# will replace KEY in a <cite template="TEMPLATENAME">KEY</cite> with the 
# compiled jade template. If no TEMPLATENAME is provided, the default will 
# be used.
citeStyle: { 
  default: "span.citenumber=`[`+NUMBER+`]`"
},

# Name of the key which will be used for sorting all used entries prior 
# creating the table. (uses [_.sortBy](http://lodash.com/docs#sortBy), 
# that means ["YEAR", "MONTH"] is valid)
sort: "NUMBER",

# Function which will be called with each entry prior creating the table,
# should return the (modified) entry
modifyEntry: undefined,

# filename or string of a jade template which will be used for each entry
entryStyle: // default is the template in src/bibEntry.jade

# filename of the bibliography, if not defined will use patterns to find a file
file: undefined,

# is only used if no file is specified. Replaces substrings in the source 
# filename (the HTML file) with other strings to find the bibliography # dynamically.
patterns: {
 ".bib": /.html/i
}
 ```
#### Table of figures / tables

Not implemented yet.

## Release History

 - *v0.0.1*: First Release

## License
Copyright (c) 2014 Paul Pflugradt
Licensed under the MIT license.
