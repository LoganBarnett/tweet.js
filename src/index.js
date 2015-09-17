'use strict';

const config = require('../local.config');

const irc = require('irc');
const twitter = require('twitter');
const R = require('ramda');

const delayPerMessage = 1500;

const bot = new irc.Client(config.irc.server, config.irc.botName, {
    channels: config.irc.channels
  , autoConnect: true
});

bot.addListener('error', (message) => {
  console.error('error: ', message);
});

bot.addListener('join', (channel, nick, message) => {
  if(nick == bot.nick) {
    console.log('Detected that I have joined. Getting tweets...');
    bot.say(channel, 'getting tweets');
    getTweets();
  }
  else {
    console.log('Someone else joined (' + nick + ')');
  }
});

bot.addListener('notice', (nick, to, text, message) => {
  console.log('notice', nick, to, text);
});

bot.addListener('nick', (old, current, channels, message) => {
  console.log('nick change', old, current, channels);
});

bot.addListener('raw', (message) => {
  console.log('[irc-server]', message);
});

const getTweets = () => {
  twitterClient.get('statuses/home_timeline', (error, tweets, response) => {
    if(error) {
      console.error('Error getting home timeline', error);
    }
    else {
      console.log('got tweets, sending to irc');
      sayTweets(R.bind(bot.say, bot), config.irc.channels, tweets);
    }
  });
};
const twitterClient = new twitter({
    consumer_key: config.twitter.consumerKey
  , consumer_secret: config.twitter.consumerSecret
  , access_token_key: config.twitter.accessTokenKey
  , access_token_secret: config.twitter.accessTokenSecret
});

const sayTweets = (say, channels, tweets) => {
  console.log('say', say);
  console.log('channels', channels);
  const says = R.map((c) => {
    console.log('binding channel to say', c);
    return R.partial(say, c);
  }, channels);
  console.log('says', says);
  console.log('says', says[0]);
  const texts = R.map((t) => t.user.screen_name + '(' + t.user.name + ')' + ': ' + t.text, tweets);
  R.forEach((s) => {
    // need to stagger the says or we get booted.
    for(let i = 0; i < texts.length; ++i) {
      const text = texts[i];
      setTimeout(R.partial(s, text), i * delayPerMessage);
      // s(i * delayPerMessage, text);
    }
  }, says);
  console.log('done queueing tweets to irc');
};
