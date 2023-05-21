/**
 * Get current stage. The valid stage values are 1 or 2. Invalid one is 0.
 * 
 * @return {Number}
 */
function getCurrentStage() {
  const stageInfos = _getStageInfos();

  const info = stageInfos.find(info => {
    const current = new Date();
    return info.begin < current && current < info.end;
  });

  return info ? info.stage : 0;
}

function getTimes() {
  const stageInfos = _getStageInfos();
  const feeInfos = _getFeeInfos();

  const stageTimes = stageInfos.map(info => [info.begin.toString(), info.end.toString()]).flat();
  const feeTimes = feeInfos.map(info => [info.begin.toString(), info.end.toString()]).flat();

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
 * @param {any} spreadSheet
 * 
 * @returns {boolean}
 */
function hasSelected(account, stage, spreadSheet) {
  const infos = getFailInfos(spreadSheet);

  return infos.some(info =>
    (info.account === account) && (info.stage === stage)
  );
}

/**
 * Get results of selection of the account.
 * 
 * @param {number} account
 * 
 * @returns {{id: number, name: string, credit: number, fee: number, stage: number}[]}
 */
function getResults(account) {
  const spreadSheet = SpreadsheetApp.openById(SHEET_ID);
  const courseInfos = getCourseInfos(spreadSheet);
  const failInfos = getFailInfos(spreadSheet);

  return failInfos
    .filter(info => (info.account === account) && (info.stage > 0))
    .map(info => {
      const id = info.classId;
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
  const spreadSheet = SpreadsheetApp.openById(SHEET_ID);
  const courseInfos = getCourseInfos(spreadSheet);
  const failInfos = getFailInfos(spreadSheet);

  const failedCourseInfos = failInfos.filter(info => info.account === account);
  return failedCourseInfos.map(info => {
    const id = info.classId;
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
  const courseInfos = getCourseInfos(spreadSheet);

  const someFull = courses.some(course => courseInfos[course].total >= courseInfos[course].maximum);

  if (hasSelected(account, stage, spreadSheet)) {
    throw new HasSelectedError();
  } else if (someFull) {
    throw new SomeCourseFullError();
  } else {
    addAccountToCourses(account, courses, stage, spreadSheet);
  }
}

/**
 * 
 * @param {number} account 
 * @param {number[]} courses 
 * @param {number} stage
 * @param {any} spreadSheet 
 */
function addAccountToCourses(account, courses, stage, spreadSheet) {
  const failSheet = spreadSheet.getSheetByName("fail");
  const values = failSheet.getRange(2, 1, failSheet.getLastRow() - 1, failSheet.getLastColumn()).getValues();
  const newStageNames = values.map(row => {
    const studentAccount = parseInt(row[0]);
    const course = parseInt(row[1]);
    const selectionStage = _transformStageFromSheet(row[2]);

    const newStageName = studentAccount === account && courses.includes(course) && selectionStage !== stage
      ? _transformStageToSheet(stage)
      : row[2];

    return [newStageName];
  });
  failSheet.getRange(2, failSheet.getLastColumn(), failSheet.getLastRow() - 1, 1).setValues(newStageNames);

  const courseSheet = spreadSheet.getSheetByName("course");
  const rows = courseSheet.getRange(2, 1, courseSheet.getLastRow() - 1, courseSheet.getLastColumn()).getValues();
  const newTotal = rows.map(row => {
    const course = parseInt(row[0]);
    const total = parseInt(row[5]);
    const newTotal = courses.includes(course) ? total + 1 : total;
    return [newTotal];
  });
  courseSheet.getRange(2, courseSheet.getLastColumn(), courseSheet.getLastRow() - 1, 1).setValues(newTotal);
}

/**
 * 
 * @param {number} account 
 * @param {number} stage 
 */
function cancelSelections(account, stage) {
  const spreadSheet = SpreadsheetApp.openById(SHEET_ID);
  _cancelSelections(account, stage, spreadSheet);
}

/**
 * 
 * @param {number} account 
 * @param {number} stage 
 * @param {any} spreadSheet
 */
function _cancelSelections(account, stage, spreadSheet) {
  const failSheet = spreadSheet.getSheetByName("fail");
  const failRows = failSheet.getRange(2, 1, failSheet.getLastRow() - 1, failSheet.getLastColumn()).getValues();
  const deletedCourses = [];
  const newStageName = failRows.map(row => {
    const studentAccount = parseInt(row[0]);
    const course = parseInt(row[1]);
    const selectionStage = _transformStageFromSheet(row[2]);

    if (!(studentAccount === account && selectionStage === stage)) {
      return [row[2]];
    } else {
      deletedCourses.push(course);
      return [_transformStageToSheet(0)];
    }
  });
  failSheet.getRange(2, failSheet.getLastColumn(), failSheet.getLastRow() - 1, 1).setValues(newStageName);

  const courseSheet = spreadSheet.getSheetByName("course");
  const courseRows = courseSheet.getRange(2, 1, courseSheet.getLastRow() - 1, courseSheet.getLastColumn()).getValues();
  const newTotal = courseRows.map(row => {
    const course = parseInt(row[0]);
    const total = parseInt(row[5]);

    return [deletedCourses.includes(course) ? total - 1 : total];
  });
  courseSheet.getRange(2, courseSheet.getLastColumn(), newTotal.length, 1).setValues(newTotal);
}

/**
 * Get all stage infos from sheet.
 * 
 * @returns {{stage: number, begin: Date, end: Date}[]}}
 */
function _getStageInfos() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const stageSheet = ss.getSheetByName("stage");
  const rawData = stageSheet
    .getRange(2, 1, stageSheet.getLastRow() - 1, stageSheet.getLastColumn())
    .getValues();
  return rawData.map(row => {
    const stage = _transformStageFromSheet(row[0]);
    const begin = new Date(row[1]);
    const end = new Date(row[2]);

    return { stage, begin, end };
  });
}

function _getFeeInfos() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const stageSheet = ss.getSheetByName("fee");
  const rawData = stageSheet
    .getRange(2, 1, stageSheet.getLastRow() - 1, stageSheet.getLastColumn())
    .getValues();
  return rawData.map(row => {
    const stage = _transformStageFromSheet(row[0]);
    const begin = new Date(row[1]);
    const end = new Date(row[2]);

    return { stage, begin, end };
  });
}

/**
 * Change the format of stage in sheet to the one in backend.
 * 
 * @param {string} stageName
 * 
 * @returns {number}
 */
function _transformStageFromSheet(stageName) {
  if (stageName === StageNameInSheet.stage1) {
    return 1;
  } else if (stageName === StageNameInSheet.stage2) {
    return 2;
  } else {
    return 0;
  }
}

function _transformStageToSheet(stage) {
  if (stage === 1) {
    return StageNameInSheet.stage1;
  } else if (stage === 2) {
    return StageNameInSheet.stage2;
  } else {
    return "";
  }
}

/**
 * Get infomation for each student.
 * 
 * @returns {{[account: number]: {password: string, willing: boolean}}}
 */
function getStudentInfos() {
  const studentSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("student");
  const rawData = studentSheet
    .getRange(2, 1, studentSheet.getLastRow() - 1, studentSheet.getLastColumn())
    .getValues();

  return rawData.reduce((infos, row) => {
    const account = parseInt(row[0]);
    const password = row[1].trim();
    const willing = !(row[2].trim() === "");
    infos[account] = { password, willing };

    return infos;
  }, {});
}

/**
 * Return raw data in "fail" sheet in google sheet.
 * 
 * @returns {{account: number, classId: number, stage: number}[]}
 */
function getFailInfos(spreadSheet) {
  const failSheet = spreadSheet.getSheetByName("fail");
  const rawData = failSheet
    .getRange(2, 1, failSheet.getLastRow() - 1, failSheet.getLastColumn())
    .getValues();

  return rawData.map(row => {
    const account = parseInt(row[0]);
    const classId = parseInt(row[1]);
    const stage = _transformStageFromSheet(row[2]);

    return { account, classId, stage };
  });
}

/**
 * Get course infomations.
 * 
 * @returns {{[id: number]: {name: string, credit: number, fee: number, maximum: number, total: number}}}
 */
function getCourseInfos(spreadSheet) {
  const courseSheet = spreadSheet.getSheetByName("course");
  const rawData = courseSheet.getRange(2, 1, courseSheet.getLastRow() - 1, courseSheet.getLastColumn()).getValues();
  return rawData.reduce((infos, row) => {
    const id = parseInt(row[0]);
    const name = row[1].trim();
    const credit = parseInt(row[2]);
    const fee = parseInt(row[3]);
    const maximum = parseInt(row[4]);
    const total = parseInt(row[5]);

    infos[id] = { name, credit, fee, maximum, total };

    return infos;
  }, {});
}