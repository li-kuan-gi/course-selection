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
  const passwords = _getPasswordsForEachAccount();

  return password === passwords[account];
}

/**
 * Get all stage infos from sheet.
 * 
 * @returns {{stage: number, begin: Date, end: Date}[]}}
 */
function _getStageInfos() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const stageSheet = ss.getSheetByName("stage");
  const rawData = stageSheet.getRange(2, 1, stageSheet.getLastRow() - 1, stageSheet.getLastColumn()).getValues();
  return rawData.map(row => {
    const stage = _changeStageInSheet(row[0]);
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
function _changeStageInSheet(stageName) {
  if (stageName === StageNameInSheet.stage1) {
    return 1;
  } else if (stageName === StageNameInSheet.stage2) {
    return 2;
  } else {
    return 0;
  }
}

/**
 * Get passwords for each accounts.
 * 
 * @returns {Object<number, string>}
 */
function _getPasswordsForEachAccount() {
  const studentSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("student");
  const rawData = studentSheet.getRange(2, 1, studentSheet.getLastRow() - 1, studentSheet.getLastColumn() - 1).getValues();

  return rawData.reduce((passwords, row) => {
    const account = parseInt(row[0]);
    const password = row[1];

    passwords[account] = password;

    return passwords;
  }, {});
}

function test_get_passwords_for_each_student() {
  const passwords = _getPasswordsForEachAccount();

  console.log(passwords[910001]);
}

function test_check_password() {
  console.log(checkPassword(91, "F"));
}