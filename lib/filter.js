const REG_EXP_RE = /^\/(.+)\/(i)?$/;
let filterList;

const toRegExp = (regExp) => {
  regExp = REG_EXP_RE.test(regExp);
  try {
    regExp = regExp && new RegExp(RegExp.$1, RegExp.$2);
  } catch (e) {
    regExp = null;
  }
  return regExp;
};

exports.update = function(text) {
  text = typeof text === 'string' ? text.trim() : '';
  if (!text) {
    filterList = null;
    return;
  }
  text = text.substring(0, 3072).split(/\r\n|\r|\n/);
  text.forEach((str) => {
    const not = str[0] === '!';
    if (not) {
      str = str.substring(1);
    }
    str = str.trim();
    if (!str) {
      return;
    }
    const pattern = toRegExp(str);
    filterList = filterList || [];
    filterList.push({ not, pattern, str });
  });
};

exports.check = function(url) {
  if (!filterList) {
    return true;
  }
  if (!url || typeof url !== 'string') {
    return false;
  }
  for (let i = 0, len = filterList.length; i < len; i++) {
    const { not, pattern, str } = filterList[i];
    const result = pattern ? pattern.test(url) : url.indexOf(str) !== -1;
    if (not ? !result : result) {
      return true;
    }
  }
};

exports.getRightBody = function(text) {
  const row = {};
  const obj = JSON.parse(text);
  if (Object.prototype.hasOwnProperty.call(obj, 'data')) {
    const urlList = [];
    let content = '';
    const objData = obj.data[0];
    row.nickname = objData.user.nickname;
    const note = objData.note_list[0];
    row.title = note.title;
    row.desc = note.desc;
    let title = row.nickname;
    if (row.title.trim() !== '') {
      title = row.title;
    }
    row.name = title;
    content = `### ${title}\n\n##### 作者:**${row.nickname}**\n\n---\n\n${row.desc}\n\n---\n\n`;
    note.images_list.forEach((arr) => {
      urlList.push(arr.url);
      content = content.concat(`![](${arr.url})\n`);
    });
    row.images_list = urlList;
    row.content = content;
    // json.push(row);
  }
  return row;
};
