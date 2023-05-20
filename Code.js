function doGet(e) {
  const stage = getCurrentStage();
  const loginURL = ScriptApp.getService().getUrl() + "?kind=login";

  if (stage === 0) {
    return _htmlWithData("wrong_time");
  } else {
    return _htmlWithData("Login", { stage, loginURL });
  }
}

function doPost(e) {
  const postKind = e.parameter["kind"];

  if (postKind === POST_KIND.login) {
    return doPostLogin(e);
  }
}

function doPostLogin(e) {
  const data = _getPostData(e);
  const account = parseInt(data["account"]);
  const password = data["password"];

  const valid = checkPassword(account, password);

  if (valid) {
    return pageAfterLogin(account);
  } else {
    const returnURL = ScriptApp.getService().getUrl();
    return _htmlWithData("invalid_account", { returnURL });
  }
}

/**
 * Return the page after login.
 * 
 * @param {Number} account 
 */
function pageAfterLogin(account) {
  const stage = getCurrentStage();
  if (stage === 1 && !isWilling(account)) {
    const logoutURL = ScriptApp.getService().getUrl();
    return _htmlWithData("no_willing", { logoutURL });
  } else if (hasSelected(account, stage)) {
    return ResultPage(account);
  } else {
    return SelectPage(account, stage);
  }
}

/**
 * Course select page.
 * 
 * @param {number} account 
 * @param {number} stage 
 */
function SelectPage(account, stage) {
  return _htmlWithData("Select");
}

/**
 * Selection result page.
 * 
 * @param {number} account 
 */
function ResultPage(account) {
  return _htmlWithData("Result");
}

/**
 * Get post data from the request.
 * 
 * @returns {Object<string, any>}
 */
function _getPostData(e) {
  const contents = e.postData.contents;
  return contents.split('&').reduce((data, row) => {
    const key = row.split('=')[0];
    const value = row.split('=')[1];
    data[key] = value;
    return data;
  }, {});
}

function _htmlWithData(filename, data = {}) {
  const template = HtmlService.createTemplateFromFile(filename);

  Object.entries(data).forEach((entry) => {
    const key = entry[0];
    const value = entry[1];
    template[key] = value;
  });

  return template.evaluate();
}
