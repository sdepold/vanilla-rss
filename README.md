# vanilla-rss [![Build Status](https://travis-ci.org/sdepold/vanilla-rss.svg?branch=master)](https://travis-ci.org/sdepold/vanilla-rss)

An easy-to-use vanilla JavaScript library to read and render RSS feeds.

## Support

Users of [jquery.rss](https://github.com/sdepold/jquery-rss), [vanilla-rss](https://github.com/sdepold/vanilla-rss) or [feedr](https://github.com/sdepold/feedr) have the chance to support funding future developments and covering the costs for the hosting of the RSS lib respective server side companion app [feedr](https://github.com/sdepold/feedr).

Every once in a while supporters will get affiliate links instead of one of the feed's entries.

If you are not interested in supporting the authors of the plugin, then you can easily opt-out of it by setting the respective `support` option. See below for further details.

Thanks in advance!

## Installation

Through npm:

```
$ npm install vanilla-rss

const RSS = require('vanilla-rss);
const rss = new RSS(
    document.querySelector("#rss-feeds"),
    "https://partnernetwork.ebay.de/epn-blog?format=rss",
    {}
);
rss.render();
```

Through cdnjs:

```

```

## Setup

    <!DOCTYPE html>
    <html>
      <head>
        <title>RSS Example</title>
        <script src="dist/rss.global.min.js"></script>
        <script>
          window.onload = function() {
            new RSS(
              document.querySelector("#rss-feeds"),
              "https://partnernetwork.ebay.de/epn-blog?format=rss"
            ).render();
          };
        </script>
      </head>
      <body>
        <div id="rss-feeds"></div>
      </body>
    </html>

Demo link for above code: http://embed.plnkr.co/WQRoCYLld162uplnz1rc/preview

Note: Moment.js is _optional_. If you include it, vanilla-rss will use it to format dates.
If you do not want to include Moment.js, you may opt for providing your own date formatting function, or for not formatting dates at all.

## Options

```javascript
const rss = new RSS(document.querySelector('#rss'), "https://jsfeeds.com/feed", {
  // how many entries do you want?
  // default: 4
  // valid values: any integer
  limit: 10,

  // want to offset results being displayed?
  // default: false
  // valid values: any integer
  offsetStart: false, // offset start point
  offsetEnd: false, // offset end point

  // will request the API via https
  // default: false
  // valid values: false, true
  ssl: true,

  // which server should be requested for feed parsing
  // the server implementation is here: https://github.com/sdepold/feedr
  // default: feedrapp.info
  // valid values: any string
  host: 'my-own-feedr-instance.com',

  // option to seldomly render ads
  // ads help covering the costs for the feedrapp server hosting and future improvements
  // default: true
  // valid values: false, true
  support: false,

  // outer template for the html transformation
  // default: "<ul>{entries}</ul>"
  // valid values: any string
  layoutTemplate: "<div class='feed-container'>{entries}</div>",

  // inner template for each entry
  // default: '<li><a href="{url}">[{author}@{date}] {title}</a><br/>{shortBodyPlain}</li>'
  // valid values: any string
  entryTemplate: '<p>{title}</p>',

  // additional token definition for in-template-usage
  // default: {}
  // valid values: any object/hash
  tokens: {
    foo: 'bar',
    bar: function(entry, tokens) { return entry.title }
  },

  // formats the date with moment.js (optional)
  // default: 'dddd MMM Do'
  // valid values: see http://momentjs.com/docs/#/displaying/
  dateFormat: 'MMMM Do, YYYY',

  // localizes the date with moment.js (optional)
  // default: 'en'
  dateLocale: 'de',

  // formats the date in whatever manner you choose. (optional)
  // this function should return your formatted date.
  // this is useful if you want to format dates without moment.js.
  // if you don't use moment.js and don't define a dateFormatFunction, the dates will
  // not be formatted; they will appear exactly as the RSS feed gives them to you.
  dateFormatFunction: function(date){},

  // a callback, which gets triggered once data was received but before the rendering.
  // this can be useful when you need to remove a spinner or something similar
  onData: function(){}
});

rss
  .on('data', (data) => {
    console.log(data.rss); // Returns the rss instance
    console.log(data.feed); // Returns the feed meta information
    console.log(data.entries); // Returns the feed entries
  })

  // Parse the RSS feed and render it accordingly to the configured layout and entry template.
  // The render call returns a promise.
  .render()

  .then(
    // A callback, which gets triggered when every entry was loaded and rendered successfully
    ()=>{},

    // A callback, which gets triggered when an error occurs
    (e)=>{}
  );
```

### Note about the host option

This library is using a Google Feed API drop-in replacement called [feedr](https://feedrapp.info). The server is hosted on a central public server and each time this plugin loads, the server is parsing the XML feed and returning the respective JSON representation. 

If you don't want to rely on the [provided server](http://feedrapp.info) and instead run your own version, you can just download feedr, install the dependencies and run it. As written above, you can specify the host which is used to parse the feeds with the `host` option.

## Templating

As seen in the options, you can specify a template in order to transform the json objects into HTML. In order to that, you can either define the outer template (which describes the html around the entries) or the entry template (which describes the html of an entry).

The basic format of those templates are:

    # layoutTemplate:
    "<outer-html>{entries}</outer-html>"

    # entryTemplate:
    "<any-html>{token1}{token2}</any-html>"

So, let's say you have specified a limit of 2, using the upper pseudo html. This will result in the following:

    <outer-html>
      <any-html>{token1}{token2}</any-html>
      <any-html>{token1}{token2}</any-html>
    </outer-html>

There are some predefined tokens:

- url: the url to the post
- author: the author of the post
- date: the publishing date
- title: the title of the post
- body: the complete content of the post
- shortBody: the shortened content of the post
- bodyPlain: the complete content of the post without html
- shortBodyPlain: the shortened content of the post without html
- teaserImage: the first image in the post's body
- teaserImageUrl: the url of the first image in the post's body
- index: the index of the current entry
- totalEntries: the total count of the entries
- feed: contains high level information of the feed (e.g. title of the website)

You can also define custom tokens using the `tokens` option:

```javascript
new RSS(document.querySelector('#rss'), url, {
  entryTemplate: "{dynamic}, {static}, {re-use}",
  tokens: {
    dynamic: function(entry, tokens){ return "dynamic-stuff: " + entry.title },
    "re-use": function(entry, tokens){ return encodeURIComponent(tokens.teaserImageUrl) },
    static: "static"
  }
}).render();
```

Please make sure to NOT define infinite loops. The following example is really BAD:

```javascript
new RSS(document.querySelector('#rss'), url, {
  entryTemplate: "{loop}",
  tokens: {
    whoops: function(entry, tokens) { return tokens.loop() }
    loop: function(entry, tokens) { return tokens.whoops() }
  }
}).render();
```

Here is a real-world example:

```javascript
new RSS(document.querySelector('#rss'), url, {
  layoutTemplate: "<table><tr><th>Title</th></tr>{entries}</table>",
  entryTemplate:  "<tr><td>{title}</td></tr>"
}).render();
```

## Filtering

The plugin also allows you to filter specific entries in order to only print them:

```javascript
new RSS(document.querySelector('#rss'), url, {
  limit: 100,
  filterLimit: 10,
  filter: function(entry, tokens) {
    return tokens.title.indexOf('my filter') > -1
  }
}).render();
```

This will request 100 entries via the Feed API and renders the first 10 matching entries.

## Authors/Contributors

- Sascha Depold ([Twitter](http://twitter.com/sdepold) | [Github](http://github.com/sdepold) | [Website](https://depold.com))
