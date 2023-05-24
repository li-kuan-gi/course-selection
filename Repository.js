/**
 * 
 * @param {number} account 
 * @param {number[]} courses 
 * @param {number} stage
 * @param {any} spreadSheet 
 */
function addAccountToCourses(account, courses, stage, spreadSheet) {
  const failInfos = getFailInfos(spreadSheet);
  const start = failInfos.findIndex(info => info.account === account) + 2;
  const newRecords = failInfos
    .filter(info => info.account === account)
    .map(info => {
      if (courses.includes(info.course)) {
        return [_transformStageToSheet(stage)];
      } else {
        return [_transformStageToSheet(info.stage)];
      }
    });
  _updateSelectionRecords(start, newRecords, spreadSheet);
}

/**
 * 
 * @param {number} account 
 * @param {number} stage 
 * @param {any} spreadSheet
 */
function removeAccountFromSelections(account, stage, spreadSheet) {
  const failInfos = getFailInfos(spreadSheet);
  const start = failInfos.findIndex(info => info.account === account) + 2;
  const newRecords = failInfos
    .filter(info => info.account === account)
    .map(info => {
      if (info.stage === stage) {
        return [_transformStageToSheet(0)];
      } else {
        return [_transformStageToSheet(info.stage)];
      }
    });
  _updateSelectionRecords(start, newRecords, spreadSheet);
}

/**
 * Get all stage infos from sheet.
 * 
 * @returns {{stage: number, begin: Date, end: Date}[]}}
 */
function getStageInfos() {
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

function getFeeInfos() {
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
 * @param {SpreadSheet} spreadSheet
 * 
 * @returns {{account: number, course: number, stage: number}[]}
 */
function getFailInfos(spreadSheet = SpreadsheetApp.openById(SHEET_ID)) {
  const failSheet = spreadSheet.getSheetByName("fail");
  const rawData = failSheet
    .getRange(2, 1, failSheet.getLastRow() - 1, failSheet.getLastColumn())
    .getValues();

  return rawData.map(row => {
    const account = parseInt(row[0]);
    const course = parseInt(row[1]);
    const stage = _transformStageFromSheet(row[2]);

    return { account, course, stage };
  });
}

/**
 * Get course infomations.
 * 
 * @returns {{[id: number]: {name: string, credit: number, fee: number, maximum: number, total: number}}}
 */
function getCourseInfos() {
  const spreadSheet = SpreadsheetApp.openById(SHEET_ID);
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

/**
 * 
 * @param {number} start - the start index of row to update
 * @param {string[]} records - updated records to be written in
 * @param {SpreadSheet} spreadSheet 
 */
function _updateSelectionRecords(start, records, spreadSheet) {
  const sheet = spreadSheet.getSheetByName("fail");

  sheet.getRange(start, 3, records.length, 1).setValues(records);
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
