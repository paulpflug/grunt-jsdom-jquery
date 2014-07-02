(function() {
  var bibparse, createList, getClosestIndex, getContent, getTemplatedTxt, jade, _;

  bibparse = require("bibtex-parser");

  jade = require("jade");

  _ = require("lodash");

  getTemplatedTxt = function(element, txttemplate, txtclass) {
    var children, txt;
    children = element.children("." + txtclass);
    if (children.length === 0) {
      txt = element.html();
    } else {
      txt = children.first().html();
    }
    return txttemplate({
      txtclass: txtclass,
      txt: txt
    });
  };

  getContent = function(element, cClass, cDefault) {
    var children, value;
    children = element.children("." + cClass);
    if (children.length === 0) {
      return value = cDefault;
    } else {
      value = children.first().html();
      return children.first().remove();
    }
  };

  getClosestIndex = function($, element, closestSelector) {
    var i;
    i = -1;
    $(closestSelector).first().nextUntil(element, closestSelector).each(function(index) {
      return i = index;
    });
    return i + 2;
  };

  createList = function(options, name) {
    var $, document, list, templates;
    $ = this.$;
    document = this.document;
    templates = {
      txt: jade.compile("span(class=txtclass)!=txt", options.jadeOptions),
      number: jade.compile(options[name].numberTemplate, options.jadeOptions),
      link: jade.compile("a(href=href)!=text", options.jadeOptions)
    };
    list = $(document.createElement("ul"));
    $(options[name].selector).html("").append(list);
    return $(options[name].element).each(function(index) {
      var caption, data, li, link, number, self, short, txt;
      self = $(this);
      caption = self.children(options[name].caption).first();
      data = {
        pre: getContent(caption, options[name].preClass, options[name].preDefault),
        element: index + 1,
        chapter: getClosestIndex($, self, options.toc.chapter),
        chapterelement: self.prevUntil(options.toc.chapter, options[name].element).length + 1,
        section: getClosestIndex($, self, options.toc.section),
        sectionelement: self.prevUntil(options.toc.section, options[name].element).length + 1,
        subsection: getClosestIndex($, self, options.toc.subsection),
        subsectionelement: self.prevUntil(options.toc.subsection, options[name].element).length + 1
      };
      number = templates.number(data);
      txt = getTemplatedTxt(caption, templates.txt, options[name].textClass);
      short = getContent(caption, options[name].shortClass, false);
      if (!short) {
        short = txt;
      }
      link = templates.link({
        href: "#" + self.attr("id"),
        text: number + " " + short
      });
      caption.html(number + " " + txt);
      $("a[href$=#" + self.attr("id") + "]").each(function() {
        var linknumber, linktxt;
        self = $(this);
        linktxt = getTemplatedTxt(self, templates.txt, options[name].linkTextClass);
        data.pre = getContent(self, options[name].preClass, options[name].preDefault);
        linknumber = templates.number(data);
        return self.html(linknumber + linktxt);
      });
      li = $(document.createElement("li")).addClass(name).append(link);
      return list.append(li);
    });
  };

  module.exports = function(grunt) {
    return {
      toc: function(options) {
        var $, document, helper, templates, toc;
        $ = this.$;
        document = this.document;
        templates = {
          txt: jade.compile("span(class=txtclass)!=txt", options.jadeOptions),
          link: jade.compile("a(href=href)!=text", options.jadeOptions),
          chapter: jade.compile(options.toc.chapterTemplate, options.jadeOptions),
          section: jade.compile(options.toc.sectionTemplate, options.jadeOptions),
          subsection: jade.compile(options.toc.subsectionTemplate, options.jadeOptions)
        };
        helper = function(self, name, numbers, parentUL) {
          var href, li, link, newul, number, txt;
          txt = getTemplatedTxt(self, templates.txt, options.toc[name + "TextClass"]);
          href = name + numbers[name];
          self.attr("id", href);
          number = templates[name](numbers);
          self.html(number + " " + txt);
          link = templates.link({
            href: "#" + href,
            text: self.html()
          });
          newul = $(document.createElement("ul"));
          li = $(document.createElement("li")).addClass("toc " + name).append(link).append(newul);
          parentUL.append(li);
          return newul;
        };
        toc = $(document.createElement("ul"));
        $(options.toc.selector).html("").append(toc);
        return $(options.toc.chapter).each(function(chapter) {
          var chapterul;
          chapter++;
          chapterul = helper($(this), "chapter", {
            chapter: chapter
          }, toc);
          return $(this).nextUntil(options.toc.chapter, options.toc.section).each(function(section) {
            var sectionul;
            section++;
            sectionul = helper($(this), "section", {
              chapter: chapter,
              section: section
            }, chapterul);
            return $(this).nextUntil(options.toc.section, options.toc.subsection).each(function(subsection) {
              subsection++;
              return helper($(this), "subsection", {
                chapter: chapter,
                section: section,
                subsection: subsection
              }, sectionul);
            });
          });
        });
      },
      tof: function(options) {
        return createList.call(this, options, "tof");
      },
      tot: function(options) {
        return createList.call(this, options, "tot");
      },
      bib: function(options, src) {
        var $, allEntries, bibrow, bibtable, citeTemplates, document, entry, entryTemplate, file, html, k, str, template, usedEntries, v, _i, _len, _ref, _ref1, _ref2;
        $ = this.$;
        document = this.document;
        file = "";
        if (options.bib.file && grunt.file.exists(options.bib.file)) {
          file = options.bib.file;
        } else if (options.bib.patterns) {
          str = src;
          _ref = options.bib.patterns;
          for (k in _ref) {
            v = _ref[k];
            str = str.replace(v, k);
          }
          if (grunt.file.exists(str)) {
            file = str;
          }
        }
        if (file) {
          if (file.search(/.json/) !== -1) {
            allEntries = grunt.file.readJSON(file);
          } else {
            allEntries = bibparse(grunt.file.read(file));
          }
          usedEntries = {};
          citeTemplates = {};
          _ref1 = options.bib.citeStyle;
          for (k in _ref1) {
            v = _ref1[k];
            template = v;
            if (grunt.file.exists(template)) {
              template = grunt.file.read(template);
            }
            citeTemplates[k] = jade.compile(template, options.jadeOptions);
          }
          template = options.bib.entryStyle;
          if (grunt.file.exists(template)) {
            template = grunt.file.read(template);
          }
          entryTemplate = jade.compile(template, options.jadeOptions);
          $(options.bib.cite).each(function(number) {
            var a, html, key, obj, self, templateKey;
            self = $(this);
            key = self.attr("ref");
            if (!key) {
              key = self.html().toUpperCase();
            }
            if (!allEntries[key]) {
              return self.attr("style", "color:red");
            } else {
              if (!usedEntries[key]) {
                obj = allEntries[key];
                number++;
                obj.NUMBER = number;
                obj.KEY = key;
                usedEntries[key] = obj;
              }
              templateKey = "default";
              if (self.attr("template")) {
                templateKey = self.attr("template");
              }
              citeTemplates[templateKey];
              html = citeTemplates[templateKey](usedEntries[key]);
              self.attr("ref", key);
              a = $(document.createElement("a")).attr("href", "#" + key).html(html);
              return self.html(a);
            }
          });
          bibtable = $(document.createElement("table"));
          _ref2 = _.sortBy(usedEntries, options.bib.sort);
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            entry = _ref2[_i];
            if (_.isFunction(options.bib.modifyEntry)) {
              entry = options.bib.modifyEntry(entry);
            }
            html = entryTemplate(entry);
            bibrow = $(document.createElement("tr")).attr("id", entry.KEY).append(html);
            bibtable.append(bibrow);
          }
          return $(options.bib.selector).html("").append(bibtable);
        }
      }
    };
  };

}).call(this);
