/* global console */

/**
 * BluetoothContext:
 *   - BluetoothContext is an Observable that wraps the platform Bluetooth
 *     object.
 *   - BluetoothContext is a singleton that you can easily use it to fetch some
 *     shared data across different panels.
 *   - It has some observable properties: state, enabled, address, name,
 *     discoverable, discovering, numberOfPairedDevices, firstPairedDeviceName,
 *     hasPairedDevice.
 *   - It has two observable array: _pairedDevices, _remoteDevices.
 * BluetoothContext only update state and does not involve in any UI logic.
 *
 * @module BluetoothContext
 */
define(function(require) {
  'use strict';

  var AdapterManager = require('modules/bluetooth/bt_adapter_manager');
  var Observable = require('modules/mvvm/observable');
  var ObservableArray = require('modules/mvvm/observable_array');
  var SettingsCache = require('modules/settings_cache');

  var settings = Settings.mozSettings;

  var BluetoothContext = {
    /**
     * State of Bluetooth default adapter.
     * This is an enum of BluetoothAdapterState.
     * State: 'disabled', 'disabling', 'enabled', 'enabling'
     *
     * @readonly
     * @memberOf BluetoothContext
     * @type {string}
     */
    state: 'disabled',

    /**
     * State of Bluetooth.
     *
     * @readonly
     * @memberOf BluetoothContext
     * @type {Boolean}
     */
    enabled: false,

    /**
     * The address of the device's adapter on the bluetooth micro-network.
     *
     * @readonly
     * @memberOf BluetoothContext
     * @type {String}
     */
    address: null,

    /**
     * The human readable name of the device's adapter.
     *
     * @readonly
     * @memberOf BluetoothContext
     * @type {String}
     */
    name: '',

    /**
     * Indicates if the device is discoverable (true) or not (false)
     * by other bluetooth devices.
     *
     * @readonly
     * @memberOf BluetoothContext
     * @type {Boolean}
     */
    discoverable: false,

    /**
     * Indicates if the device is in the process of discovering (true) or
     * not (false) surrounding bluetooth devices.
     *
     * @readonly
     * @memberOf BluetoothContext
     * @type {Boolean}
     */
    discovering: false,

    /**
     * Number of Bluetooth paired devices.
     *
     * @readonly
     * @memberOf BluetoothContext
     * @type {Number}
     */
    numberOfPairedDevices: 0,

    /**
     * Device name of Bluetooth paired devices in the first sorting.
     *
     * @readonly
     * @memberOf BluetoothContext
     * @type {String}
     */
    firstPairedDeviceName: '',

    /**
     * Indicates if the paired device is in the paired devices list (true) or
     * not (false).
     *
     * @readonly
     * @memberOf BluetoothContext
     * @type {Boolean}
     */
    hasPairedDevice: false,

    /**
     * Default adapter of Bluetooth.
     *
     * @access private
     * @memberOf BluetoothContext
     * @type {Object BluetoothAdapter}
     */
    _defaultAdapter: null,

    /**
     * Init BluetoothContext module.
     *
     * @access private
     * @memberOf BluetoothContext
     */
    _init: function btc__init() {
      // Observe 'defaultAdapter' property for reaching default adapter.
      AdapterManager.observe('defaultAdapter', this._onDefaultAdapterChanged);
      this._onDefaultAdapterChanged(AdapterManager.defaultAdapter);
    },

    /**
     * Init properties from default adapter.
     *
     * @access private
     * @memberOf BluetoothContext
     * @param {Object BluetoothAdapter} adapter
     */
    _initProperties: function btc__initProperties(adapter) {
      // init observable property
      this._updateStatus(adapter.state);
      this.address = adapter.address;
      this.name = adapter.name;
      this.discoverable = adapter.discoverable;
      this.discovering = adapter.discovering;

      // init paired device information
      this._initPairedDevicesInfo(adapter);
    },

    /**
     * Only reset properties since there is no available default adapter.
     *
     * @access private
     * @memberOf BluetoothContext
     */
    _resetProperties: function btc__resetProperties() {
      this._updateStatus('disabled');
      this.address = '';
      this.name = '';
      this.discoverable = false;
      this.discovering = false;
    },

    /**
     * Watch 'onattributechanged' event from default adapter for updating
     * enabled/disabled status immediately.
     *
     * Description of 'onattributechanged' event:
     * A handler to trigger when one of the local bluetooth adapter's properties
     * has changed. Note access to the changed property in this event handler
     * would get the updated value.
     *
     * @access private
     * @memberOf BluetoothContext
     * @param {Object BluetoothAdapter} adapter
     */
    _watchDefaultAdapterOnattributechanged:
    function btc__watchDefaultAdapterOnattributechanged(adapter) {
      adapter.onattributechanged =
        this._onAdapterAttributeChanged.bind(this, adapter);
    },

    /**
     * Unwatch 'onattributechanged' event from default adapter since adapter is
     * removed.
     *
     * @access private
     * @memberOf BluetoothContext
     * @param {Object BluetoothAdapter} adapter
     */
    _unwatchDefaultAdapterOnattributechanged:
    function btc__unwatchDefaultAdapterOnattributechanged(adapter) {
      adapter.onattributechanged = null;
    },

    /**
     * Watch 'ondevicepaired' event from default adapter for updating paired
     * device immediately.
     *
     * Description of 'ondevicepaired' event:
     * A handler to trigger when a remote device gets paired with local
     * bluetooth adapter.
     *
     * @access private
     * @memberOf BluetoothContext
     * @param {Object BluetoothAdapter} adapter
     */
    _watchDefaultAdapterOndevicepaired:
    function btc__watchDefaultAdapterOndevicepaired(adapter) {
      adapter.ondevicepaired =
        this._onAdapterDevicepaired.bind(this, adapter);
    },

    /**
     * Unwatch 'ondevicepaired' event from default adapter since adapter is
     * removed.
     *
     * @access private
     * @memberOf BluetoothContext
     * @param {Object BluetoothAdapter} adapter
     */
    _unwatchDefaultAdapterOndevicepaired:
    function btc__unwatchDefaultAdapterOndevicepaired(adapter) {
      adapter.ondevicepaired = null;
    },

    /**
     * Watch 'ondeviceunpaired' event from default adapter for updating unpaired
     * device immediately.
     *
     * Description of 'ondeviceunpaired' event:
     * A handler to trigger when a remote device gets unpaired from local
     * bluetooth adapter.
     *
     * @access private
     * @memberOf BluetoothContext
     * @param {Object BluetoothAdapter} adapter
     */
    _watchDefaultAdapterOndeviceunpaired:
    function btc__watchDefaultAdapterOndeviceunpaired(adapter) {
      adapter.ondeviceunpaired =
        this._onAdapterDeviceunpaired.bind(this, adapter);
    },

    /**
     * Unwatch 'ondeviceunpaired' event from default adapter since adapter is
     * removed.
     *
     * @access private
     * @memberOf BluetoothContext
     * @param {Object BluetoothAdapter} adapter
     */
    _unwatchDefaultAdapterOndeviceunpaired:
    function btc__unwatchDefaultAdapterOndeviceunpaired(adapter) {
      adapter.ondeviceunpaired = null;
    },

    /**
     * 'onattributechanged' event handler from default adapter for updating
     * latest BluetoothContext information.
     *
     * @access private
     * @memberOf BluetoothContext
     * @param {Object BluetoothAdapter} adapter
     * @param {event} evt
     */
    _onAdapterAttributeChanged:
    function btc__onAdapterAttributeChanged(adapter, evt) {
      console.log('--> _onAdapterAttributeChanged.... ');
      for (var i in evt.attrs) {
        console.log('---> _onAdapterAttributeChanged.... ' + evt.attrs[i]);
        switch (evt.attrs[i]) {
          case 'state':
            this._updateStatus(adapter.state);
            if (adapter.state === 'enabled') {
              // Manually start discovery while the adapter state
              // is already enabled.
              this.startDiscovery();
            }
            break;
          case 'address':
            this.address = adapter.address;
            break;
          case 'name':
            this.name = adapter.name;
            break;
          case 'discoverable':
            this.discoverable = adapter.discoverable;
            break;
          case 'discovering':
            this.discovering = adapter.discovering;
            break;
          default:
            break;
        }
      }
    },

    /**
     * 'ondevicepaired' event handler from default adapter for updating paired
     * device in remote/paired devices list.
     *
     * @access private
     * @memberOf BluetoothContext
     * @param {Object BluetoothAdapter} adapter
     * @param {event} evt
     */
    _onAdapterDevicepaired:
    function btc__onAdapterDevicepaired(adapter, evt) {
      console.log('--> _onAdapterDevicepaired(): adapter = ' + adapter);
      console.log('--> _onAdapterDevicepaired(): evt = ' + evt);
      console.log('--> _onAdapterDevicepaired(): evt.attrs = ' + evt.attrs);
      console.log('--> _onAdapterDevicepaired(): typeof(evt.attrs) = ' +
                  typeof(evt.attrs));
      // have to get device object in this event handler Ex. evt --> device

      // remove the paired device from remote devices list
      // var indexInRemoteDevices =
      //   this.getRemoteDevices().array.findIndex(
      //     this._findDeviceByAddress.bind(this, device.address));

      // if (!indexInRemoteDevices === -1) {
      //   this.getRemoteDevices().splice(indexInRemoteDevices, 1);
      // }

      // Instead of adding the paired device in paired devices list,
      // get paired devices from adapter directly.
      this._refreshPairedDevicesInfo(adapter);
    },

    /**
     * 'ondeviceunpaired' event handler from default adapter for updating
     * unpaired device in remote/paired devices list.
     *
     * @access private
     * @memberOf BluetoothContext
     * @param {Object BluetoothAdapter} adapter
     * @param {event} evt
     */
    _onAdapterDeviceunpaired:
    function btc__onAdapterDeviceunpaired(adapter, evt) {
      console.log('--> _onAdapterDeviceunpaired(): adapter = ' + adapter);
      console.log('--> _onAdapterDeviceunpaired(): evt = ' + evt);
      console.log('--> _onAdapterDeviceunpaired(): evt.attrs = ' + evt.attrs);
      console.log('--> _onAdapterDeviceunpaired(): typeof(evt.attrs) = ' +
                  typeof(evt.attrs));

      // have to get the device address in this event handler Ex. evt -> address
      // var address = evt.address;
      // var indexInPairedDevices =
      //   this.getPairedDevices().array.findIndex(
      //     this._findDeviceByAddress.bind(this, address));

      // if (!indexInPairedDevices === -1) {
      //   this.getPairedDevices().splice(indexInPairedDevices, 1);
      // }

      // Instead of removing the paired device from paired devices list,
      // get paired devices from adapter directly.
      this._refreshPairedDevicesInfo(adapter);
    },

    /**
     * 'defaultAdapter' change event handler from adapter manager for
     * watch/unwatch default adapter relative event immediately.
     *
     * @access private
     * @memberOf BluetoothContext
     * @param {Object BluetoothAdapter} newAdapter
     * @param {Object BluetoothAdapter} oldAdapter
     */
    _onDefaultAdapterChanged:
    function btc__onDefaultAdapterChanged(newAdapter, oldAdapter) {
      console.log('--> _onDefaultAdapterChanged(): newAdapter = ' + newAdapter);
      console.log('--> _onDefaultAdapterChanged(): oldAdapter = ' + oldAdapter);

      // save default adapter
      this._defaultAdapter = newAdapter;

      if (oldAdapter) {
        // unwatch event since the old adapter is no longer usefull
        this._unwatchDefaultAdapterOnattributechanged(oldAdapter);
        this._unwatchDefaultAdapterOndeviceunpaired(oldAdapter);
        this._unwatchDefaultAdapterOndevicepaired(oldAdapter);
      }

      if (newAdapter) {
        // watch event since the new adapter is ready to access
        this._initProperties(newAdapter);
        this._watchDefaultAdapterOnattributechanged(newAdapter);
        this._watchDefaultAdapterOndevicepaired(newAdapter);
        this._watchDefaultAdapterOndeviceunpaired(newAdapter);
      } else {
        // reset properties only
        this._resetProperties();
      }
    },

    /**
     * State of init for paired devices info. We only init paired devices info
     * one time while _init() or 'onattributechanged' event comimg from default
     * adapter.
     *
     * @access private
     * @memberOf BluetoothContext
     * @type {Boolean}
     */
    _hasInitPairedDevicesInfo: false,

    /**
     * Init paired devices information.
     *
     * @access private
     * @memberOf BluetoothContext
     * @param {Object} adapter
     */
    _initPairedDevicesInfo: function btc__initPairedDevicesInfo(adapter) {
      if (!this._hasInitPairedDevicesInfo) {
        this._hasInitPairedDevicesInfo = true;
        this._refreshPairedDevicesInfo(adapter);
      }
    },

    /**
     * Refresh paired devices information.
     *
     * @access private
     * @memberOf BluetoothContext
     * @param {Object BluetoothAdapter} adapter
     */
    _refreshPairedDevicesInfo: function btc__refreshPairedDevicesInfo(adapter) {
      var pairedDevices = adapter.getPairedDevices();

      // reset paired devices list
      this._pairedDevices.reset(adapter.getPairedDevices());

      // // save paired devices in list
      // for (var i in pairedDevices) {
      //   this._pairedDevices.push(pairedDevices[i]);
      // }

      // update property 'hasPairedDevice'
      this.hasPairedDevice = this._hasPairedDevice();

      // copy for sorting
      var paired = pairedDevices.slice();
      var length = paired.length;
      if (length !== 0) {
        paired.sort(function(a, b) {
          return a.name > b.name;
        });
        // set the name
        this.firstPairedDeviceName = paired[0].name;
      } else {
        // reset the name
        this.firstPairedDeviceName = '';
      }

      this.numberOfPairedDevices = length;
    },

    /**
     * Since we have three properties which are relative with hardware status,
     * update them via this method here.
     * Update status, enabled, settings key 'bluetooth.enabled'
     * The input state would be {'disabled', 'disabling', 'enabled', 'enabling'}
     *
     * @access private
     * @memberOf BluetoothContext
     * @param {String} state
     */
    _updateStatus: function btc__updateStatus(state) {
      // console.log('--> request update state = ' + state);
      // Wrapper state to enabled/disabled toggle state.
      var enabled;
      if (state === 'enabled' || state === 'disabling') {
        enabled = true;
      } else if (state === 'disabled' || state === 'enabling') {
        enabled = false;
      }

      // Sync with settings key
      SettingsCache.getSettings(function(results) {
        var btEnabled = results['bluetooth.enabled'];
        // console.log('--> enabled = ' + enabled);
        if (btEnabled !== enabled) {
          // console.log('--> set bluetooth.enabled = ' + enabled);
          settings.createLock().set({'bluetooth.enabled': enabled});
        }

        // Update state
        this.state = state;

        // Update enabled
        this.enabled = enabled;
      }.bind(this));
    },

    /**
     * Set Bluetooth enable/disable.
     *
     * @access public
     * @memberOf BluetoothContext
     * @param {Boolean} enabled
     */
    setEnabled: function btc_setEnabled(enabled) {
      // console.log('--> request enabled = ' + enabled);
      // console.log('--> typeof(enabled) = ' + typeof(enabled));
      if ((this.enabled === enabled) ||
          (this.state === 'enabling') ||
          (this.state === 'disabling')) {
        // console.log('--> early return in setEnabled.. ');
        return;
      }

      if (!this._defaultAdapter) {
        return;
      }

      if (enabled) {
        this._defaultAdapter.enable().then(function onResolve() {
          // console.log('--> set enable successfully :)');
          this._updateStatus('enabled');
        }.bind(this), function onReject(reason) {
          console.log('--> set enable failed: reason = ' + reason);
        });
      } else {
        this._defaultAdapter.disable().then(function onResolve() {
          // console.log('--> set disable successfully :)');
          this._updateStatus('disabled');
        }.bind(this), function onReject(reason) {
          console.log('--> set disable failed: reason = ' + reason);
        });
      }
    },

    /**
     * Set Bluetooth discoverable.
     *
     * @access public
     * @memberOf BluetoothContext
     * @param {Boolean} enabled
     */
    setDiscoverable: function btc_setDiscoverable(enabled) {
      // console.log('--> request enabled = ' + enabled);
      // console.log('--> typeof(enabled) = ' + typeof(enabled));
      if ((this.discoverable === enabled) || (this.state !== 'enabled')) {
        // console.log('--> early return in setDiscoverable.. ');
        return;
      }

      if (!this._defaultAdapter) {
        return;
      }

      this._defaultAdapter.setDiscoverable(enabled).then(function onResolve() {
        // console.log('--> set discoverable successfully :)');
        this.discoverable = enabled;
      }.bind(this), function(reason) {
        console.log('--> set discoverable failed: reason = ' + reason);
      });
    },

    /**
     * Set adapter name.
     *
     * @access public
     * @memberOf BluetoothContext
     * @param {String} name
     */
    setName: function btc_setName(name) {
      // console.log('--> request name = ' + name);
      // console.log('--> typeof(name) = ' + typeof(name));
      if (name === this.name) {
        // console.log('--> early return in set the same name.. ');
        return;
      }

      if (!this._defaultAdapter) {
        return;
      }

      this._defaultAdapter.setName(name).then(function onResolve() {
        // console.log('--> set name successfully :) adapter.name = ' +
        //             adapter.name);
        this.name = this._defaultAdapter.name;
      }.bind(this), function onReject(reason) {
        console.log('--> set name failed: reason = ' + reason);
      });
    },

    /**
     * An observable array to maintain paired devices which are just found out.
     *
     * @access private
     * @memberOf BluetoothContext
     * @type {ObservableArray}
     */
    _pairedDevices: ObservableArray([]),

    /**
     * An observable array to maintain remote devices which are just found out.
     *
     * @access private
     * @memberOf BluetoothContext
     * @type {ObservableArray}
     */
    _remoteDevices: ObservableArray([]),

    /**
     * An handler to handle 'ondevicefound' event. Then, we can save and update
     * found device in the remote devices array.
     *
     * @access private
     * @memberOf BluetoothContext
     * @type {Function}
     */
    _discoveryHandler: null,

    /**
     * The method makes the device's adapter start seeking for remote devices.
     * The discovery process may be terminated after discovering a period of
     * time. If the startDiscovery operation succeeds, an onattributechanged
     * event would be triggered before the Promise is resolved to indicate
     * property discovering becomes true.
     *
     * @access public
     * @memberOf BluetoothContext
     * @type {Function}
     */
    startDiscovery: function btc_startDiscovery() {
      // console.log('--> request startDiscovery..');
      if ((this.discovering === true) || (this.state !== 'enabled')) {
        // console.log('--> early return in startDiscovery.. ');
        return;
      }

      // clean up found devices list
      this._remoteDevices.reset([]);

      if (!this._defaultAdapter) {
        return;
      }

      this._defaultAdapter.startDiscovery().then(function onResolve(handle) {
        // console.log('--> startDiscovery successfully :)');
        // Keep reference to handle in order to listen to
        // ondevicefound event handler
        this._setDiscoveryHandler(handle);
        // manually update discovering state
        this.discovering = true;
      }.bind(this), function onReject(reason) {
        console.log('--> startDiscovery failed: reason = ' + reason);
      });
    },

    /**
     * The method makes the device's adapter stop seeking for remote devices.
     * This is an asynchronous method and its result is returned via a Promise.
     * If the stopDiscovery operation succeeds, an onattributechanged would be
     * triggered before the Promise is resolved to indicate property discovering
     * becomes false. Note adapter may still receive
     * BluetoothDiscoveryHandle.ondevicefound event until the Promise is
     * resolved.
     *
     * @access public
     * @memberOf BluetoothContext
     * @type {Function}
     */
    stopDiscovery: function btc_stopDiscovery() {
      // console.log('--> request stopDiscovery..');
      if ((this.discovering === false) || (this.state !== 'enabled')) {
        // console.log('--> early return in startDiscovery.. ');
        return;
      }

      if (!this._defaultAdapter) {
        return;
      }

      this._defaultAdapter.stopDiscovery().then(function onResolve() {
        // console.log('--> stopDiscovery successfully :)');
        // manually update discovering state
        this.discovering = false;
      }.bind(this), function onReject(reason) {
        console.log('--> stopDiscovery failed: reason = ' + reason);
      });
    },

    /**
     * A function to receive BluetoothDiscoveryHandle. And set a function to
     * handle 'ondevicefound' event.
     *
     * @access private
     * @memberOf BluetoothContext
     * @param {Object BluetoothDiscoveryHandle} handle
     */
    _setDiscoveryHandler: function btc__setDiscoveryHandler(handle) {
      // console.log('-->_setDiscoveryHandler(): handle = ' + handle);
      // make the code base easy to do unit test
      this._discoveryHandler = handle;
      this._discoveryHandler.ondevicefound = this._onDeviceFound.bind(this);
    },

    /**
     * Handle 'ondevicefound' event to access remote device in list with
     * observable object.
     *
     * @access private
     * @memberOf BluetoothContext
     * @param {Object} evt
     */
    _onDeviceFound: function btc__onDeviceFound(evt) {
      // console.log('-->_onDeviceFound(): evt = ' + evt);
      // save device
      this._saveDevice(evt.device);
    },

    /**
     * To distinguish between paired and unpaired.
     * Then, save/update the device in list corresponding to the state of
     * property paired.
     *
     * @access private
     * @memberOf BluetoothContext
     * @param {Object Observable} device
     */
    _saveDevice: function btc__saveDevice(device) {
      // distinguish the found device is paired or not
      var operatingDevices =
        (device.paired) ? this.getPairedDevices() : this.getRemoteDevices();

      // check the device is existed or not in remote/paired devices array
      var index = operatingDevices.array.findIndex(
                    this._findDeviceByAddress.bind(this, device.address));

      // If the device is not existed yet, create observable oject
      // for saving this device.
      if (index === -1) {
        // lazy loading BtDevice module
        require(['modules/bluetooth/bt_device'], function(BtDevice) {
          // create observable BtDevice
          var observableBtDevice = BtDevice(device);
          // push device in devices list with observable object
          operatingDevices.push(observableBtDevice);
        });
      } else {
        // The device is existed, no need to do any thing here.
        // set device in devices list
        // operatingDevices.set(index, device);
      }
    },

    /**
     * Given address to find out device element from array.
     *
     * @access private
     * @memberOf BluetoothContext
     * @param {String} address
     * @return {Boolean}
     */
    _findDeviceByAddress:
    function btc__findDeviceByAddress(address, element) {
      if (element.address && (element.address === address)) {
        // console.log('--> found out index = ' + index);
        return true;
      } else {
        // console.log('--> not found out index return -1 .. ');
        return false;
      }
    },

    /**
     * Return paired devices list which is maintained in BluetoothContext.
     *
     * @access public
     * @memberOf BluetoothContext
     * @return {Observable Array}
     */
    getPairedDevices: function btc_getPairedDevices() {
      return this._pairedDevices;
    },

    /**
     * Check is there any paired device in the list.
     *
     * @access private
     * @memberOf BluetoothContext
     * @return {Boolean}
     */
    _hasPairedDevice: function btc_hasPairedDevice() {
      if (this._pairedDevices.length > 0) {
        return true;
      } else {
        return false;
      }
    },

    /**
     * Return remote devices list which is maintained in BluetoothContext.
     *
     * @access public
     * @memberOf BluetoothContext
     * @return {Observable Array}
     */
    getRemoteDevices: function btc_getRemoteDevices() {
      return this._remoteDevices;
    },

    /**
     * The method starts pairing a remote device with the device's adapter.
     *
     * @access public
     * @memberOf BluetoothContext
     * @param {String} address
     */
    pair: function btc_pair(address) {
      // console.log('--> pair(): address = ' + address);
      if (!this._defaultAdapter) {
        return;
      }

      this._defaultAdapter.pair(address).then(function onResolve() {
        // console.log('--> Resolved with void value');
      }, function onReject(reason) {
        console.log('--> Reject with this reason: ' + reason);
      });
    },

    /**
     * The method starts unpairs a remote device with the device's adapter.
     *
     * @access public
     * @memberOf BluetoothContext
     * @param {String} address
     */
    unpair: function btc_unpair(address) {
      // console.log('--> unpair(): address = ' + address);
      if (!this._defaultAdapter) {
        return;
      }

      this._defaultAdapter.unpair(address).then(function onResolve() {
        // console.log('--> Resolved with void value');
      }, function onReject(reason) {
        console.log('--> Reject with this reason: ' + reason);
      });
    }
  };

  // Create the observable object using the prototype.
  var bluetoothContext = Observable(BluetoothContext);
  bluetoothContext._init();
  return bluetoothContext;
});
