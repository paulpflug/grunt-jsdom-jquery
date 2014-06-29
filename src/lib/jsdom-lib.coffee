bibparse = require "bibtex-parser"
jade = require "jade"
_ = require "lodash"
module.exports = (grunt) ->
  return {
    toc: (options) ->
      $ = this.$
      document = this.document
      createLink = (href, innerHTML) ->
        a = $(document.createElement("a"))
        .attr("href", href).html(innerHTML)
        return a
      toc = $(options.toc.selector).html("").append document.createElement("ul")
      $(options.toc.chapter).each (chapter) ->
        chapter++
        self = $(this)
        self.attr("id","chapter" + chapter)
        ulchapter = $(document.createElement("ul"))
        link = createLink("#chapter" + chapter, chapter+" "+self.html())
        li = $(document.createElement("li"))
        .addClass("toc chapter")
        .append(link)
        .append(ulchapter)
        toc.append(li)
        self.nextUntil(options.toc.chapter,options.toc.section).each (section) ->
          section++
          section = chapter + "."+ section
          self = $(this)
          self.attr("id","section" + section)
          ulsection = $(document.createElement("ul"))
          link = createLink("#section" + section, section+" "+self.html())
          li = $(document.createElement("li"))
          .addClass("toc section")
          .append(link)
          .append(ulsection)
          ulchapter.append(li)
          self.nextUntil(options.toc.section,options.toc.subsection).each (subsection) ->
            subsection++
            subsection = section+"." +subsection
            self = $(this)
            self.attr("id","subsection" + subsection)
            link = createLink("#subsection" + subsection, subsection+" "+$(this).html())
            li = $(document.createElement("li"))
            .addClass("toc subsection")
            .append(link)
            .append(ulsection)
            ulsection.append(li)
    tof: (options) ->
      return
    tot: (options) ->
      return
    bib: (options,src) ->
      $ = this.$
      document = this.document
      file = ""
      if options.bib.file and grunt.file.exists(options.bib.file)
        file = options.bib.file
      else if options.bib.patterns
        str = src
        for k,v of options.bib.patterns
          str = str.replace v,k
        if grunt.file.exists(str)
          file = str
      if file
        if file.search(/.json/) != -1
          allEntries = grunt.file.readJSON(file)
        else
          allEntries = bibparse(grunt.file.read(file))
        usedEntries = {}
        citeTemplates = {}
        for k,v of options.bib.citeStyle
          template = v
          if grunt.file.exists(template)
            template = grunt.file.read(template)
          citeTemplates[k] = jade.compile(template,options.jadeOptions)
        template = options.bib.entryStyle
        if grunt.file.exists(template)
          template = grunt.file.read(template)
        entryTemplate = jade.compile(template,options.jadeOptions)
        $(options.bib.cite).each (number) ->
          number++
          self = $(this)
          key = self.html().toUpperCase()
          if not allEntries[key]
            self.attr("style","color:red")
          else
            if not usedEntries[key]
              obj = allEntries[key]
              obj.NUMBER = number
              obj.KEY = key
              usedEntries[key] = obj
            templateKey = "default"
            if self.attr("template") 
              templateKey = self.attr("template")
            citeTemplates[templateKey]
            html = citeTemplates[templateKey](usedEntries[key])
            a = $(document.createElement("a"))
            .attr("href", "#"+key).html(html)
            self.html(a)
        bibtable = $(document.createElement("table"))
        for entry in _.sortBy(usedEntries,options.bib.sort)
          if _.isFunction(options.bib.modifyEntry)
            entry = options.bib.modifyEntry(entry)
          html = entryTemplate(entry)
          bibrow = $(document.createElement("tr")).attr("id",entry.KEY).append(html)
          bibtable.append(bibrow)
        bib = $(options.bib.selector).html("").append bibtable
  }   

