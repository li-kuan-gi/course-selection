function doGet(e) {
  const stage = getCurrentStage();
  const loginURL = ScriptApp.getService().getUrl() + `?kind=${POST_KIND.login}`;

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
  } else if (postKind === POST_KIND.select) {
    return doPostSelect(e);
  } else if (postKind === POST_KIND.selectFail) {
    return doPostSelectFail(e);
  }
}

function doPostLogin(e) {
  const data = _getPostData(e);
  const account = parseInt(data["account"]);
  const password = data["password"];

  const valid = checkPassword(account, password);

  if (valid) {
    return getPageByCurrentState(account);
  } else {
    const returnURL = ScriptApp.getService().getUrl();
    return _htmlWithData("invalid_account", { returnURL });
  }
}

function doPostSelect(e) {
  const data = _getPostData(e);
  const account = parseInt(data["account"]);
  const courses = Object.keys(data)
    .filter(key => key !== "account")
    .map(key => parseInt(key));

  try {
    const stage = getCurrentStage();
    selectCourses(account, courses, stage);
    return ResultPage(account, stage);
  } catch (e) {
    const returnURL = ScriptApp.getService().getUrl() + `?kind=${POST_KIND.selectFail}`;

    let reason;
    if (e instanceof HasSelectedError) {
      reason = SelectionFailReasons.hasSelected;
    } else if (e instanceof SomeCourseFullError) {
      reason = SelectionFailReasons.full;
    } else {
      reason = e.toString();
    }

    return _htmlWithData("select_fail", { account, returnURL, reason });
  }
}

function doPostSelectFail(e) {
  const data = _getPostData(e);
  const account = parseInt(data["account"]);
  return getPageByCurrentState(account);
}

/**
 * Return the page after login.
 * 
 * @param {Number} account 
 */
function getPageByCurrentState(account) {
  const stage = getCurrentStage();
  if (stage === 1 && !isWilling(account)) {
    const logoutURL = ScriptApp.getService().getUrl();
    return _htmlWithData("no_willing", { logoutURL });
  } else {
    const spreadSheet = SpreadsheetApp.openById(SHEET_ID);

    if (hasSelected(account, stage, spreadSheet)) {
      return ResultPage(account, stage);
    } else {
      return SelectPage(account, stage);
    }
  }
}

/**
 * Course select page.
 * 
 * @param {number} account 
 * @param {number} stage 
 */
function SelectPage(account, stage) {
  const selectURL = ScriptApp.getService().getUrl() + `?kind=${POST_KIND.select}`;
  const logoutURL = ScriptApp.getService().getUrl();
  const states = JSON.stringify(getCourseStates(account, stage));

  return _htmlWithData("Select", { account, states, stage, selectURL, logoutURL });
}

/**
 * Selection result page.
 * 
 * @param {number} account 
 * @param {number} stage 
 */
function ResultPage(account, stage) {
  const cancelURL = ScriptApp.getService().getUrl() + `?kind=${POST_KIND.cancel}`;
  const logoutURL = ScriptApp.getService().getUrl();

  const results = JSON.stringify(getResults(account));
  return _htmlWithData("Result", { account, results, stage, cancelURL, logoutURL });
}

/**
 * Get post data from the request.
 * 
 * @returns {Object<string, string>}
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
