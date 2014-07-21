'use strict';

var Settings = require('../app/app'),
    assert = require('assert');

marionette('manipulate do not track settings', function() {
  var client = marionette.client();
  var settingsApp;
  var doNotTrackPanel;

  setup(function() {
    client.contentScript.inject(__dirname +
      '/../mocks/mock_navigator_moz_bluetooth.js');

    settingsApp = new Settings(client);
    settingsApp.launch();
    // Navigate to the Do Not Track menu
    doNotTrackPanel = settingsApp.doNotTrackPanel;
  });

  test('check do not track initial state', function() {
    assert.ok(
      !doNotTrackPanel.isDoNotTrackEnabled,
      'do not track is disabled by default'
    );
  });

  test('enable do not track', function() {
    doNotTrackPanel.enableDoNotTrack();
    assert.ok(
      doNotTrackPanel.isDoNotTrackEnabled,
      'do not track has been enabled'
    );
  });

});
