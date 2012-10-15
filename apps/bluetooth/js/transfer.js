/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

var _ = navigator.mozL10n.get;

window.addEventListener('localized', function showPanel() {
  var settings = window.navigator.mozSettings;
  var bluetooth = window.navigator.mozBluetooth;
  var defaultAdapter = null;
  var activity;
  var pairList = {
    index: []
  };
    
  // Becarefull to do the return!!!
  if (!settings || !bluetooth)
    return;
  
  navigator.mozSetMessageHandler('activity', function handler(activityRequest) {
    var activityName = activityRequest.source.name;
    if (activityName !== 'transfer')
      return;
      
    activity = activityRequest;
    isBluetoothEnabled();
  });

  var dialogConfirmBluetooth = document.getElementById('enable-bluetooth-view');
  var bluetoothCancelButton = document.getElementById('enable-bluetooth-button-cancel');
  var bluetoothTurnOnButton = document.getElementById('enable-bluetooth-button-turn-on');
  var dialogAlertView = document.getElementById('alert-view');
  var alertOkButton = document.getElementById('alert-button-ok');
  var deviceSelect = null;
  var dialogDeviceSelector = document.getElementById('value-selector');
  var deviceSelectorContainers = document.getElementById('value-selector-container');
  var optionsContainer = document.querySelector('#value-selector-container ol');
  var deviceCancelButton = document.getElementById('device-select-button-cancel');
  var deviceOkButton = document.getElementById('device-select-button-ok');
  var _debug = false;

  function debug(msg) {
    if (!_debug)
      return;

    console.log('===Bluetooth SendFile===: ' + msg);
  }
  
  function isBluetoothEnabled() {
    // get bluetooth status
    var req = settings.createLock().get('bluetooth.enabled');
    req.onsuccess = function bt_EnabledSuccess() {
      if (req.result['bluetooth.enabled']) {
        console.log('isBluetoothEnabled(): ON-->browsePairedDevices():');
        browsePairedDevices();
      } else {
        console.log('isBluetoothEnabled(): OFF-->confirmTurnBluetoothOn():');
        confirmTurnBluetoothOn();
      }
    };
    req.onerror = function bt_EnabledOnerror() {
      var msg = 'Can not get bluetooth.enabled from setting!';
      cannotTransfer(msg);
    };
  }
  
  function browsePairedDevices() {
    //XXX should be removed
    hackForTest(true);
  }
  
  function confirmTurnBluetoothOn() {
    dialogConfirmBluetooth.hidden = false;
    bluetoothCancelButton.addEventListener('click', cancelTransfer);
    bluetoothTurnOnButton.addEventListener('click', turnOnBluetooth);
  }
  
  function turnOnBluetooth() {
    dialogConfirmBluetooth.hidden = true;
    settings.createLock().set({'bluetooth.enabled': true});
    //XXX should be removed
    hackForTest(true);
    // TODO: Show Turn Bluetooth ON Dialog.
  }
  
  //XXX hack due to the following bugs.
  function hackForTest(enabled) {
    if (enabled) {
      //XXX there is no "bluetooth.onenabled" callback can be hooked.
      //https://bugzilla.mozilla.org/show_bug.cgi?id=782586
      if (!bluetooth.enabled) {
        setTimeout(initialDefaultAdapter, 5000);
      } else {
        initialDefaultAdapter();
      }
    }
  }
  
  function initialDefaultAdapter() {
    console.log('initialDefaultAdapter():');
    if (!bluetooth.enabled) {
      console.log('initialDefaultAdapter(): !bluetooth.enabled then do an early return' );
      return;
    }
      
    var req = bluetooth.getDefaultAdapter();
    req.onsuccess = function bt_getAdapterSuccess() {
      defaultAdapter = req.result;
      if (defaultAdapter == null) {
        // we can do nothing without DefaultAdapter, so set bluetooth disabled
        settings.createLock().set({'bluetooth.enabled': false});
        var msg = 'Get null bluetooth adapter!';
        cannotTransfer(msg);
        return;
      }
      getPairedDevice();
    };
    req.onerror = function bt_getAdapterFailed() {
      // we can do nothing without DefaultAdapter, so set bluetooth disabled
      settings.createLock().set({'bluetooth.enabled': false});
      var msg = 'Can not get bluetooth adapter!';
      cannotTransfer(msg);
    };
  }
  
  function cancelTransfer() {
    dialogConfirmBluetooth.hidden = true;
    dialogDeviceSelector.hidden = true;
    activity.postError('cancelled');
    endTransfer();
  }
  
  function cannotTransfer(msg) {
    debug(msg);
    dialogAlertView.hidden = false;
    alertOkButton.addEventListener('click', closeAlart);
  }
  
  function closeAlart() {
    dialogAlertView.hidden = true;
    alertOkButton.removeEventListener('click', closeAlart);
    activity.postError('cancelled');
    endTransfer();
  }

  function endTransfer() {
    bluetoothCancelButton.removeEventListener('click', cancelTransfer);
    bluetoothTurnOnButton.removeEventListener('click', turnOnBluetooth);
    activity = null;
  }
  
  function getPairedDevice() {
    console.log('getPairedDevice():');
    var req = defaultAdapter.getPairedDevices();
    req.onsuccess = function bt_getPairedSuccess() {
      pairList.index = req.result;
      var length = pairList.index.length;
      if (length == 0) {
        var msg = 'There is no paired device! Please pair your bluetooth device first.';
        cannotTransfer(msg);
        return;
      }
      // Put the list to value selector
      deviceSelect = document.createElement('select');
      for (var i = 0; i < length; i++) {
        (function(device) {
          deviceSelect.options[i] = new Option(device.name, i);
        })(pairList.index[i]);
      }
      deviceSelect.selectedIndex = 0;
      buildOptions(deviceSelect.options);
      showHidePairDeviceSelector(true);
    };
    req.onerror = function () {
      var msg = 'Can not get paired devices from adapter.';
      cannotTransfer(msg);
    };
  }
  
  function buildOptions(options) {
    var optionHTML = '';
    function escapeHTML(str) {
      var span = document.createElement('span');
      span.textContent = str;
      return span.innerHTML;
    }

    for (var i = 0, n = options.length; i < n; i++) {
      var checked = options[i].selected ? ' aria-checked="true"' : '';
      options[i].optionIndex = i;
      optionHTML += '<li data-option-index="' + options[i].optionIndex + '"' +
                     checked + '>' +
                     '<label> <span>' +
                     escapeHTML(options[i].text) +
                     '</span></label>' +
                    '</li>';
    }
    optionsContainer.innerHTML = optionHTML;
    // Apply different style when the options are more than 1 page
    if (options.length > 5) {
      deviceSelectorContainers.classList.add('scrollable');
    } else {
      deviceSelectorContainers.classList.remove('scrollable');
    }
  }
  
  function showHidePairDeviceSelector (enabled) {
    if (enabled) {
      dialogDeviceSelector.hidden = false;
      deviceSelectorContainers.addEventListener('click', handleSelect);
      deviceCancelButton.addEventListener('click', cancelTransfer);
      deviceOkButton.addEventListener('click', transferToDevice);  
    } else {
      dialogDeviceSelector.hidden = true;
      deviceSelectorContainers.removeEventListener('click', handleSelect);
      deviceCancelButton.removeEventListener('click', cancelTransfer);
      deviceOkButton.removeEventListener('click', transferToDevice);
    }
  }
  
  function handleSelect(evt) {
    if (evt.target.dataset === undefined ||
        (evt.target.dataset.optionIndex === undefined &&
         evt.target.dataset.optionValue === undefined))
      return;
    
    var selectee = deviceSelectorContainers.querySelectorAll('[aria-checked="true"]');
    for (var i = 0; i < selectee.length; i++) {
      selectee[i].removeAttribute('aria-checked');
    }
    evt.target.setAttribute('aria-checked', 'true');
  }
  
  function transferToDevice () {
    console.log('transferToDevice():');
    var selectee = deviceSelectorContainers.querySelectorAll('[aria-checked="true"]');
    deviceSelect.selectedIndex = selectee[0].dataset.optionIndex;
    var selectedIndex = deviceSelect.options[deviceSelect.selectedIndex].value;
    var targetDevice = pairList.index[selectedIndex];
    
    console.log('transferToDevice(): targetDevice = ' + targetDevice.name);
    console.log('transferToDevice(): address = ' + targetDevice.address);
    var transferRequest = defaultAdapter.connect(targetDevice.address, 0x1105);
    
    transferRequest.onsuccess = function bt_connSuccess() {
      console.log('transferToDevice(): transferRequest success');
      // var blob = new Blob(['hello', ' world'], {type: 'text/plain'});
      var mediaType = activity.source.data.type;
      var urls = activity.source.data.urls;
      console.log('transferToDevice(): mediaType = ' + mediaType);
      var storage = navigator.getDeviceStorage(mediaType);
      var getMediaRequest = storage.get(urls[0]);
      getMediaRequest.onsuccess = function (e) {
        console.log('transferToDevice(): getMediaRequest success');
        var url = URL.createObjectURL(getMediaRequest.result);
        console.log('transferToDevice(): url = ' + url);
        console.log('transferToDevice(): getMediaRequest.result = ' + getMediaRequest.result);
        defaultAdapter.sendFile(targetDevice.address, getMediaRequest.result);
        console.log('transferToDevice(): called sendFile():');
        activity.postResult('transferred');
        endTransfer();
      };
      
      getMediaRequest.onerror = function() {
        var errmsg = getRequest.error && getRequest.error.name;
        var msg = 'Get media request error: msg = ' + errmsg;
        cannotTransfer(msg);
      };
      
    };
    
    transferRequest.onerror = function () {
      var msg = 'Can not get adapter connect!';
      cannotTransfer(msg);
    };
    showHidePairDeviceSelector(false);
    console.log('transferToDevice(): END!!!');
  }
});
