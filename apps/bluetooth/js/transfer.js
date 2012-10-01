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
  
  var dialogConfirmBluetooth = document.getElementById('dialog-confirm-bluetooth');
  var cancelButton = document.getElementById('button-cancel');
  var turnOnButton = document.getElementById('button-turn-on');
  var deviceSelect = document.getElementById('select-device');

  function isBluetoothEnabled() {
    // get bluetooth status
    var req = settings.createLock().get('bluetooth.enabled');
    req.onsuccess = function bt_EnabledSuccess() {
      if (req.result['bluetooth.enabled']) {
        console.log('isBluetoothEnabled(): ON-->browsePairedDevices():');
        browsePairedDevices();
      } else {
        console.log('isBluetoothEnabled(): OFF-->confirmTurnBluetoothOn(:)');
        confirmTurnBluetoothOn();
      }
    }
    req.onerror = function bt_EnabledOnerror() {
      console.log('BluetoothEnabled(): fail');
    }
  }
  
  function browsePairedDevices() {
    deviceSelect.addEventListener('change', transferToDevice);
    // deviceSelect.addEventListener('blur', transferToDevice);
    //XXX should be removed
    hackForTest(true);
  }
  
  function confirmTurnBluetoothOn() {
    // To do: set The confirmed dialog on
    dialogConfirmBluetooth.hidden = false;
    cancelButton.addEventListener('click', cancelTransfer);
    turnOnButton.addEventListener('click', turnOnBluetooth);
  }
  
  function turnOnBluetooth() {
    dialogConfirmBluetooth.hidden = true;
    settings.createLock().set({'bluetooth.enabled': true});
    console.log('turnOnBluetooth():');
    //XXX should be removed
    hackForTest(true);
  }
  
  //XXX hack due to the following bugs.
  function hackForTest(enabled) {
    if (enabled) {
      //XXX there is no "bluetooth.onenabled" callback can be hooked.
      //https://bugzilla.mozilla.org/show_bug.cgi?id=782586
      if (!bluetooth.enabled) {
        window.setTimeout(initialDefaultAdapter, 5000);
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
        console.log('Get null bluetooth adapter!');
        return;
      }
      getPairedDevice();
    };
    req.onerror = function bt_getAdapterFailed() {
      // we can do nothing without DefaultAdapter, so set bluetooth disabled
      settings.createLock().set({'bluetooth.enabled': false});
      console.log('Can not get bluetooth adapter!');
    }
  }
  
  function cancelTransfer() {
    dialogConfirmBluetooth.hidden = true;
    activity.postError('cancelled');
    endTransfer();
  }

  function endTransfer() {
    activity = null;
    cancelButton.removeEventListener('click', cancelTransfer);
    turnOnButton.removeEventListener('click', turnOnBluetooth);
    activity.postResult('transferred');
  }
  
  function getPairedDevice() {
    console.log('getPairedDevice():');
    var req = defaultAdapter.getPairedDevices();
    req.onsuccess = function bt_getPairedSuccess() {
      pairList.index = req.result;
      var length = pairList.index.length;
      if (length == 0) {
        console.log('There is no paired device! Please pair your bluetooth device first.');
        return;
      }
      
      // To do: Put the list to value selector
      for (var i = 0; i < length; i++) {
        (function(device) {
          deviceSelect.options[i] = new Option(device.name, i);
        })(pairList.index[i]);
      }
      //XXX Workaround to create an indicator option since there's no change/confirm event when select tag applied 
      deviceSelect.options[length] = new Option('Please select a paired device.', 'none');
      deviceSelect.selectedIndex = length;
      showPairDeviceSelector();
    };
    
    req.onerror = function () {
      console.log('getPairedDevice(): defaultAdapter.getPairedDevices() onerror');
    };
  }
  
  function showPairDeviceSelector () {
    deviceSelect.focus();
  }
  
  function transferToDevice () {
    console.log('transferToDevice():');
    if (deviceSelect.options[deviceSelect.selectedIndex].value == 'none') {
      console.log('transferToDevice(): No selected device then do an early return');
      endTransfer();
      return;
    }
    
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
        // defaultAdapter.sendFile(targetDevice.address, blob);
        defaultAdapter.sendFile(targetDevice.address, url);
        console.log('transferToDevice(): called sendFile():');
        endTransfer();
      };
      
      getMediaRequest.onerror = function() {
        var errmsg = getRequest.error && getRequest.error.name;
        console.log('transferToDevice(): getMediaRequest.errmsg = ' + errmsg);
        endTransfer();
      };
      
    };
    
    transferRequest.onerror = function () {
      console.log('transferToDevice(): transferRequest onerror');
      endTransfer();
    };
  }
  
});
