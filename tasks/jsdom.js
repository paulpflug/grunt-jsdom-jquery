(function() {
  var jQuery, jsdom, _;

  jsdom = require("jsdom");

  jQuery = require("jquery");

  _ = require("lodash");

  module.exports = function(grunt) {
    var helper;
    helper = require("./lib/jsdom-lib")(grunt);
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
        functions: ["toc", "tot", "tof", "bib"]
      });
      _.defaults(options.toc, {
        selector: "#toc",
        chapter: ":not(.front-matter) > h2",
        section: "h3",
        subsection: "h4"
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
      return this.files.forEach(function(file) {
        return jsdom.env({
          file: "./" + file.src[0],
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
                $: jQuery(window),
                document: window.document
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
