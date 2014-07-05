bibparse = require "bibtex-parser"
jade = require "jade"
_ = require "lodash"
getTemplatedTxt = (element,txttemplate,txtclass) -> 
  children = element.children("."+txtclass)
  if children.length == 0
    txt = element.html()
  else
    txt = children.first().html()
  return txttemplate({txtclass: txtclass, txt: txt})
getContent = (element,cClass,cDefault) -> 
  children = element.children("."+cClass)
  if children.length == 0
    value = cDefault
  else
    value = children.first().html()
    children.first().remove()
getClosestIndex = ($,element,closestSelector) ->
  i = -1
  $(closestSelector).first().nextUntil(element,closestSelector).each (index) ->
    i = index
  return i + 2
createList = (options,name) ->
  $ = this.$
  document = this.document
  templates = {
    txt: jade.compile("span(class=txtclass)!=txt",options.jadeOptions)
    number: jade.compile(options[name].numberTemplate,options.jadeOptions)
    link: jade.compile("a(href=href)!=text",options.jadeOptions)
  }
  list = $(document.createElement("ul"))
  $(options[name].selector).html("").append list
  $(options[name].element).each (index) ->
    self = $(this)
    caption = self.children(options[name].caption).first()
    data = {
      pre: getContent(caption,options[name].preClass,options[name].preDefault)
      element: index+1
      chapter: getClosestIndex($,self,options.toc.chapter)
      chapterelement: self.prevUntil(options.toc.chapter,options[name].element).length+1
      section: getClosestIndex($,self,options.toc.section)
      sectionelement: self.prevUntil(options.toc.section,options[name].element).length+1
      subsection: getClosestIndex($,self,options.toc.subsection)
      subsectionelement: self.prevUntil(options.toc.subsection,options[name].element).length+1
      }
    number = templates.number(data)        
    txt = getTemplatedTxt(caption,templates.txt,options[name].textClass)
    short = getContent(caption,options[name].shortClass,false)
    if not short
      short = txt
    link = templates.link({href: "#" + self.attr("id"), text: number+" "+short})
    caption.html(number+" "+txt)
    $("a[href$=#"+self.attr("id")+"]").each () ->
      self = $(this)
      linktxt = getTemplatedTxt(self,templates.txt,options[name].linkTextClass)
      data.pre = getContent(self,options[name].preClass,options[name].preDefault)
      linknumber = templates.number(data)
      self.html(linknumber+ linktxt)
    li = $(document.createElement("li"))
    .addClass(name)
    .append(link)
    list.append(li)
module.exports = (grunt) ->
  return {
    toc: (options) ->
      $ = this.$
      document = this.document
      templates = {
        txt: jade.compile("span(class=txtclass)!=txt",options.jadeOptions)
        link: jade.compile("a(href=href)!=text",options.jadeOptions)
        chapter: jade.compile(options.toc.chapterTemplate,options.jadeOptions)
        section: jade.compile(options.toc.sectionTemplate,options.jadeOptions)
        subsection: jade.compile(options.toc.subsectionTemplate,options.jadeOptions)
      }
      helper = (self,name,numbers,parentUL) ->
        txt = getTemplatedTxt(self,templates.txt,options.toc[name+"TextClass"])
        href = name
        for s in ["chapter","section","subsection"]
          if numbers[s]
            href = href+"."+numbers[s]
        self.attr("id",href)
        number = templates[name](numbers)  
        self.html(number+" "+ txt)
        link = templates.link({href: "#" + href, text: self.html()})
        newul = $(document.createElement("ul"))
        li = $(document.createElement("li"))
        .addClass("toc "+name)
        .append(link)
        .append(newul)
        parentUL.append(li)
        return newul
      toc = $(document.createElement("ul"))
      $(options.toc.selector).html("").append toc
      $(options.toc.chapter).each (chapter) ->
        chapter++
        chapterul = helper($(this),"chapter",{chapter:chapter},toc)
        $(this).nextUntil(options.toc.chapter,options.toc.section).each (section) ->
          section++
          sectionul = helper($(this),"section",{chapter:chapter,section:section},chapterul)
          $(this).nextUntil(options.toc.section,options.toc.subsection).each (subsection) ->
            subsection++
            helper($(this),"subsection",{chapter:chapter,section:section,subsection:subsection},sectionul)
    tof: (options) ->
      createList.call this, options, "tof"
    tot: (options) ->
      createList.call this, options, "tot"
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
          self = $(this)
          key = self.attr("ref")
          if not key
            key = self.html().toUpperCase()
          if not allEntries[key]
            self.attr("style","color:red")
          else
            if not usedEntries[key]
              obj = allEntries[key]
              number++
              obj.NUMBER = number
              obj.KEY = key
              usedEntries[key] = obj
            templateKey = "default"
            if self.attr("template") 
              templateKey = self.attr("template")
            citeTemplates[templateKey]
            html = citeTemplates[templateKey](usedEntries[key])
            self.attr("ref",key)
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
        $(options.bib.selector).html("").append bibtable
  }   

