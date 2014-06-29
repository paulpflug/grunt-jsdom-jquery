(function() {
  var bibparse, jade, _;

  bibparse = require("bibtex-parser");

  jade = require("jade");

  _ = require("lodash");

  module.exports = function(grunt) {
    return {
      toc: function(options) {
        var $, createLink, document, toc;
        $ = this.$;
        document = this.document;
        createLink = function(href, innerHTML) {
          var a;
          a = $(document.createElement("a")).attr("href", href).html(innerHTML);
          return a;
        };
        toc = $(options.toc.selector).html("").append(document.createElement("ul"));
        return $(options.toc.chapter).each(function(chapter) {
          var li, link, self, ulchapter;
          chapter++;
          self = $(this);
          self.attr("id", "chapter" + chapter);
          ulchapter = $(document.createElement("ul"));
          link = createLink("#chapter" + chapter, chapter + " " + self.html());
          li = $(document.createElement("li")).addClass("toc chapter").append(link).append(ulchapter);
          toc.append(li);
          return self.nextUntil(options.toc.chapter, options.toc.section).each(function(section) {
            var ulsection;
            section++;
            section = chapter + "." + section;
            self = $(this);
            self.attr("id", "section" + section);
            ulsection = $(document.createElement("ul"));
            link = createLink("#section" + section, section + " " + self.html());
            li = $(document.createElement("li")).addClass("toc section").append(link).append(ulsection);
            ulchapter.append(li);
            return self.nextUntil(options.toc.section, options.toc.subsection).each(function(subsection) {
              subsection++;
              subsection = section + "." + subsection;
              self = $(this);
              self.attr("id", "subsection" + subsection);
              link = createLink("#subsection" + subsection, subsection + " " + $(this).html());
              li = $(document.createElement("li")).addClass("toc subsection").append(link).append(ulsection);
              return ulsection.append(li);
            });
          });
        });
      },
      tof: function(options) {},
      tot: function(options) {},
      bib: function(options, src) {
        var $, allEntries, bib, bibrow, bibtable, citeTemplates, document, entry, entryTemplate, file, html, k, str, template, usedEntries, v, _i, _len, _ref, _ref1, _ref2;
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
            number++;
            self = $(this);
            key = self.html().toUpperCase();
            if (!allEntries[key]) {
              return self.attr("style", "color:red");
            } else {
              if (!usedEntries[key]) {
                obj = allEntries[key];
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
          return bib = $(options.bib.selector).html("").append(bibtable);
        }
      }
    };
  };

}).call(this);
