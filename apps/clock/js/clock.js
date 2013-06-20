'use strict';

window.addEventListener('load', function loadClock() {
  ClockView.init();
  AlarmList.init();
  BannerView.init();
  ActiveAlarmController.init();
});

// Set the 'lang' and 'dir' attributes to <html> when the page is translated
navigator.mozL10n.ready(function localized() {
  document.documentElement.lang = navigator.mozL10n.language.code;
  document.documentElement.dir = navigator.mozL10n.language.direction;
});


