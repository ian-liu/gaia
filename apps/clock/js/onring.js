/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
'use strict';
console.log('--> before define RingView{}');

var RingView = {

  _ringtonePlayer: null,
  _vibrateInterval: null,
  _screenLock: null,
  _onFireAlarm: {},
  _started: false,

  get time() {
    delete this.time;
    return this.time = document.getElementById('ring-clock-time');
  },

  get hourState() {
    delete this.hourState;
    return this.hourState = document.getElementById('ring-clock-hour24-state');
  },

  get alarmLabel() {
    delete this.alarmLabel;
    return this.alarmLabel = document.getElementById('ring-alarm-label');
  },

  get snoozeButton() {
    delete this.snoozeButton;
    return this.snoozeButton = document.getElementById('ring-button-snooze');
  },

  get closeButton() {
    delete this.closeButton;
    return this.closeButton = document.getElementById('ring-button-close');
  },

  init: function rv_init() {
    console.log('--> init(): before addEventListener mozvisibilitychange');
    document.addEventListener('mozvisibilitychange', this);
    console.log('--> init(): after addEventListener mozvisibilitychange');
    this._onFireAlarm = window.opener.ActiveAlarmController.getOnFireAlarm();
    console.log('--> init(): _onFireAlarm = ' + this._onFireAlarm);
    if (!document.mozHidden) {
      console.log('--> init(): !document.mozHidden before startAlarmNotification');
      this.startAlarmNotification();
      console.log('--> init(): !document.mozHidden after startAlarmNotification');
    } else {
      // The setTimeout() is used to workaround
      // https://bugzilla.mozilla.org/show_bug.cgi?id=810431
      // The workaround is used in screen off mode.
      // mozHidden will be true in init() state.
      var self = this;
      console.log('--> init(): document.mozHidden before rv_checkMozHidden');
      window.setTimeout(function rv_checkMozHidden() {
      // If mozHidden is true in init state,
      // it means that the incoming call happens before the alarm.
      // We should just put a "silent" alarm screen
      // underneath the oncall screen
        console.log('--> init(): rv_checkMozHidden(): before document.mozHidden');
        if (!document.mozHidden) {
          console.log('--> init(): rv_checkMozHidden(): !document.mozHidden before startAlarmNotification');
          self.startAlarmNotification();
          console.log('--> init(): rv_checkMozHidden(): !document.mozHidden after startAlarmNotification');
        }
        // Our final chance is to rely on visibilitychange event handler.
      }, 0);
    }

    console.log('--> init(): before setAlarmTime():');
    this.setAlarmTime();
    console.log('--> init(): after setAlarmTime():');
    this.setAlarmLabel();
    console.log('--> init(): after setAlarmLabel():');
    this.snoozeButton.addEventListener('click', this);
    console.log('--> init(): after snoozeButton.addEventListener');
    this.closeButton.addEventListener('click', this);
    console.log('--> init(): after closeButton.addEventListener');
  },

  setWakeLockEnabled: function rv_setWakeLockEnabled(enabled) {
    // Don't let the phone go to sleep while the alarm goes off.
    // User must manually close it until 15 minutes.
    if (!navigator.requestWakeLock) {
      console.warn('WakeLock API is not available.');
      return;
    }

    if (enabled) {
      this._screenLock = navigator.requestWakeLock('screen');
    } else if (this._screenLock) {
      this._screenLock.unlock();
      this._screenLock = null;
    }
  },

  setAlarmTime: function rv_setAlarmTime() {
    console.log('--> setAlarmTime(): before getAlarmTime():');
    var alarmTime = this.getAlarmTime();
    console.log('--> setAlarmTime(): after getAlarmTime(): alarmTime = ' + alarmTime);
    var time = getLocaleTime(alarmTime);
    console.log('--> setAlarmTime(): time.t = ' + time.t);
    console.log('--> setAlarmTime(): time.p = ' + time.p);
    this.time.textContent = time.t;
    this.hourState.textContent = time.p;
  },

  setAlarmLabel: function rv_setAlarmLabel() {
    this.alarmLabel.textContent = this.getAlarmLabel();
    console.log('--> setAlarmLabel(): getAlarmLabel = ' + this.getAlarmLabel());
  },

  ring: function rv_ring() {
    this._ringtonePlayer = new Audio();
    console.log('--> ring(): _ringtonePlayer = ' + this._ringtonePlayer);
    var ringtonePlayer = this._ringtonePlayer;
    ringtonePlayer.addEventListener('mozinterruptbegin', this);
    ringtonePlayer.mozAudioChannelType = 'alarm';
    ringtonePlayer.loop = true;
    console.log('--> ring(): set ringtonePlayer.loop = true');
    var selectedAlarmSound = 'shared/resources/media/alarms/' +
                             this.getAlarmSound();
    console.log('--> ring(): selectedAlarmSound = ' + selectedAlarmSound);
    ringtonePlayer.src = selectedAlarmSound;
    ringtonePlayer.play();
    console.log('--> ring(): called play():');
    /* If user don't handle the onFire alarm,
       pause the ringtone after 15 minutes */
    var self = this;
    var duration = 60000 * 15;
    window.setTimeout(function rv_pauseRingtone() {
      self.stopAlarmNotification('ring');
    }, duration);
  },

  vibrate: function rv_vibrate() {
    if ('vibrate' in navigator) {
      this._vibrateInterval = window.setInterval(function vibrate() {
        navigator.vibrate([1000]);
      }, 2000);
      console.log('--> vibrate(): enabled vibrate!!!');
      /* If user don't handle the onFire alarm,
       turn off vibration after 15 minutes */
      var self = this;
      var duration = 60000 * 15;
      window.setTimeout(function rv_clearVibration() {
        self.stopAlarmNotification('vibrate');
      }, duration);
    }
    console.log('--> vibrate(): leaving vibrate():');
  },

  startAlarmNotification: function rv_startAlarmNotification() {
    // Ensure called only once.
    console.log('--> startAlarmNotification(): this._started = ' + this._started);
    if (this._started)
      return;

    this._started = true;
    console.log('--> startAlarmNotification(): before setWakeLockEnabled true');
    this.setWakeLockEnabled(true);
    console.log('--> startAlarmNotification(): after setWakeLockEnabled true');
    this.ring();
    console.log('--> startAlarmNotification(): after ring()');
    this.vibrate();
    console.log('--> startAlarmNotification(): after vibrate()');
  },

  stopAlarmNotification: function rv_stopAlarmNotification(action) {
    switch (action) {
    case 'ring':
      if (this._ringtonePlayer)
        this._ringtonePlayer.pause();

      break;
    case 'vibrate':
      if (this._vibrateInterval)
        window.clearInterval(this._vibrateInterval);

      break;
    default:
      if (this._ringtonePlayer)
        this._ringtonePlayer.pause();

      if (this._vibrateInterval)
        window.clearInterval(this._vibrateInterval);

      break;
    }
    this.setWakeLockEnabled(false);
  },

  getAlarmTime: function am_getAlarmTime() {
    var d = new Date();
    d.setHours(this._onFireAlarm.hour);
    d.setMinutes(this._onFireAlarm.minute);
    return d;
  },

  getAlarmLabel: function am_getAlarmLabel() {
    return this._onFireAlarm.label;
  },

  getAlarmSound: function am_getAlarmSound() {
    return this._onFireAlarm.sound;
  },

  handleEvent: function rv_handleEvent(evt) {
    switch (evt.type) {
    case 'mozvisibilitychange':
      // There's chance to miss the mozHidden state when inited,
      // before setVisible take effects, there may be a latency.
      console.log('--> mozvisibilitychange document.mozHidden = ' + document.mozHidden);
      if (!document.mozHidden) {
        console.log('--> mozvisibilitychange call this.startAlarmNotification():');
        this.startAlarmNotification();
      }
      break;
    case 'mozinterruptbegin':
      // Only ringer/telephony channel audio could trigger 'mozinterruptbegin'
      // event on the 'alarm' channel audio element.
      // If the incoming call happens after the alarm rings,
      // we need to close ourselves.
      console.log('--> mozinterruptbegin call stopAlarmNotification():');
      this.stopAlarmNotification();
      window.close();
      break;
    case 'click':
      var input = evt.target;
      if (!input)
        return;

      switch (input.id) {
      case 'ring-button-snooze':
        this.stopAlarmNotification();
        window.opener.ActiveAlarmController.snoozeHandler();
        window.close();
        break;
      case 'ring-button-close':
        this.stopAlarmNotification();
        window.close();
        break;
      }
      break;
    }
  }

};

console.log('--> before addEventListener for localized');
window.addEventListener('localized', function showBody() {
  console.log('--> before remove localized');
  window.removeEventListener('localized', showBody);
  console.log('--> after remove localized');
  RingView.init();
  console.log('--> after init():');
});

console.log('--> after addEventListener for localized');
