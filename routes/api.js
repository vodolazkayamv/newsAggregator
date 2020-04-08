var express = require('express');
var router = express.Router();

const axios = require('axios');
let Parser = require('rss-parser');
let parser = new Parser({
    customFields: {
        item: ['description', 'source'],
    }
});

var HTMLParser = require('node-html-parser');


/**
 * Stub API
 */
router.get('/', (request, response) => {
    // read commit object properties
    response.status(200).json({ answer: "Hello, world! I'm working as expected!" });
});

function decodeEntities(encodedString) {
    var translate_re = /&(nbsp|amp|quot|lt|gt);/g;
    var translate = {
        "nbsp":" ",
        "amp" : "&",
        "quot": "\"",
        "lt"  : "<",
        "gt"  : ">"
    };
    return encodedString.replace(translate_re, function(match, entity) {
        return translate[entity];
    }).replace(/&#(\d+);/gi, function(match, numStr) {
        var num = parseInt(numStr, 10);
        return String.fromCharCode(num);
    });
}

/**
 * Get Google News
 */

function getGNews(topic, language, region, callback) {
    let rssURL = 'https://news.google.com/rss/topics/' + topic + '?hl=' + language + '&gl=' + region;

    parseRSSvia(rssURL, callback)
}

function getGNewsVia(url, callback) {
    parseRSSvia(url, callback)
}

function parseRSSvia (rssURL, callback) {
    (async () => {

        let feed = await parser.parseURL(rssURL);
        console.log(feed.title);

        var news = [];
        feed.items.forEach(item => {
            let headline = {
                'title' :item.title,
                'url' : item.link,
                'pubDate' : item.pubDate,
                'isoDate' : item.isoDate,
                'source' : item.source,
            };
            var root = HTMLParser.parse(decodeEntities(item.content));
            let list = root.querySelectorAll('li');

            var BreakException = {};
            let relatedArticles = [];
            try {
                list.forEach(listItem => {
                    let head = listItem.querySelector('a');
                    let title = head.rawText;
                    let url = head.getAttribute("href");
                    let sourceItem = listItem.querySelector('font');
                    if (sourceItem == null) {
                        throw BreakException;
                    }
                    let source = sourceItem.rawText;
                    let article = {'title': title, 'url': url, 'source': source};
                    relatedArticles.push(article);
                });
            } catch (e) {
                if (e !== BreakException) throw e;
            }
            news.push({'headline': headline, 'related' : relatedArticles});
        });

        let response = {
            'title' : feed.title,
            'description' : feed.description,
            'link' : feed.link,
            'language' : feed.language,
            'copyright' : feed.copyright,
            'lastBuildDate' : feed.lastBuildDate,
            'rssURL' : feed.rssURL,
            'news' : news
        };
        callback(response);
    })();
}

router.get('/gnews', (req, res) => {
    const language = req.query.lang;
    const region = req.query.reg;
    let rssURL = 'https://news.google.com/news/rss' + '?hl=' + language + '&gl=' + region;

    getGNewsVia(rssURL, function (news) {
        res.status(200).json(news)
    })
});

router.get('/gnews/covid', (req, res) => {
    const language = req.query.lang;
    const region = req.query.reg;

    let topic = 'CAAqIggKIhxDQkFTRHdvSkwyMHZNREZqY0hsNUVnSnlkU2dBUAE';

    getGNews(topic, language, region, function (news) {
        res.status(200).json(news)
    })

});

router.get('/gnews/covid-pandemia', (req, res) => {

    const language = req.query.lang;
    const region = req.query.reg;

    let topic = 'CAAqKAgKIiJDQkFTRXdvTkwyY3ZNVEZtY2pFMWRERTFhQklDY25Vb0FBUAE';

    getGNews(topic, language, region, function (news) {
        res.status(200).json(news)
    })
});

module.exports = router;