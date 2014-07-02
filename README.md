# grunt-jsdom-jquery

"Grunt Task that uses jsdom to postprocess compiled HTML files with jQuery",
  
A simple [Grunt][grunt] multitask that uses [jsdom][jsdom] to compile HTML on server side and allows manipulation with [jQuery][jquery].

It is possible to use own functions to manipulate the HTML, but there are also four predefined functions:
* toc - will create a table of content
* bib - will create a table of all cites and link them up
* tof - will create a table of all figures and link them up
* tot - will create a table of all tables and link them up

Used in [paged-media-boilerplate].

The Bibliography can be used with a custom `.json` or a Bibtex file.
All four functions behave very similar to Latex.

## Table of Contents

<!-- toc -->
* [Getting Started](#getting-started)
  * [Use it with grunt](#use-it-with-grunt)
  * [Example with hyphenation](#example-with-hyphenation)
* [Documentation](#documentation)
  * [Options](#options)
  * [Predefined post processing](#predefined-post-processing)
    * [Table of contents (toc)](#table-of-contents-toc)
    * [Table of figures / tables (tof/tot)](#table-of-figures-tables-toftot)
    * [Bibliography (bib)](#bibliography-bib)
* [Release History](#release-history)
* [License](#license)

<!-- toc stop -->
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
[paged-media-boilerplate]: https://github.com/paulpflug/paged-media-boilerplate

### Example with hyphenation
Get [jquery-hyphen.js](https://github.com/bramstein/hypher/tree/master/dist) and a [pattern file for your language](https://github.com/bramstein/hyphenation-patterns/tree/master/dist/browser).

This is how a task could look like:

```coffee
jsdom:
  options:
    src: [
      grunt.file.read("jquery-hyphen.js")
      grunt.file.read("en-us.js")
    ]
    functions: [
      () -> this.$('p').hyphenate('en-us');
    ]
```

## Documentation
Simply add task definition in your gruntfile. See the folllowing example:

```coffeescript
jsdom:
  options:
    # options
  compile: 
    src: "path/to/some/html/file/index.html"
    dest: "pdf/output/"
```

Run `grunt jsdom` to execute all the targets or `grunt jsdom:targetname` to execute a specific target. Every `html` file defined by the `src` parameter will be post processed and saved to `dest` folder.


### Options
Here the available options with the corresponding defaults:
```coffee
toc: # see below
tof: # see below
tot: # see below
bib: # see below


# Will be passed to each jade template generation
jadeOptions: 
  pretty: true

# Will take an array of functions, which will be executed in order.
# The names of the 4 predefined functions are also valid.
# For details see below.
functions: ["toc","tot","tof","bib"]

# See documentation of js dom.
# jQuery will be unshifted to the `src` array. 
scripts: undefined
src: undefined

```
##### `options.functions`

In each function `this` will be bound to an object possessing the following properties: 
* `window`
* `document`
* jQuery's `$`.

Parameters for the functions are:
* `options` object 
* source (the HTML file) filename.


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
    toc:
      selector: "#table-of-contents"
  compile: 
    src: "path/to/some/html/file/index.html"
    dest: "pdf/output/"
```

### Predefined post processing
Options regarding the predefined functions can be accessed by `options.{{nameOfFunction}}`, so for the table of contents function `options.toc` will be responsible.
#### Table of contents (toc)

This function will search for the given selector (#toc)
and fill its element with a linked list of chapters, sections and subsections.

The selectors for these three can be individually defined, also the id for the found elements will be set to, e.g., `section1.1`.

##### Defaults for options:
```coffee
# Selector for the table of contents, content will be deleted.
selector: "#toc"

# Selector for the chapter headings
chapter: ":not(.front-matter,.back-matter) > h2"

# Template for the chapternumber
chapterTemplate: "span.chapternumber=chapter"

# Class which will be added to the text
chapterTextClass: "chaptertext"

# Same for section and subsection
section: "h3"
sectionTemplate: "span.sectionnumber=chapter+'.'+section"
sectionTextClass: "sectiontext"
subsection: "h4"
subsectionTemplate: "span.subsectionnumber=chapter+'.'+section+'.'+subsection"
subsectionTextClass: "subsectiontext"
```

##### Example:
```html
<div id="toc"></div>
<h2>Chapter Heading</h2>
```
will be replaced by:
```html
<div id="toc">
  <ul>
    <li class="toc chapter">
      <a href="#chapter1">
        <span class="chapternumber">1</span> 
        <span class="chaptertext">Chapter Heading</span>
      </a>
      <ul>
    </li>
  </ul>
</div>
<h2 id="chapter1">
  <span class="chapternumber">1</span> 
  <span class="chaptertext">Chapter Heading</span>
</h2>
```

#### Table of figures / tables (tof/tot)

These functions will search for the given selector (#tof/#tot)
and fill its element with a linked list of figures / tables.

##### Defaults for options:

```coffee
# Content of this element will be replaced by the list of figures / tables
selector: "#tof" / "#tot"

# Selector for choosing all elements which should be listed and / or linked
element: "figure:has(figcaption)" / "table:has(caption)"

# Selector for the caption
caption: "figcaption" / "caption"

# Class which will be added to all text found in the caption
textClass: "figuretext" / "tabletext"

# Class which will be added to all text found in a link to an element
linkTextClass: "figurereftext" / "tablereftext"

# Class for the text which belongs in front of the number
preClass:"pre"

# Default for the text in front of the number 
preDefault: "Fig." / "Tab."

# Jade template for the number, pre will be 
# substituted by given text or default.
# Available numbers:
# element (absolute number of the element)
# chapter (number of the containing chapter)
# chapterelement (absolute number of the element relative to the chapter)
# section (number of the containing section)
# sectionelement (absolute number of the element relative to the section)
# subsection (number of the containing subsection)
# subsectionelement (absolute number of the element relative to the subsection)
numberTemplate:"span.figurenumber=pre+chapter+'.'+chapterelement" /
  "span.tablenumber=pre+chapter+'.'+chapterelement"

# Class for the short description for the list
shortClass:"short"
```

##### Example:

```html
<h2>Chapter 1</h2>
<figure id="image">
  <img></img>
  <figcaption>
    <span.short>Short description</span>
    <span.pre>Figure </span>
  Long description
  </figcaption>
</figure>
<a href="#image">(a)</a>
<div class="back-matter">
  <h2>Table of figures</h2>
  <div id="tof"></div>
</div>
```
will be replaced by:
```html
<h2 id="chapter1">
  <span class="chapternumber">1</span> 
  <span class="chaptertext">Chapter Heading</span>
</h2>
<figure id="image">
  <img></img>
  <figcaption>
    <span class="figurenumber">Figure 1.1</span> 
    <span class="figuretext">Long description</span>
  </figcaption>
</figure>
<a href="#image">
  <span class="figurenumber">Figure 1.1</span>
  <span class="figurereftext">(a)</span>
</a>
<div class="back-matter">
  <h2>Table of figures</h2>
  <div id="tof">
    <ul>
      <li class="tof">
        <a href="#image">
          <span class="figurenumber">Figure 1.1</span> 
          <span class="figuretext">Short description</span>
        </a>
      </li>
    </ul>
  </div>
</div>
```
#### Bibliography (bib)
Searches for cite elements in the html file, modifies them according to a template and creates a linked table with all used cites.

Can be used with a `.json` or a `.bib` file. If the provided file has no `.json` in its name, [bibtex-parser][bibtex-parser] will be used for reading it. A `.json` file should contain a dictionary, where the keys are used to fetch the entries.

***Note:*** bibtex-parser will convert all keys to uppercase. So for lookup the provided keys will be also uppercased. Keep that in mind if using a `.json`.

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
# Selector for the bibliography, content will be deleted.
selector: "#bib" 

# Selector for a single cite, note, that the innerHTML will be upper cased and 
# then be used to search the provided dictionary for an corresponding entry.
cite: ":not(blockquote) > cite"

# Will replace KEY in a <cite template="TEMPLATENAME">KEY</cite> with the 
# compiled jade template. If no TEMPLATENAME is provided, the default will 
# be used.
citeStyle:  
  default: "span.citenumber=`[`+NUMBER+`]`"


# Name of the key, which will be used for sorting all used entries prior 
# creating the table. 
# Uses [_.sortBy](http://lodash.com/docs#sortBy) that means ["YEAR", "MONTH"] is valid.
sort: "NUMBER"

# Function which will be called with each entry prior creating the table,
# should return the (modified) entry
modifyEntry: undefined

# Filename or string of a jade template which will be used for each entry
entryStyle: # default is the template in src/bibEntry.jade

# Filename of the bibliography, if not defined will use patterns to find a file
file: undefined

# Is only used if no file is specified. Replaces substrings in the source 
# filename (the HTML file) with other strings to find the bibliography # dynamically.
patterns: 
  ".bib": /.html/i # .html will be replaced with .bib, not cases sensitive
 ```

## Release History
 - *v0.0.4*: Bugfix for cites
 - *v0.0.3*: Added dependency
 - *v0.0.2*: Restructuring and tof/tot implementation
 - *v0.0.1*: First Release

## License
Copyright (c) 2014 Paul Pflugradt
Licensed under the MIT license.
