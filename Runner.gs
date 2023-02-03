// original code by kevin vaghasiya
// design and tick-tock day functionality by blue linden

// initializes the storage system for the script

// initializes progress report global var, to allow frontend to fetch what the backend is doing                                                
var progressReport = "Waiting on action..."
function getAvailableTimeslots(_a) {return calendar.getAvailableTimeslots(_a);}
function getTickTockForDate(dayInput) {return calendar.getTickTockForDate(dayInput);}
function checkPassword(hash) {return auth.checkPassword(hash);}
function bookSlot(_a) {return calendar.bookSlot(_a);}

// function that responds for a user request for page, triggered upon a GET request. takes page.html, adds the enabledDays as an array, evaluates it and returns it with some customizations.
function doGet(e) {
    var template = HtmlService.createTemplateFromFile("D-page");
    if(e.parameters || e.pathInfo) {
        // var auth = doAuthentication_(e);
    }
    console.log(JSON.stringify(e));
    template.enabledDays = JSON.parse(store.getProperty('enabledDays'));
    return template
        .evaluate()
        .setSandboxMode(HtmlService.SandboxMode.IFRAME)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag("viewport", "width=device-width, initial-scale=1")
        .setTitle(pageTitle)
        .setFaviconUrl(faviconURL);
}

// function that responds to an async call to book a slot, by getting the details from the form object and adding a calendar event. includes error handling.
calendar.bookSlot = function(_a) {
    progressReport = "Spinning up booking system..."
    var date = _a.date, startTime = _a.startTime, endTime = _a.endTime, title = _a.title, interviewLocation = _a.location;
    if (!date)
        return JSON.stringify({ error: true, message: "Please enter the date." });
    if (!startTime || !endTime)
        return JSON.stringify({ error: true, message: "Please select an interview time." });
    if (!title)
        return JSON.stringify({ error: true, message: "Please enter your name." });
    if (!interviewLocation) 
        return JSON.stringify({ error: true, message: "Please enter where you want to be interviewed." });
    if ( title === "Blue Linden")
        return JSON.stringify({ error: true, message: "Heeey, props for bypassing the client-side validation! The fact that you did that makes you a pretty decent developer, look at you removing one single line of code! Here, have 'Brand New Best Friend,' a song from 'Phineas and Ferb: Across the 2nd Dimension' as a reward: Do I know you? Ye-Yeah, I'm you from another dimension. Well, that would explain the handsomeness. Right back at ya, big guy! Does mean you and I are exactly alike? I suppose so. Do you want some rice pudding? Blech, no that's gross! It was a test! Almond Brittle? Ooh! I love it the most! Me too! Do you collect coins? Yeah, just in case. Vending machines become A dominate race! I've been alone all these years. With my irrational fears. But not the vending machine thing. That's gonna happen. But now before me I see Someone with whom I agree I've found a brand new best friend and it's me I've found a brand new best friend and it's me" });
    var selectedDate = new Date(date);
    var startTimeDate = new Date(date); 
    var endTimeDate = new Date(date);
    var tempStart = new Date(startTime); 
    var tempEnd = new Date(endTime);
    startTimeDate.setHours(tempStart.getHours());
    startTimeDate.setMinutes(tempStart.getMinutes());
    startTimeDate.setSeconds(tempStart.getSeconds());
    endTimeDate.setHours(tempEnd.getHours());
    endTimeDate.setMinutes(tempEnd.getMinutes());
    endTimeDate.setSeconds(tempEnd.getSeconds());
    progressReport = "Grabbing days from config..."
    var enabledDays = JSON.parse(store.getProperty('enabledDays'))
    var day = selectedDate.getDay();
    if (enabledDays.indexOf(day) == -1)
        return JSON.stringify({
            error: true,
            message: "That interview date isn't available, please pick another one.",
            retry: true
        });
    progressReport = "Grabbing calendar from config..."
    var calendar = CalendarApp.getCalendarById(interviewsCalendar);
    var events = calendar.getEvents(startTimeDate, endTimeDate);
    if (events.length)
        return JSON.stringify({
            error: true,
            message: "That interview time isn't available, please pick another one.",
            retry: true
        });
    progressReport = "Scheduling interview..."
    calendar.createEvent("INTERVIEW- " + title, startTimeDate, endTimeDate, { location: interviewLocation });
    return JSON.stringify({
        success: true,
        message: "The interview was scheduled successfully."
    });
}

// checks if there are timeslots on the day specified. is main fetch-based backend function. calls other functions to ensure no intersections or ticker-tocker fckery. removes all slots on ticker-tocker days or days off.
calendar.getAvailableTimeslots = function(_a) {
  var date = _a.date;
  var selectedDate = new Date(date);
  var ss = SpreadsheetApp.openByUrl(scheduleSpreadSheet);
  var calendar_config_sheet = ss.getSheetByName(SHEET_NAMES.CALENDAR_CONFIG);
  var calData = calendar_config_sheet
      .getRange(1, 1, calendar_config_sheet.getLastRow(), calendar_config_sheet.getLastColumn())
      .getValues();
  var calendarId = calData[1][0] ;
  var tickTockDay = getTickTock(selectedDate);
  var slots = [];
  var possibleSlots = getPossibleTimeslots(selectedDate.getDay(), calData);
  if (!possibleSlots.length)
      return JSON.stringify({ slots: slots });
  var calendar = CalendarApp.getCalendarById(calendarId);
  slots = getAvailableSlots(possibleSlots, calendar, date);
  var thatDaysTimerSchedule = JSON.stringify({ slots: slots });
  if( tickTockDay === "off" || tickTockDay === "ticker" || tickTockDay === "tocker" ) { thatDaysTimerSchedule = JSON.stringify({ slots: [] }) }
  return thatDaysTimerSchedule;
}

