/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
'use strict';

var BluetoothTransfer = {
  progressTimer: null,
  bannerContainer: null,
  
  get transferStatusList() {
    delete this.transferStatusList;
    return this.transferStatusList = document.getElementById('bluetooth-transfer-status-list');
  },
  
  get transferStatus() {
    delete this.transferStatus;
    return this.transferStatus = document.getElementById('bluetooth-transfer-status');
  },
  
  get transferStatusTest() {
    delete this.transferStatusTest;
    // return this.transferStatusTest = document.getElementById('bluetooth-transfer-status');
    return this.transferStatusTest = document.querySelector("div[data-id='test']");
  },
  
  get banner() {
    delete this.banner;
    return this.banner = document.getElementById('system-banner');
  },
  
  init: function bt_init() {
    // Bind message handler for transferring file callback
    navigator.mozSetMessageHandler('bluetooth-opp-receiving-file-confirmation', 
      function bt_gotReceivingFileConfirmationMessage(message) {
        self.onReceivingFileConfirmation(message);
      }
    );
    navigator.mozSetMessageHandler('bluetooth-opp-transfer-start', 
      function bt_gotTransferStartMessage(message) {
        self.onUpdateProgress('start', message);
      }
    );
    navigator.mozSetMessageHandler('bluetooth-opp-update-progress', 
      function bt_gotUpdateProgressMessage(message) {
        self.onUpdateProgress('progress', message);
      }
    );
    navigator.mozSetMessageHandler('bluetooth-opp-transfer-complete', 
      function bt_gotTransferCompleteMessage(message) {
        self.onTransferComplete(message);
      }
    );
    console.log('=== SetMessageHandler === registered!!!');
    // XXX: Cannot receive callback # System APP
    // https://bugzilla.mozilla.org/show_bug.cgi?id=797803
    var self = this;
    // Testbed:
    // var evt1 = {
      // success: true,
      // received: false,
      // filename: 'How can you mend a broken heart',
      // filelength: 'uint32_t' // uint32_t
    // };
    // setTimeout(function() {
      // self.onTransferComplete(evt1);
    // }, 30000);
    
    // setTimeout(function() {
      // self.testNotify();
    // }, 30000);
    
    var evt2 = {
      // Got more info. from the transfer-start message
      address: 19032,
      fileName: 'unknow_fileName',
      fileLength: 'unknow_fileLength',
      transfer_mode: 'receive'
    };
    
    var evt3 = {
      processed: 10,// uint32_t
      filelength: 100 // uint32_t
    };
    
    setTimeout(function() {
      self.onUpdateProgress('start', evt2);
    }, 30000);
    
    setTimeout(function() {
      self.progressTimer = setInterval(function() {
        evt3.processed = evt3.processed + 10;
        self.onUpdateProgress('progress', evt3);
      }, 1500);
    }, 35000);
    // this.showHideStatus(true);
    this.transferStatus.addEventListener('click', this.onClickTransferStatus.bind(this));
    
    // setTimeout(function() {
      // self.onReceivingFileConfirmation();
    // }, 10000);
    
    this.bannerContainer = this.banner.firstElementChild;
  },
  
  onClickTransferStatus: function bt_onClickTransferStatus() {
    console.log('=== onClickTransferStatus(): ===');
    // Show confirm dialog for user to cancel transferring task
    UtilityTray.hide();
    this.showCancelTransferPrompt();
  },

  showCancelTransferPrompt: function bt_showCancelTransferPrompt() {
    var _ = navigator.mozL10n.get;

    // TODO: Need to get device name, file name, and file size.
    var cancel = {
      title: _('continue'),
      callback: this.continueTransfer.bind(this)
    };

    var confirm = {
      title: _('cancel'),
      callback: this.cancelTransfer.bind(this)
    };

    // TODO: Do we need description for the dialog?
    CustomDialog.show(_('cancelFileTransfer'), _('cancelFileTransfer'),
                      cancel, confirm);
  },
  
  continueTransfer: function bt_continueTransfer() {
    CustomDialog.hide();
  },
  
  cancelTransfer: function bt_cancelTransfer() {
    CustomDialog.hide();
    // this.showHideStatus(false);
    // TODO: Notify platform to cancelTransfer by API
    // API not ready yet
  },
    
  showReceivePrompt: function bt_showReceivePrompt() {
    var _ = navigator.mozL10n.get;

    // TODO: Need to get device name, file name, and file size.
    var deviceName = 'deviceName';
    var fileName = 'fileName';
    var fileSize = 'fileSize';
    var cancel = {
      title: _('deny'),
      callback: this.declineReceive.bind(this)
    };

    var confirm = {
      title: _('transfer'),
      callback: this.acceptReceive.bind(this)
    };

    CustomDialog.show(_('acceptFileTransfer'), 
                      _('wantToReceive', 
                      { deviceName: deviceName, 
                        fileName: fileName, 
                        fileSize: fileSize }),
                      cancel, confirm);
  },
  
  declineReceive: function bt_declineReceive() {
    CustomDialog.hide();
    // TODO: Notify platform with declineReceive by API
    // API not ready yet
  },
  
  acceptReceive: function bt_acceptReceive() {
    CustomDialog.hide();
    // this.showHideStatus(true);
    // TODO: Notify platform with acceptReceive by API
    // API not ready yet
  },

  // TODO: Could remove the useless function showHideStatus()
  showHideStatus: function bt_showHideStatus(enabled) {
    if (enabled) {
      this.transferStatus.classList.add('displayed');
      //transferStatusList
      // this.transferStatusTest.classList.add('displayed');
    } else {
      this.transferStatus.classList.remove('displayed');
      // this.transferStatusTest.classList.remove('displayed');
    }
  },

  initProgress: function bt_initProgress(evt) {
    console.log('=== initProgress ===');
    var address = 'address-1'; //evt.address;
    var transferMode = _('bluetooth-sending-progress'); //evt.received;
    // var transferModeDefMsg = 'Sending Bluetooth transfer...';
    // var transferMode = _('bluetooth-receiving-progress');
    // var transferModeDefMsg = 'Receiving Bluetooth transfer...';
    var content = '';
    content += '<div class="bluetooth-transfer-progress">' + transferMode + 
                  '</div>' +
                '<div class="icon"></div>' +
                // TODO: Need icons to display transferring mode
                '<progress value="0" max="1"></progress>';
                   
    var transferTask = document.createElement('div');
    transferTask.id = 'bluetooth-transfer-status';
    transferTask.className = 'notification';
    transferTask.setAttribute('data-id', address);
    transferTask.innerHTML = content;
    this.transferStatusList.appendChild(transferTask);
    // this.transferStatusList.innerHTML = content;
    // <div id="bluetooth-transfer-status" data-id="test" class="notification">
      // <div class="bluetooth-transfer-progress" data-l10n-id="transferProgress">Receiving Bluetooth transfer...</div>
      // <div class="icon"></div>
      // <progress value="0" max="1"></progress>            
    // </div>
  },
  
  updateProgress: function bt_updateProgress(value) {
    var _ = navigator.mozL10n.get;
    // document.querySelector("div[data-id='test']");//transferStatusList
    // var progressEl = this.transferStatus.querySelector('progress');
    var address = 'address-1';
    var id = 'div[data-id="' + address + '"] progress';
    var progressEl = this.transferStatusList.querySelector(id);
    // var progressEl = this.transferStatusList.querySelector('div[data-id="address-1"] progress');
    progressEl.value = value;
  },
  
  removeProgress: function bt_removeProgress(evt) {
    var address = evt.address;
    address = 'address-1';
    var id = 'div[data-id="' + address + '"]';
    var finishedTask = this.transferStatusList.querySelector(id);
    this.transferStatusList.removeChild(finishedTask);
  },
  
  showBanner: function bt_showBanner(isSuccessful) {
    // var app = Applications.getByManifestURL(manifestURL);
    var _ = navigator.mozL10n.get;
    var status = (isSuccessful) ? 'complete' : 'failed';
    this.banner.addEventListener('animationend', function animationend() {
      this.banner.removeEventListener('animationend', animationend);
      this.banner.classList.remove('visible');
    }.bind(this));
    this.banner.classList.add('visible');
    this.bannerContainer.textContent = _('bluetooth-file-transfer-result',
      { status: status });
  },
  
  onTransferComplete: function bt_onTransferComplete(evt) {
    console.log('=== onTransferComplete ===');
    console.log('=== onTransferComplete success (bool) === ' + evt.success);
    console.log('=== onTransferComplete received (bool) === ' + evt.received);
    console.log('=== onTransferComplete filename (string) === ' + evt.filename);
    console.log('=== onTransferComplete filelength (uint32_t) === ' + evt.filelength);
    if (evt.success == true) {
      // Send/Receive File Success --> Show tansferring status 
      // this.showHideStatus(true);
      this.showBanner(true);
      //TODO: Remove transferring task
      this.removeProgress(evt);
    } else { // evt.success == false
      // Send/Receive File Fail --> Show banner
      this.showBanner(false);
      //TODO: Remove transferring task
      this.removeProgress(evt);
    }
    
  },
  
  onUpdateProgress: function bt_onUpdateProgress(mode, evt) {
    switch (mode) {
      case 'start':
        // TODO: Create progress dynamically in notification center
        console.log('=== onUpdateProgress start(): ===');
        this.initProgress(evt);
        break;

      case 'progress':
        console.log('=== onUpdateProgress progress(): ===');
        console.log('=== onUpdateProgress processed (uint32_t) === ' + evt.processed);
        console.log('=== onUpdateProgress filelength (uint32_t) === ' + evt.filelength);
        var address = evt.address;
        var processed = evt.processed;
        var filelength = evt.filelength;
        var progress = 0;
        if (filelength == 0) {
          // Unknow file length
          // TODO: Show an unknow progress
        } else if (processed > filelength) {
          // According Bluetooth spec., the processed is a referenced value only.
          // If processed bigger than file  Show an unknow progress
          window.clearInterval(this.progressTimer);
        } else {
          progress = processed / filelength;
        }
        console.log('=== onUpdateProgress === with progress = ' + progress);
        this.updateProgress(progress);
        if (progress === 1) {
          // this.transferStatus.classList.add('applying');
          // Show banner when transferring task completetly
          // this.showHideStatus(false);
          //TODO: Remove transferring task for test only
          this.removeProgress(evt);
          //TODO: Fire a Notification by Notification Helper
          // this.showBanner(true);
        }
        
        break;
    }
  },
  
  onReceivingFileConfirmation: function bt_onReceivingFileConfirmation(evt) {
    console.log('=== onReceivingFileConfirmation ===');
    console.log('=== onReceivingFileConfirmation address (string) === ' + evt.address);
    console.log('=== onReceivingFileConfirmation filename (string) === ' + evt.filename);
    console.log('=== onReceivingFileConfirmation filelength (uint32_t) === ' + evt.filelength);
    console.log('=== onReceivingFileConfirmation contenttype (string) === ' + evt.contenttype);
    // Prompt appears once an transfer request is received from a paired device.
    this.showReceivePrompt(evt);
  }
  
};

BluetoothTransfer.init();
