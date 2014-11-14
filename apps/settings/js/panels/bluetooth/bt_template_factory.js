/* global console */

/**
 * The template function for generating an UI element for an item of Bluetooth
 * paired/remote device.
 *
 * @module bluetooth/bt_template_factory
 */
define(function(require) {
  'use strict';

  function btTemplate(deviceType, onItemClick, observableItem) {
    var device = observableItem;

    var nameSpan = document.createElement('span');
    _updateItemName(nameSpan, device.name);
    
    var descSmall = document.createElement('small');
    if (deviceType === 'remote') {
      descSmall.setAttribute('data-l10n-id', 'device-status-tap-connect');
    }

    var li = document.createElement('li');
    var anchor = document.createElement('a');
    li.classList.add('bluetooth-device');
    // li.classList.add('bluetooth-type-' + device.icon);
    
    // TODO: conver cod to readable human type
    console.log('--> device.cod = ' + device.cod);
    // var cod = device.cod;
    // console.log('--> cod.majorDeviceClass = ' + cod.majorDeviceClass);
    // console.log('--> cod.majorServiceClass = ' + cod.majorServiceClass);
    // console.log('--> cod.minorDeviceClass = ' + cod.minorDeviceClass);

    anchor.appendChild(nameSpan);
    anchor.appendChild(descSmall); // should append this first
    li.appendChild(anchor);

    // Register the handler for the click event.
    if (typeof onItemClick === 'function') {
      li.onclick = function() {
        onItemClick(observableItem);
      };
    }

    // Observe name property for update device name 
    // while device 'onattributechanged' event is coming.
    device.observe('name', function(newName) {
      _updateItemName(nameSpan, newName);
    });

    return li;
  }

  function _updateItemName(element, name) {
    if (name !== '') {
      element.textContent = name;
    } else {
      element.setAttribute('data-l10n-id', 'unnamed-device');
    }
  }

  return function ctor_btTemplate(deviceType, onItemClick) {
    return btTemplate.bind(null, deviceType, onItemClick);
  };
});