// checks getPossibleTimeslots against any interview calendar events that happen at the same time. if there are any, skip over the slot when building the array of available slots. returns array of available slots to frontend.
calendar.validateTimeslots = function(possibleSlots, calendar, date) {
    var slots = [];
    for (var i = 0; i < possibleSlots.length; i++) {
        var _a = possibleSlots[i], startTime = _a.startTime, endTime = _a.endTime;
        var st = new Date(date);
        var et = new Date(date);
        var tempStart = new Date(startTime);
        var tempEnd = new Date(endTime);
        st.setHours(tempStart.getHours());
        st.setMinutes(tempStart.getMinutes());
        st.setSeconds(tempStart.getSeconds());
        et.setHours(tempEnd.getHours());
        et.setMinutes(tempEnd.getMinutes());
        et.setSeconds(tempEnd.getSeconds());
        var events = calendar.getEvents(st, et);
        if (events.length)
            continue;
        slots.push(possibleSlots[i]);
    }
    return slots;
}

// checks the spreadsheet and returns an array of the timeslots present there. this does not check for intersections, only reads the spreadsheet.
calendar.retrieveTimeslots = function (day, calData) {
    var indx = day == 0 ? 0 : day * 2;
    var slots = [];
    if (calData[4][indx] != "on")
        return slots;
    for (var i = 6; i < calData.length; i++) {
        var startTime = calData[i][indx];
        var endTime = calData[i][indx + 1];
        if (!startTime || !endTime)
            continue;
        var st = new Date(startTime);
        var et = new Date(endTime);
        if (et <= st)
            continue;
        slots.push({ startTime: st, endTime: et });
    }
    return slots;
} 

// checks to see if any given day is a tick, tock, ticker, tocker, or day off. returns as a string.
calendar.getTickTockForDate = function(dayInput) {
  progressReport = "Spinning up tick-tock mechanism..."
  var day = new Date(dayInput);
  progressReport = "Retrieving tick-tock days..."
  var ttcalendar = CalendarApp.getCalendarById(tickTockCalendar);
  var tickDay = ttcalendar.getEventsForDay(day, {search: 'red'});
  var tockDay = ttcalendar.getEventsForDay(day, {search: 'blue'});
  var tickERDay = ttcalendar.getEventsForDay(day, {search: 'red-er'});
  var tockERDay = ttcalendar.getEventsForDay(day, {search: 'blue-er'});
  progressReport = "Determining tick-tock days..."
  if( tickERDay.length != 0 ) {
    var tickTockDay = "ticker";
  } else if( tockERDay.length != 0 ) {
    var tickTockDay = "tocker";
  } else if( tickDay.length != 0 ) {
    var tickTockDay = "tick";
  } else if( tockDay.length != 0 ) {
    var tickTockDay = "tock";
  } else {
    var tickTockDay = "off";
  }
  return tickTockDay;
}

auth.saveID = function(dataObject, urlParam) {
    store.setProperty("interviewID-" + urlParam, dataObject);
    if(store.getProperty("interviewID-" + urlParam) === dataObject) {
      return JSON.stringify({success: true})
    } else {
      return JSON.stringify({error: true, message:"There was an issue saving your interview information to the storage system. This issue is not related to the scheduling of interviews."});
    }
}
``
auth.retrieveID = function(urlParam) {
  return store.getProperty("interviewID-" + urlParam);
}

auth.checkPassword = function(password) {
    var hashedPasswordRaw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
    var hashedPassword = hashedPasswordRaw.map(function(n){return("0"+(n<0?256+n:n).toString(16)).slice(-2)}).join("");
    if(hashedPassword === sha256HashOfAdminPassword) {
        var authKey = makeID(20);
        var authDate = new Date();
        var authPackage = {};
        authPackage.auth = true
        authPackage.key = authKey
        authPackage.date = authDate
        store.setProperty('adminLogin',authPackage);
        return JSON.stringify(authPackage)
    } else {
        var authPackage = {}
        authPackage.auth = false
        return JSON.stringify(authPackage)
    }
}

auth.generateRandomString = function(length) {
    var result           = '';
    var characters       = '-_abcdefghijklmnopqrstuvwxyz0123456789';
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 characters.length));
   }
   return result;
}

auth.authenticate = function (request, isPageLoad) {
    var interviewID
    var adminLogin
    var authObject = {}
    if (request.parameter.id) {
        var interviewID = retrieveIDFromParam(request.parameter.id);
        authObject.auth = true
        authObject.idRight = true
    }
    if (request.parameter.key) {
        var adminLoginObject = JSON.parse(store.getProperty('adminLogin'))
        if(adminLoginObject.key === request.parameter.key) {
            authObject.auth = true
            if(isPageLoad === true) {
                adminLoginObject.canLoadPage = false
                store.setProperty('adminLogin', JSON.stringify(adminLoginObject));
            }
            
        } else {
            authObject.auth = false
        }

    }
}
