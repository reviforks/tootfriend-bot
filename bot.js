const dotenv = require('dotenv');
const Mastodon = require('mastodon-api');
const limit = require('./check-limit');

dotenv.config();

const m = new Mastodon({
    access_token: process.env.ACCESS_TOKEN,
    api_url: process.env.API_URL
});
limit.init(m);

const notice = m.stream('streaming/user');

notice.on('message', (msg) => {
    console.log('[notice]', msg);
    if(msg.event === 'notification' && msg.data.type === 'follow') {
        m.post(`accounts/${msg.data.account.id}/follow`);
    }
});

async function boost(msg) {
    console.log('[update]', msg);
    if(msg.event === 'update' && !msg.data.in_reply_to_id && !msg.data.reblog) {
        if(await limit.check(msg.data.account.acct, msg.data.account.id)) {
            await m.post(`statuses/${msg.data.id}/reblog`, {});
            limit.set(msg.data.account.acct);
        }
    }
}

m.stream('streaming/hashtag', {tag: '툿친소'}).on('message', boost);
m.stream('streaming/hashtag', {tag: '뿌친소'}).on('message', boost);
