# Connecting NextGen Labs to Google Sheets

Follow these steps to successfully route form submissions from your website directly into a Google Sheet.

## 1. Create a New Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new blank spreadsheet.
2. Name it something like **NextGen Labs Submissions**.
3. In the first row (headers), add exact column names that match your HTML Form logic:
   - `fullName`
   - `branchYear`
   - `phone`
   - `email`
   - `building`
   - `ideaDesc`
   - `skillsHas`
   - `skillsWant`
   - `commitment`
   - `whySelect`
   - *(Optional)* Add a `Timestamp` column at the very beginning.

## 2. Open Google Apps Script

1. From your Google Sheet, click `Extensions` -> `Apps Script` in the top menu.
2. A new tab will open with a code editor. Replace all code in `Code.gs` with the following:

```js
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // Create a new row of data based on the names sent from the form
  var rowData = [
    new Date(), // Submits Timestamp
    e.parameter.fullName,
    e.parameter.branchYear,
    e.parameter.phone,
    e.parameter.email,
    e.parameter.building,
    e.parameter.ideaDesc,
    e.parameter.skillsHas,
    e.parameter.skillsWant,
    e.parameter.commitment,
    e.parameter.whySelect
  ];
  
  // Append row
  sheet.appendRow(rowData);
  
  // Return success response with CORS headers
  return ContentService.createTextOutput(JSON.stringify({"result":"success"}))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## 3. Deploy as a Web App

1. Click on the blue **Deploy** button at the top right, then select **New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. **Description**: Initial version
4. **Execute as**: `Me` (Your email)
5. **Who has access**: `Anyone` (This is crucial, it must be Anyone so unauthenticated users can submit the form)
6. Click **Deploy**.
7. Google will ask you to authorize access. Click **Authorize access**, select your Google account, click "Advanced", and proceed to the app (unsafe). Allow permissions.
8. Copy the **Web App URL** generated.

## 4. Connect URL to Website

1. Open `script.js` in your NextGen Labs codebase.
2. Locate the line around line 29:
   `const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_SCRIPT_WEB_APP_URL_HERE';`
3. Replace `'YOUR_GOOGLE_SCRIPT_WEB_APP_URL_HERE'` with the Web App URL you just copied.
4. Save the file. Your form is now live and hooked up to Google Sheets!
