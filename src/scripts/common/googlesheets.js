// Client ID and API key from the Developer Console
var CLIENT_ID = '461581440741-l3uq2jrqbaa2c4c0cde33livuo2bliu8.apps.googleusercontent.com';
var API_KEY = 'AIzaSyCEgVsEwc86zLfTxomP_OmEY7rNd32gndo';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";

var authorizeButton = document.getElementById('authorize_button');
var signoutButton = document.getElementById('signout_button');

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
  }).then(function () {
    // Listen for sign-in state changes.
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

    // Handle the initial sign-in state.
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    authorizeButton.onclick = handleAuthClick;
    signoutButton.onclick = handleSignoutClick;
  }, function(error) {
      console.error(JSON.stringify(error, null, 2));
      
      addModal({
        header: error.error,
        body: error.details
      })
  });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    processGoogleData();
  } else {
    $('#modal--googleSignIn').modal({
      keyboard: false,
    })
  }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
}

/**
 * Print the names and majors of students in a sample spreadsheet:
 */
function processGoogleData() {
  gapi.client.sheets.spreadsheets.values.batchGet({
    "spreadsheetId": "19BTKzoFuOJB37WX8oaKvLAy5Zh3jxSIBTphdL3Xno20",
    "majorDimension": "ROWS",
    "ranges": [
      "projects!A:I",
      "contract_probability!A:L"
    ],
    // "valueRenderOption": "UNFORMATTED_VALUE"
  }).then(function (response) {
    console.log('response.result', response.result.valueRanges);

    var results = response.result.valueRanges[0].values;
    window.data = _.assignIn(window.data, {
      projects: _.map(results.slice(1), function (row) {
        return _.fromPairs(_.zip(results[0], row));
      }
    )});

    results = response.result.valueRanges[1].values;
    window.data = _.assignIn(window.data, {
      contract_probability: _.map(results.slice(1), function (row) {
        return _.fromPairs(_.zip(results[0], row));
      })
    });

    visualiser.init();
  }, function(response) {
    // appendPre('Error: ' + response.result.error.message);
  });
}
