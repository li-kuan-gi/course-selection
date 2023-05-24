/**
 * Get current stage. The valid stage values are 1 or 2. Invalid one is 0.
 * 
 * @return {Number}
 */
function getCurrentStage() {
  const stageInfos = getStageInfos();

  const info = stageInfos.find(info => {
    const current = new Date();
    return info.begin < current && current < info.end;
  });

  return info ? info.stage : 0;
}

function getTimes() {
  const stageInfos = getStageInfos();
  const feeInfos = getFeeInfos();

  const stageTimes = stageInfos.map(info => [info.begin.toString(), info.end.toString()]);
  const feeTimes = feeInfos.map(info => [info.begin.toString(), info.end.toString()]);

  return [stageTimes, feeTimes];
}

/**
 * Check if the password for the account is valid.
 * 
 * @param {Number} account
 * @param {String} password
 * 
 * @return {Boolean}
 */
function checkPassword(account, password) {
  const info = getStudentInfos()[account];
  return info ? info.password === password : false;
}

/**
 * Check if the account has written "willing form".
 * 
 * @param {Number} account 
 * 
 * @returns {boolean}
 */
function isWilling(account) {
  return getStudentInfos()[account].willing;
}

/**
 * Check if the account has selected any courses in this stage.
 * 
 * @param {number} account
 * @param {number} stage
 * 
 * @returns {boolean}
 */
function hasSelected(account, stage) {
  const spreadSheet = SpreadsheetApp.openById(SHEET_ID);
  return _hasSelected(account, stage, spreadSheet);
}

/**
 * Get results of selection of the account.
 * 
 * @param {number} account
 * 
 * @returns {{id: number, name: string, credit: number, fee: number, stage: number}[]}
 */
function getResults(account) {
  const courseInfos = getCourseInfos();
  const failInfos = getFailInfos();

  return failInfos
    .filter(info => (info.account === account) && (info.stage > 0))
    .map(info => {
      const id = info.course;
      const courseInfo = courseInfos[id];
      const name = courseInfo.name;
      const credit = courseInfo.credit;
      const fee = courseInfo.fee;
      const stage = info.stage;

      return { id, name, credit, fee, stage };
    });
}

/**
 * Get states of courses for selection.
 * 
 * @param {number} account
 * @param {number} stage - current stage
 * 
 * @returns {{id: number, name: string, credit: number, fee: number, hasBeenSelected: boolean, full: boolean}[]}
 */
function getCourseStates(account, stage) {
  const courseInfos = getCourseInfos();
  const failInfos = getFailInfos();

  const failedCourseInfos = failInfos.filter(info => info.account === account);
  return failedCourseInfos.map(info => {
    const id = info.course;
    const name = courseInfos[id].name;
    const credit = courseInfos[id].credit;
    const fee = courseInfos[id].fee;
    const hasBeenSelected = (info.stage > 0) && (info.stage < stage);
    const full = !(courseInfos[id].total < courseInfos[id].maximum);

    return { id, name, credit, fee, hasBeenSelected, full };
  });
}

/**
 * 
 * @param {number} account 
 * @param {number[]} courses 
 * @param {number} stage 
 */
function selectCourses(account, courses, stage) {
  const spreadSheet = SpreadsheetApp.openById(SHEET_ID);

  if (_hasSelected(account, stage, spreadSheet)) {
    throw new HasSelectedError();
  } else if (_isSomeFull(courses, spreadSheet)) {
    throw new SomeCourseFullError();
  } else {
    addAccountToCourses(account, courses, stage, spreadSheet);
  }
}

/**
 * 
 * @param {number} account 
 * @param {number} stage 
 */
function cancelSelections(account, stage) {
  const spreadSheet = SpreadsheetApp.openById(SHEET_ID);
  if (_hasSelected(account, stage, spreadSheet)) {
    removeAccountFromSelections(account, stage, spreadSheet);
  }
}

/**
 * Internal implementation of hasSelected.
 * 
 * @param {number} account
 * @param {number} stage
 * @param {any} spreadSheet
 * 
 * @returns {boolean}
 */
function _hasSelected(account, stage, spreadSheet) {
  const infos = getFailInfos(spreadSheet);

  return infos.some(info =>
    (info.account === account) && (info.stage === stage)
  );
}

/**
 * Determine if some course is full.
 * 
 * @param {number[]} courses 
 * @param {Spreadsheet} spreadSheet 
 * 
 * @returns {boolean}
 */
function _isSomeFull(courses, spreadSheet) {
  const failInfos = getFailInfos(spreadSheet);
  const courseInfos = getCourseInfos();
  return courses.some(course => _isFull(course, failInfos, courseInfos));
}

/**
 * 
 * @param {number} course 
 * @param {{account: number, course: number, stage: number}[]} failInfos 
 * @param {{[id: number]: {maximum: number}}} courseInfos
 * 
 * @returns {boolean}
 */
function _isFull(course, failInfos, courseInfos) {
  const total = failInfos.reduce((total, info) => {
    if (info.course === course && info.stage !== 0) {
      total = total + 1;
    }
    return total;
  }, 0);

  return total >= courseInfos[course].maximum;
}