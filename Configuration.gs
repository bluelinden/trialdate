// Trial Date Decoupled by Blue Linden

const pageTitle = "Interview Helper"
const faviconURL = ""
const topLeftHeading = "Schedule an interview"
const topLeftSubHeading = "System developed by Blue Linden"
const journalistName = "Blue Linden"
const scheduleSpreadSheet = ""
const interviewsCalendar = ""
const tickTockCalendar = ""
const sha256HashOfAdminPassword = "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8" // because storing passwords in plain text is such a crappy idea that i cannot begin to explain why, you need to find a plaintext to SHA256 converter and paste the digest of your password in here. Using complicated math, this can determine whether your password is right without actually knowing it directly. So if you type in your deepest secret, the system will only know it as "4221ee64e2a551e6dbd1c378db7f1503977e480f1cddba35756febd9def70b23". but you will know the truth, and if you type in the password it will match up and you will be granted access. others can't figure out the password by looking at this.

// only change these if you're a madlad lol, they initialize many variables 
var SHEET_NAMES = {
    CALENDAR_CONFIG: "Calendar_Config"
};
var CODE_WORD_SHEET = "Code_Words";
var ss = SpreadsheetApp.openByUrl(scheduleSpreadSheet);
var calendar_config_sheet = ss.getSheetByName(SHEET_NAMES.CALENDAR_CONFIG);
const store = PropertiesService.getScriptProperties();
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}
const auth = {}
const calendar = {}
auth.knownCorrect = sha256HashOfAdminPassword;
