/* global console */

/**
 * The Bluetooth panel
 *
 * Bluetooth v2 panel, still on working..
 */
define(function(require) {
  'use strict';

  var BtContext = require('modules/bluetooth/bt_context');
  var BtTemplateFactory = require('panels/bluetooth/bt_template_factory');
  var ListView = require('modules/mvvm/list_view');
  var SettingsPanel = require('modules/settings_panel');

  return function ctor_bluetooth() {
    var elements;
    var pairedDeviceTemplate;
    var foundDeviceTemplate;
    var _pairedDevicesListView;
    var _foundDevicesListView;

    return SettingsPanel({
      onInit: function(panel) {
        // console.log('--> onInit()...');

        elements = {
          panel: panel,
          enableCheckbox: panel.querySelector('.bluetooth-status input'),
          enableCheckboxMsg: panel.querySelector('.bluetooth-enable-msg'),
          visible: {
            visibleItem: panel.querySelector('.device-visible'),
            visibleName: panel.querySelector('.bluetooth-device-name'),
            visibleCheckBox: panel.querySelector('.device-visible input')
          },
          rename: {
            renameItem: panel.querySelector('.bluetooth-rename'),
            renameButton: panel.querySelector('.rename-device')  
          },
          paired: {
            pairedDevicesHeader: panel.querySelector('.bluetooth-paired-title'),
            pairedDevicesList: panel.querySelector('.bluetooth-paired-devices')
          },
          found: {
            foundDevicesHeader: panel.querySelector('.bluetooth-found-title'),
            foundDevicesList: panel.querySelector('.bluetooth-devices')
          },
          search: {
            searchingItem: panel.querySelector('.bluetooth-searching'),
            searchItem: panel.querySelector('.bluetooth-search'),
            searchButton: panel.querySelector('.search-device')  
          }
        };

        // element related events
        elements.enableCheckbox.addEventListener('click',
          this._onEnableCheckboxClick.bind(this));

        elements.visible.visibleCheckBox.addEventListener('click',
          this._onVisibleCheckBoxClick.bind(this));

        elements.rename.renameButton.addEventListener('click',
          this._onRenameButtonClick.bind(this));

        elements.search.searchButton.addEventListener('click',
          this._onSearchButtonClick.bind(this));

        // paired devices list item click events
        pairedDeviceTemplate =
          BtTemplateFactory('paired', this._onPairedDeviceItemClick.bind(this));

        // create found devices list view
        _pairedDevicesListView = ListView(elements.paired.pairedDevicesList,
                                         BtContext.getPairedDevices(),
                                         pairedDeviceTemplate);

        // found devices list item click events
        foundDeviceTemplate =
          BtTemplateFactory('remote', this._onFoundDeviceItemClick.bind(this));

        // create found devices list view
        _foundDevicesListView = ListView(elements.found.foundDevicesList,
                                         BtContext.getRemoteDevices(),
                                         foundDeviceTemplate);
      },

      onBeforeShow: function() {
        // console.log('--> onBeforeShow()...');
        // enable/disable
        BtContext.observe('state', this._updateEnableCheckbox);
        this._updateEnableCheckbox(BtContext.state);

        // visible
        BtContext.observe('state', this._updateVisibleItem);
        this._updateVisibleItem(BtContext.state);

        BtContext.observe('discoverable', this._updateVisibleCheckbox);
        this._updateVisibleCheckbox(BtContext.discoverable);

        BtContext.observe('name', this._updateVisibleName);
        this._updateVisibleName(BtContext.name);

        // rename
        BtContext.observe('state', this._updateRenameItem);
        this._updateRenameItem(BtContext.state);

        // paired devices header
        BtContext.observe('hasPairedDevice', this._updatePairedDevicesHeader);
        this._updatePairedDevicesHeader(BtContext.hasPairedDevice);

        // paired devices list
        BtContext.observe('state', this._updatePairedDevicesList);
        this._updatePairedDevicesList(BtContext.state);

        // found devices list
        BtContext.observe('state', this._updateFoundDevicesList);
        this._updateFoundDevicesList(BtContext.state);

        _pairedDevicesListView.enabled = true;
        _foundDevicesListView.enabled = true;

        // search
        BtContext.observe('state', this._updateSearchItem);
        this._updateSearchItem(BtContext.state);

        BtContext.observe('discovering', this._updateSearchingItem);
        this._updateSearchingItem(BtContext.discovering);
      },

      onBeforeHide: function() {
        // console.log('--> onBeforeHide()...');
        BtContext.unobserve('state');
        BtContext.unobserve('name');
        BtContext.unobserve('discoverable');
        BtContext.unobserve('discovering');
      },

      onHide: function() {
        if (_pairedDevicesListView) {
          _pairedDevicesListView.enabled = false;
        }

        if (_foundDevicesListView) {
          _foundDevicesListView.enabled = false;
        }
      },

      _onEnableCheckboxClick: function() {
        var checkbox = elements.enableCheckbox;
        // console.log('--> _onEnableCheckboxClick()... checkbox.checked = ' +
        //             checkbox.checked);
        BtContext.setEnabled(checkbox.checked);
      },

      _onVisibleCheckBoxClick: function() {
        var checkbox = elements.visible.visibleCheckBox;
        // console.log('--> _onVisibleCheckBoxClick()... checkbox.checked = ' +
        //             checkbox.checked);
        BtContext.setDiscoverable(checkbox.checked);
      },

      _onRenameButtonClick: function() {
        // console.log('--> _onRenameButtonClick():..');
        // TODO: show rename dialog for settings new devices name.
      },

      _updateEnableCheckbox: function(state) {
        // console.log('--> callback from observe "state" = ' + state);
        // Update Bluetooth enable checkbox
        elements.enableCheckbox.checked =
          ((state === 'enabled') || (state === 'enabling')) ? true : false;
        elements.enableCheckbox.disabled =
          ((state === 'enabling') || (state === 'disabling')) ? true : false;

        // Update Bluetooth enable checkbox message
        elements.enableCheckboxMsg.hidden =
          ((state === 'enabled') || (state === 'enabling')) ? true : false;
      },

      _updateVisibleItem: function(state) {
        // console.log('--> callback from observe "state" = ' + state);
        elements.visible.visibleItem.hidden =
          ((state === 'enabled') || (state === 'enabling')) ? false : true;
        elements.visible.visibleItem.disabled =
          (state === 'enabled') ? false : true;
      },

      _updateVisibleCheckbox: function(discoverable) {
        // console.log('--> callback from observe "discoverable" = ' +
        //             discoverable);
        elements.visible.visibleCheckBox.checked = discoverable;
      },

      _updateVisibleName: function(name) {
        // console.log('--> callback from observe "name" = ' + name);
        elements.visible.visibleName.textContent = name;
      },

      _updateRenameItem: function(state) {
        // console.log('--> callback from observe "state" = ' + state);
        elements.rename.renameItem.hidden =
          ((state === 'enabled') || (state === 'enabling')) ? false : true;
        elements.rename.renameButton.disabled =
          (state === 'enabled') ? false : true;
      },

      _updatePairedDevicesHeader: function(hasPairedDevice) {
        // console.log('--> callback from observe "hasPairedDevice" = ' +
        //             hasPairedDevice);
        elements.paired.pairedDevicesHeader.hidden =
          (hasPairedDevice && (BtContext.state === 'enabled')) ? false : true;
      },

      _updatePairedDevicesList: function(state) {
        // console.log('--> callback from observe "state" = ' + state);
        elements.paired.pairedDevicesHeader.hidden =
          ((state === 'enabled') && (BtContext.hasPairedDevice)) ? false : true;
        elements.paired.pairedDevicesList.hidden =
          (state === 'enabled') ? false : true;
      },

      _updateFoundDevicesList: function(state) {
        // console.log('--> callback from observe "state" = ' + state);
        elements.found.foundDevicesHeader.hidden =
          (state === 'enabled') ? false : true;
        elements.found.foundDevicesList.hidden =
          (state === 'enabled') ? false : true;
      },

      _updateSearchItem: function(state) {
        // console.log('--> callback from observe "state" = ' + state);
        elements.search.searchItem.hidden =
          (state === 'enabled') ? false : true;
      },

      _updateSearchingItem: function(discovering) {
        // console.log('--> callback from observe "discovering" = ' +
        //             discovering);
        elements.search.searchingItem.hidden = !discovering;
        elements.search.searchButton.disabled = discovering;
      },

      _onSearchButtonClick: function() {
        // console.log('--> _onSearchButtonClick()...');
        BtContext.startDiscovery();
      },

      _onPairedDeviceItemClick: function(deviceItem) {
        console.log('--> _onPairedDeviceItemClick() deviceItem.address = ' +
                    deviceItem.address);
        console.log('--> _onPairedDeviceItemClick() deviceItem.paired = ' +
                    deviceItem.paired);
        // TODO: unpair, connect, disconnect
      },

      _onFoundDeviceItemClick: function(deviceItem) {
        console.log('--> _onFoundDeviceItemClick() deviceItem.address = ' +
                    deviceItem.address);
        // pairing with the remote device
        BtContext.pair(deviceItem.address);
      }
    });
  };
});
