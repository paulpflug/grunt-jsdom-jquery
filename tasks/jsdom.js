(function() {
  var fs, jsdom, _;

  jsdom = require("jsdom");

  _ = require("lodash");

  fs = require("fs");

  module.exports = function(grunt) {
    var helper, jQueryFile;
    helper = require("./lib/jsdom-lib")(grunt);
    jQueryFile = fs.readFileSync(require.resolve("jquery"), "utf8");
    return grunt.registerMultiTask("jsdom", "Inject json in js file", function() {
      var done, options;
      options = this.options();
      _.defaults(options, {
        toc: {},
        bib: {},
        tof: {},
        tot: {},
        jadeOptions: {
          pretty: true
        },
        functions: ["toc", "tot", "tof", "bib"],
        scripts: void 0,
        src: void 0
      });
      _.defaults(options.toc, {
        selector: "#toc",
        chapter: ":not(.front-matter,.back-matter) > h2",
        chapterTemplate: "span.chapternumber=chapter",
        chapterTextClass: "chaptertext",
        section: "h3",
        sectionTemplate: "span.sectionnumber=chapter+'.'+section",
        sectionTextClass: "sectiontext",
        subsection: "h4",
        subsectionTemplate: "span.subsectionnumber=chapter+'.'+section+'.'+subsection",
        subsectionTextClass: "subsectiontext"
      });
      _.defaults(options.tof, {
        selector: "#tof",
        element: "figure:has(figcaption)",
        caption: "figcaption",
        textClass: "figuretext",
        linkTextClass: "figurereftext",
        preClass: "pre",
        preDefault: "Fig.",
        numberTemplate: "span.figurenumber=pre+chapter+'.'+chapterelement",
        shortClass: "short"
      });
      _.defaults(options.tot, {
        selector: "#tot",
        element: "table:has(caption)",
        caption: "caption",
        textClass: "tabletext",
        linkTextClass: "tablereftext",
        preClass: "pre",
        preDefault: "Tab.",
        numberTemplate: "span.tablenumber=pre+chapter+'.'+chapterelement",
        shortClass: "short"
      });
      _.defaults(options.bib, {
        selector: "#bib",
        cite: ":not(blockquote) > cite",
        citeStyle: {},
        sort: "NUMBER",
        file: void 0,
        modifyEntry: void 0,
        entryStyle: "td.bibleft\n  span.bibnumber= '['+NUMBER+']'\ntd.bibright\n  if AUTHOR\n    span.bibauthor= AUTHOR+'. '\n  if TITLE\n    span.bibtitle= TITLE+'. '\n  if YEAR\n    -var date = YEAR\n    if MONTH\n      -date = MONTH+' '+date\n    -date = date+ ', '\n  case entryType \n    when 'ARTICLE'\n      if JOURNAL\n        span.bibjournal= JOURNAL+', '\n      if VOLUME\n        -var str = VOLUME\n        if ISSUE\n          -str = VOLUME+'('+ISSUE+')'\n        if PAGES\n          -str = str+':'+PAGES\n        -str = str+ ', '\n        span.bibvolume= str\n      if date\n        span.bibdate= date\n      if ISSN\n        span.bibissn= 'ISSN '+ ISSN+', '\n    when 'BOOK'\n      if PUBLISHER\n        span.bibpublisher= PUBLISHER+', '\n      if date\n        span.bibdate= date\n  if URL\n    -var str = URL\n    if DOI\n      -str = DOI\n    span.biburl URL \n    a.biburl(href=URL)=str",
        patterns: {
          ".bib": /.html/i
        }
      });
      _.defaults(options.bib.citeStyle, {
        "default": "span.citenumber='['+NUMBER+']'"
      });
      done = this.async();
      if (!options.src) {
        options.src = [jQueryFile];
      } else {
        options.src = [jQueryFile].concat(options.src);
      }
      return this.files.forEach(function(file) {
        return jsdom.env({
          file: "./" + file.src[0],
          src: options.src,
          scripts: options.scripts,
          features: {
            FetchExternalResources: ["script", "css"],
            ProcessExternalResources: ["script"],
            MutationEvents: "2.0",
            QuerySelector: false
          },
          done: function(err, window) {
            var func, self, _i, _len, _ref;
            if (err) {
              return console.log(err);
            } else {
              self = {
                window: window,
                $: window.jQuery,
                document: window.document,
                grunt: grunt
              };
              _ref = options.functions;
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                func = _ref[_i];
                if (_.isString(func)) {
                  func = helper[func];
                }
                if (_.isFunction(func)) {
                  func.call(self, options, file.src[0]);
                }
              }
              grunt.file.write(file.dest, window.document.innerHTML);
              return done();
            }
          }
        });
      });
    });
  };

}).call(this);
