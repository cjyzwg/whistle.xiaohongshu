const fs = require('fs');
const path = require('path');
const { check: checkFilter, update: updateFilter, getRightBody: getBodyFilter } = require('./filter');

const MAX_LENGTH = 10;
const noop = () => {};
let index = 0;
const getIndex = () => {
  if (index > 999) {
    index = 0;
  }
  return index++;
};


module.exports = (server, { storage, config }) => {
  let sessions = [];
  let timer;
  const username = config.username ? `${encodeURIComponent(config.username)}_` : '';
  const writeSessions = (dir) => {
    try {
      // const text = JSON.stringify(sessions.slice(), null, '  ');
      const name = `${Date.now()}_${getIndex()}`;
      let json = { 'name': name, 'content': name };
      let text = '  ';
      if (sessions.slice().length>0) {
        const bodyString = sessions.slice()[0].res.body;
        json = getBodyFilter(bodyString);
        console.log(json);
        text = json.content;
        console.log(text);
      }
      console.log(text);

      sessions = [];
      // dir = path.resolve(dir, `${username}${Date.now()}_${getIndex()}.txt`);
      dir = path.resolve(dir, `${username}${json.name}.md`);
      fs.writeFile(dir, text, (err) => {
        if (err) {
          fs.writeFile(dir, text, noop);
        }
      });
    } catch (e) {}
  };
  updateFilter(storage.getProperty('filterText'));
  server.on('request', (req) => {
    // filter
    const active = storage.getProperty('active');
    if (!active) {
      return;
    }
    const dir = storage.getProperty('sessionsDir');
    if (!dir || typeof dir !== 'string') {
      sessions = [];
      return;
    }
    if (!checkFilter(req.originalReq.url)) {
      return;
    }
    req.getSession((s) => {
      if (!s) {
        return;
      }
      clearTimeout(timer);
      sessions.push(s);
      if (sessions.length >= MAX_LENGTH) {
        writeSessions(dir);
      } else {
        // 10秒之内没满10条强制写入
        timer = setTimeout(() => writeSessions(dir), 10000);
      }
    });
  });
};
