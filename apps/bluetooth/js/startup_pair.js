'use strict';

// define('startup_pairing', function(require) {

// var App = require('app');
// var mozL10n = require('l10n');
// mozL10n.once(App.init.bind(App));
// });

// require(['require_config'], function() {
//   requirejs(['startup_pairing']);
// });

console.log('--> hello AMD is ready.. :-)');

// var PairManager = require('modules/pair_manager');
navigator.mozSetMessageHandler('bluetooth-pairing-request', function() {
  console.log('--> got "bluetooth-pairing-request" system message here.. :-)');
  require('mooo');	
});

// require('mooo');
// var BluetoothHelper = require('shared/bluetooth_helper');
