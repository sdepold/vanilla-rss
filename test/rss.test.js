const { JSDOM } = require("jsdom");
const sampleFeed = require("fs")
  .readFileSync(__dirname + "/fixtures/contentful.rss.xml")
  .toString();
const sampleFeedParsed = require("./fixtures/contentful.rss.json");
const { expect } = require("chai");
const fetch = require("node-fetch");
const moment = (global.moment = require("moment"));
const { stub, spy } = require("sinon");
const { version } = require("../package.json");
const RSS = require("../dist/rss.node.min");

describe("rss", () => {
  let $, element, originalGetJson, window;

  const feedUrl = "https://www.contentful.com/blog/feed.xml";
  const fakeGetJson = (rss, content) => {
    rss._fetchFeed = async () => ({
      responseData: {
        feed: {
          entries: [
            {
              content: content,
              contentSnippet: content
            }
          ]
        }
      }
    });
    return rss;
  };

  before(() => {
    const jsdom = new JSDOM(`<!DOCTYPE html>`);

    global.window = window = jsdom.window;
    global.document = window.document;
    global.fetch = fetch;
  });

  beforeEach(() => {
    element = window.document.createElement("div");
    window.document.body.appendChild(element);
  });

  afterEach(() => {
    if (typeof originalGetJson === "function") {
      $.getJSON = originalGetJson;
      originalGetJson = null;
    }
  });

  it("renders an unordered list by default", () => {
    return new RSS(element, feedUrl, {}).render().then(function() {
      var renderedContent = element.innerHTML.replace(/\n/g, "");

      expect(renderedContent).to.match(/<ul>.*<\/ul>/);
    });
  });

  it("renders 2 list entries if limit is set to 2", () => {
    return new RSS(element, feedUrl, {
      limit: 2
    })
      .render()
      .then(() => {
        expect(element.querySelectorAll("li").length).to.equal(2);
      });
  });

  it("renders the defined entry template", () => {
    return new RSS(element, feedUrl, {
      limit: 1,
      entryTemplate: "<li>foo</li>"
    })
      .render()
      .then(() => {
        var renderedContent = element.outerHTML
          .split("\n")
          .map(s => s.trim())
          .join("")
          .trim();

        expect(renderedContent).to.match(/<ul><li>foo<\/li><\/ul>/);
      });
  });

  it("renders the defined layout template", () => {
    return new RSS(element, feedUrl, {
      limit: 1,
      layoutTemplate: "foo<ul>{entries}</ul>bar"
    })
      .render()
      .then(() => {
        var renderedContent = element.innerHTML.replace(/\n/g, "");

        expect(renderedContent).to.match(/foo<ul>.*<\/ul>/);
      });
  });

  it("supports custom tokens", () => {
    return new RSS(element, feedUrl, {
      limit: 1,
      entryTemplate: "<li>{myCustomStaticToken} {myCustomDynamicToken}</li>",
      tokens: {
        myCustomStaticToken: "static",
        myCustomDynamicToken: function() {
          return "dynamic";
        }
      }
    })
      .render()
      .then(() => {
        var renderedContent = element.outerHTML
          .split("\n")
          .map(s => s.trim())
          .join("")
          .trim();

        expect(renderedContent).to.match(
          new RegExp("<ul><li>static dynamic</li></ul>")
        );
      });
  });

  it("removes p-tags but not the content", () => {
    const rss = new RSS(element, feedUrl, {
      limit: 1,
      entryTemplate: "<li>{bodyPlain}</li>"
    });

    fakeGetJson(rss, "<p>May the fourth be with you!</p>");

    return rss.render().then(() => {
      var renderedContent = element.innerHTML
        .split("\n")
        .map(function(s) {
          return s.trim();
        })
        .join("")
        .trim();

      expect(renderedContent).to.match(
        /<ul><li>May the fourth be with you!<\/li><\/ul>/
      );
    });
  });

  it("calls the error callback if something went wrong", () => {
    return new Promise((resolve, reject) => {
      new RSS(element, "https://google.com").render().then(reject, resolve);
    });
  });

  it("calls the success callback", () => {
    return new RSS(element, feedUrl, { limit: 1 }).render();
  });

  it("renders the defined entry template in the layout template", () => {
    return new RSS(element, feedUrl, {
      limit: 1,
      entryTemplate: "<li>bazinga</li>",
      layoutTemplate: "<ul><li>topic</li>{entries}</ul>"
    })
      .render()
      .then(() => {
        var renderedContent = element.innerHTML.replace(/\n/g, "");

        expect(renderedContent).to.equal(
          "<ul><li>topic</li><li>bazinga</li></ul>"
        );
      });
  });

  it("renders when layout template only contains the entries token", () => {
    const table = document.createElement("table");
    element.appendChild(table);

    return new RSS(table, feedUrl, {
      limit: 1,
      layoutTemplate: "{entries}",
      entryTemplate: "<tr><td>{title}</td></tr>"
    })
      .render()
      .then(() => {
        var renderedContent = table.outerHTML.replace(/\n/g, "");

        expect(renderedContent).to.match(
          /<table><tbody><tr><td>.*<\/td><\/tr><\/tbody><\/table>/
        );
      });
  });

  it("sends the lib version during feedrapp requests", () => {
    const rss = new RSS(element, feedUrl, { ssl: true });
    const fetchFeedSpy = spy(rss, "_fetchFeed");

    return rss.render().then(() => {
      expect(fetchFeedSpy.getCall(0).args[0]).to.match(
        new RegExp(`version=${version}`)
      );
      fetchFeedSpy.restore();
    });
  });

  describe("support", () => {
    it("sends the enabled support by default", () => {
      const rss = new RSS(element, feedUrl);
      const fetchFeedSpy = spy(rss, "_fetchFeed");

      return rss.render().then(() => {
        expect(fetchFeedSpy.getCall(0).args[0]).to.match(/support=true/);
        fetchFeedSpy.restore();
      });
    });

    it("turns of support if configured respectively", () => {
      const rss = new RSS(element, feedUrl, { support: false });
      const fetchFeedSpy = spy(rss, "_fetchFeed");

      return rss.render().then(() => {
        expect(fetchFeedSpy.getCall(0).args[0]).to.match(/support=false/);
        fetchFeedSpy.restore();
      });
    });
  });

  describe("ssl", () => {
    it("rewrites the host to feedrapp.info if not specified differently", () => {
      const rss = new RSS(element, feedUrl);
      const fetchFeedSpy = spy(rss, "_fetchFeed");

      return rss.render().then(() => {
        expect(fetchFeedSpy.getCall(0).args[0]).to.match(
          /https:\/\/www\.feedrapp\.info/
        );
        fetchFeedSpy.restore();
      });
    });

    it("uses feedrapp.info if ssl is turned off", () => {
      const rss = new RSS(element, feedUrl, { ssl: false });
      const fetchFeedSpy = spy(rss, "_fetchFeed");

      return rss.render().then(() => {
        expect(fetchFeedSpy.getCall(0).args[0]).to.match(
          /http:\/\/www\.feedrapp\.info/
        );
        fetchFeedSpy.restore();
      });
    });

    it("does not overwrite the host if it was specified manually", () => {
      const rss = new RSS(element, feedUrl, {
        ssl: true,
        host: "foo.com",
        entryTemplate: "<div></div>"
      });
      const fetchFeedSpy = spy(fakeGetJson(rss, "hello"), "_fetchFeed");

      return rss.render().then(() => {
        expect(fetchFeedSpy.getCall(0).args[0]).to.match(/https:\/\/foo\.com/);
        fetchFeedSpy.restore();
      });
    });
  });

  describe("tokens", () => {
    describe("feed", () => {
      it("returns all feed tokens but entries", () => {
        return new RSS(element, feedUrl, {
          limit: 1,
          entryTemplate: "<li>{something}</li>",
          layoutTemplate: "<ul>{entries}</ul>",
          tokens: {
            something: function(entry, tokens) {
              expect(tokens.feed.entries).to.be.undefined;
              return tokens.feed.title;
            }
          }
        })
          .render()
          .then(() => {
            var renderedContent = element.innerHTML.replace(/\n/g, "");

            expect(renderedContent).to.equal(
              "<ul><li>Contentful - Blog</li></ul>"
            );
          });
      });
    });

    describe("bodyPlain", () => {
      describe("XSS", () => {
        let rss;

        beforeEach(() => {
          rss = new RSS(element, feedUrl, {
            limit: 1,
            entryTemplate: "<li>{bodyPlain}</li>"
          });
        });
        afterEach(() => {
          return rss.render().then(() => {
            const renderedContent = element.innerHTML
              .split("\n")
              .map(s => s.trim())
              .join("")
              .trim();
            expect(renderedContent).to.match(/<ul><li><\/li><\/ul>/);
          });
        });

        it("removes script tags if they are plain", () => {
          fakeGetJson(rss, "<script>alert(1)</script>");
        });

        it("removes script tags with attributes", () => {
          fakeGetJson(rss, '<script type="text/javascript">alert(1)</script>');
        });

        it("removes script tags with capital letters", () => {
          fakeGetJson(
            rss,
            "<SCRIPT SRC=http://ha.ckers.org/xss.js>hallo</SCRIPT>"
          );
        });

        it("strips unsecure image tags with embedded linebreak", () => {
          fakeGetJson(rss, "<IMG SRC=\"jav&#x09;ascript:alert('XSS');\">");
        });

        it("strips unsecure image tags with embedded carriage return", () => {
          fakeGetJson(rss, "<IMG SRC=\"jav&#x0D;ascript:alert('XSS');\">");
        });

        it("strips unsecure image tags with real carriage return", () => {
          fakeGetJson(
            rss,
            "<IMG\nSRC\n=\n\"\nj\na\nv\na\ns\nc\nr\ni\np\nt\n:\na\nl\ne\nr\nt\n(\n'\nX\nS\nS\n'\n)\n\"\n>\n"
          );
        });

        it("strips unsecure image tags with \0 in 'javascript'", () => {
          fakeGetJson(rss, '<IMG SRC=java\0script:alert("XSS")>');
        });

        it("strips unsecure image tags with meta char before javascript tag", () => {
          fakeGetJson(rss, "<IMG SRC=\" &#14;  javascript:alert('XSS');\">");
        });

        it("strips script/xss tags", () => {
          fakeGetJson(
            rss,
            '<SCRIPT/XSS SRC="http://ha.ckers.org/xss.js"></SCRIPT>'
          );
        });

        it("strips script/src tags", () => {
          fakeGetJson(
            rss,
            '<SCRIPT/SRC="http://ha.ckers.org/xss.js"></SCRIPT>'
          );
        });

        it("strips unsecure body tag", () => {
          fakeGetJson(
            rss,
            '<BODY onload!#$%&()*~+-_.,:;?@[/|]^`=alert("XSS")>'
          );
        });

        it("strips the unclosed script tag", () => {
          fakeGetJson(rss, "<SCRIPT SRC=http://ha.ckers.org/xss.js?<B>");
        });

        it("strips unclosed script tags without protocol in src", () => {
          fakeGetJson(rss, "<SCRIPT SRC=//ha.ckers.org/.j>");
        });

        it("strips script tags with line breaks in between", () => {
          fakeGetJson(rss, "<SCRIPT>a=/XSS/\nalert(a.source)</SCRIPT>");
        });

        it("strips script tags when the come after a closing title tag", () => {
          fakeGetJson(rss, '</TITLE><SCRIPT>alert("XSS");</SCRIPT>');
        });

        it("strips input tags with javascript in src attribute", () => {
          fakeGetJson(
            rss,
            '<INPUT TYPE="IMAGE" SRC="javascript:alert(\'XSS\');">'
          );
        });

        it("strips body tag with background attribute", () => {
          fakeGetJson(rss, "<BODY BACKGROUND=\"javascript:alert('XSS')\">");
        });

        it("strips body tag with onload attribute", () => {
          fakeGetJson(rss, "<BODY ONLOAD=alert('XSS')>");
        });

        it("strips tags with html quotation", () => {
          fakeGetJson(
            rss,
            '<SCRIPT a=">" SRC="http://ha.ckers.org/xss.js"></SCRIPT>'
          );
        });
      });

      describe("XSS 2", () => {
        var tests = [
          {
            name: "strips unsecure image tags with \0 in 'script'",
            test: '<SCR\0IPT>alert("XSS")</SCR\0IPT>',
            result: 'alert("XSS")'
          },
          {
            name: "strips script tags with extraneous open brackets",
            test: '<<SCRIPT>alert("XSS");//<</SCRIPT>',
            result: "&lt;"
          },
          {
            name: "strips half open html/javascript xss vector",
            test: "<IMG SRC=\"javascript:alert('XSS')\"",
            result: " SRC=\"javascript:alert('XSS')\""
          },
          {
            name: "strips half open iframe tags",
            test: "<iFraMe SRC=\"javascript:alert('XSS')\"",
            result: " SRC=\"javascript:alert('XSS')\""
          },
          {
            name: "strips half open iframe tag with double open bracket",
            test: "<iframe src=http://ha.ckers.org/scriptlet.html <",
            result: " src=http://ha.ckers.org/scriptlet.html &lt;"
          },
          {
            name: "strips meta tags with content",
            test:
              '<META HTTP-EQUIV="Link" Content="<http://ha.ckers.org/xss.css>; REL=stylesheet">',
            result: '; REL=stylesheet"&gt;'
          }
        ];

        tests.forEach(test => {
          it(test.name, () => {
            const rss = new RSS(element, feedUrl, {
              limit: 1,
              entryTemplate: "<li>{bodyPlain}</li>"
            });

            fakeGetJson(rss, test.test);

            return rss.render().then(() => {
              var renderedContent = element.innerHTML
                .split("\n")
                .map(s => s.trim())
                .join("")
                .trim();

              expect(renderedContent).to.equal(
                "<ul><li>" + test.result + "</li></ul>"
              );
            });
          });
        });
      });
    });

    describe("date", () => {
      it("renders english dates by default", () =>{
          return new RSS(element, feedUrl, {})
          .render()
          .then(() => {
            var renderedContent = element.innerHTML.replace(/\n/g, "");

            expect(renderedContent).to.match(
              /<a href=".*">\[.*(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday) .*\].*<\/a>/
            );
          });
      });

      it("renders german dates if enabled", () =>{
        return new RSS(element, feedUrl, { dateLocale: "de" })
          .render()
          .then(() => {
            var renderedContent = element.innerHTML.replace(/\n/g, "");

            expect(renderedContent).to.match(
              /<a href=".*">\[.*(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag).*\].*<\/a>/
            );
          });
      });
    });
  });
});
