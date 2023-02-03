function retrieveEnabledDays(calendar_config_sheet) {
    var calData = calendar_config_sheet
        .getRange(1, 1, calendar_config_sheet.getLastRow(), calendar_config_sheet.getLastColumn())
        .getValues();
    var enabledDays = [];
    var dayNumber = -1;
    for (var i = 0; i < 14; i += 2) {
        var result = calData[4][i];
        dayNumber++;
        if (result != "on")
            continue;
        enabledDays.push(dayNumber);
    }
    return enabledDays;
} 
function refreshEnabledDays() {
    var enabledDays = retrieveEnabledDays(calendar_config_sheet);
    store.setProperty('enabledDays', JSON.stringify(enabledDays));
}

var enabledDays = JSON.parse(store.getProperty('enabledDays'));

function getEnabledDays() {
    return JSON.parse(store.getProperty('enabledDays'));
}
