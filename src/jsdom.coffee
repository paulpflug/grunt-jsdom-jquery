jsdom = require "jsdom"
jQuery = require "jquery" 
_ = require "lodash"
module.exports = (grunt) ->
  helper = require("./lib/jsdom-lib")(grunt)
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
    })
    _.defaults(options.toc, {
      selector: "#toc"
      chapter: ":not(.front-matter) > h2"
      section: "h3"
      subsection: "h4"
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
    this.files.forEach (file) ->
      jsdom.env {
        file: "./"+file.src[0]
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
              $: jQuery(window)
              document: window.document
            }
            for func in options.functions
              if _.isString(func)
                func = helper[func]
              if _.isFunction(func)
                func.call self, options, file.src[0]
            grunt.file.write file.dest, window.document.innerHTML
            done()
      }
