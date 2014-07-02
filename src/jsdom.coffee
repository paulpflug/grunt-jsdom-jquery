jsdom = require "jsdom"
_ = require "lodash"
fs = require "fs"
module.exports = (grunt) ->
  helper = require("./lib/jsdom-lib")(grunt)
  jQueryFile = fs.readFileSync(require.resolve("jquery"),"utf8")
  grunt.registerMultiTask "jsdom", "Inject json in js file" , () ->
    options = this.options()
    _.defaults(options, {
      toc: {}
      bib: {}
      tof: {}
      tot: {}
      jadeOptions: 
        pretty: true
      functions: ["toc","tot","tof","bib"]
      scripts: undefined
      src: undefined
    })
    _.defaults(options.toc, {
      selector: "#toc"
      chapter: ":not(.front-matter,.back-matter) > h2"
      chapterTemplate: "span.chapternumber=chapter"
      chapterTextClass: "chaptertext"
      section: "h3"
      sectionTemplate: "span.sectionnumber=chapter+'.'+section"
      sectionTextClass: "sectiontext"
      subsection: "h4"
      subsectionTemplate: "span.subsectionnumber=chapter+'.'+section+'.'+subsection"
      subsectionTextClass: "subsectiontext"
      })
    _.defaults(options.tof, {
      selector: "#tof"
      element: "figure:has(figcaption)"
      caption: "figcaption"
      textClass: "figuretext"
      linkTextClass: "figurereftext"
      preClass:"pre"
      preDefault: "Fig."
      numberTemplate:"span.figurenumber=pre+chapter+'.'+chapterelement"
      shortClass:"short"
      })
    _.defaults(options.tot, {
      selector: "#tot"
      element: "table:has(caption)"
      caption: "caption"
      textClass: "tabletext"
      linkTextClass: "tablereftext"
      preClass:"pre"
      preDefault: "Tab."
      numberTemplate:"span.tablenumber=pre+chapter+'.'+chapterelement"
      shortClass:"short"
      })
    _.defaults(options.bib, {
      selector: "#bib"
      cite: ":not(blockquote) > cite"
      citeStyle: {}
      sort: "NUMBER"
      file: undefined
      modifyEntry: undefined
      entryStyle: 
        """
        td.bibleft
          span.bibnumber= '['+NUMBER+']'
        td.bibright
          if AUTHOR
            span.bibauthor= AUTHOR+'. '
          if TITLE
            span.bibtitle= TITLE+'. '
          if YEAR
            -var date = YEAR
            if MONTH
              -date = MONTH+' '+date
            -date = date+ ', '
          case entryType 
            when 'ARTICLE'
              if JOURNAL
                span.bibjournal= JOURNAL+', '
              if VOLUME
                -var str = VOLUME
                if ISSUE
                  -str = VOLUME+'('+ISSUE+')'
                if PAGES
                  -str = str+':'+PAGES
                -str = str+ ', '
                span.bibvolume= str
              if date
                span.bibdate= date
              if ISSN
                span.bibissn= 'ISSN '+ ISSN+', '
            when 'BOOK'
              if PUBLISHER
                span.bibpublisher= PUBLISHER+', '
              if date
                span.bibdate= date
          if URL
            -var str = URL
            if DOI
              -str = DOI
            span.biburl URL 
            a.biburl(href=URL)=str
        """
      patterns:
       ".bib": /.html/i
      })
    _.defaults(options.bib.citeStyle, {
      default: "span.citenumber='['+NUMBER+']'"
      })
    done = this.async()

    if not options.src
      options.src = [jQueryFile] 
    else
      options.src = [jQueryFile].concat(options.src)
    this.files.forEach (file) ->
      jsdom.env {
        file: "./"+file.src[0]
        src: options.src
        scripts: options.scripts
        features:
          FetchExternalResources: ["script","css"]
          ProcessExternalResources: ["script"]
          MutationEvents: "2.0"
          QuerySelector: false
        done: (err,window) ->
          if err
            console.log err
          else
            self = {
              window: window
              $: window.jQuery
              document: window.document
              grunt: grunt
            }
            for func in options.functions
              if _.isString(func)
                func = helper[func]
              if _.isFunction(func)
                func.call self, options, file.src[0]
            grunt.file.write file.dest, window.document.innerHTML
            done()
      }
