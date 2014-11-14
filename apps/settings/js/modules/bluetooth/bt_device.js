/* global console */

/**
 * BluetoothDevice:
 *   - BluetoothDevice is an Observable that wraps the platform
 *     BluetoothDevice object.
 *   - It has some observable properties: name, paired, cod
 * BluetoothDevice only update device information and does not involve in any
 *   UI logic.
 *
 * @module BluetoothDevice
 */
define(function(require) {
  'use strict';

  var Observable = require('modules/mvvm/observable');

  /**
   * @class BluetoothDevice
   * @requires module:modules/mvvm/observable
   * @param {Object BluetoothDevice} device
   * @return {Observable} observableBluetoothDevice
   */
  return function ctor_bt_device(device) {
    var observableBluetoothDevice = Observable({
      name: device.name,
      paired: device.paired,
      address: device.address,
      cod: device.cod
    });

    /**
     * watch 'onattributechanged' event
     * A function to receive device which is just found via discovery handler.
     * And set a function to handle 'onattributechanged' event.
     */
    device.onattributechanged = function btd_onDeviceAttributeChanged(evt) {
      console.log('--> onDeviceAttributeChanged():..');
      for (var i in evt.attrs) {
        switch (evt.attrs[i]) {
          case 'name':
            console.log('--> device name changed to' + device.name);
            observableBluetoothDevice.name = device.name;
            break;
          case 'paired':
            console.log('--> device paired changed to' + device.paired);
            observableBluetoothDevice.paired = device.paired;
            break;
          default:
            break;
        }
      }
    };

    return observableBluetoothDevice;
  };
});
