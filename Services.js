/**
 * Get current stage. The valid stage values are 1 or 2. Invalid one is 0.
 * 
 * @return {Number}
 */
function getCurrentStage() {

  const stageInfos = _getStageInfos();

  const info = stageInfos.find(info => {
    const current = new Date();
    return info.begin < current && info.end;
  });

  return info ? info.stage : 0;
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
  const rawData = _getStudentRawData();

  const passwords = rawData.reduce((passwords, row) => {
    const account = parseInt(row[0]);
    const password = row[1];

    passwords[account] = password;

    return passwords;
  }, {});

  return password === passwords[account];
}

/**
 * Check if the account has written "willing form".
 * 
 * @param {Number} account 
 * 
 * @returns {boolean}
 */
function isWilling(account) {
  const rawData = _getStudentRawData();

  const willings = rawData.reduce((willings, row) => {
    const account = parseInt(row[0]);
    const willing = row[2].trim();

    willings[account] = !(willing === "");
    return willings;
  }, {});

  return willings[account];
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
  const rawData = _getFailRawData();

  return rawData.some(row =>
    (parseInt(row[0]) === account) && (_transformStageInSheet(row[2]) === stage)
  );
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
    const stage = _transformStageInSheet(row[0]);
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
function _transformStageInSheet(stageName) {
  if (stageName === StageNameInSheet.stage1) {
    return 1;
  } else if (stageName === StageNameInSheet.stage2) {
    return 2;
  } else {
    return 0;
  }
}

/**
 * Return the student raw data, stored in google sheet (student sheet).
 * 
 * @returns {string[][]}
 */
function _getStudentRawData() {
  const studentSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("student");
  return studentSheet
    .getRange(2, 1, studentSheet.getLastRow() - 1, studentSheet.getLastColumn())
    .getValues();
}

/**
 * Return raw data in "fail" sheet in google sheet.
 * 
 * @returns {string[][]}
 */
function _getFailRawData() {
  const failSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("fail");
  return failSheet
    .getRange(2, 1, failSheet.getLastRow() - 1, failSheet.getLastColumn())
    .getValues();
}