/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

define(function(require) {
  /*
   * PairExpiredDialog is responsible for:
   *   Notify a user that the earlier pairing request which fired in
   *   notification center is expired. There is a prompt handling via here.
   */
  var PairExpiredDialog = {
    init: function() {
      this.dialog = document.getElementById('pairing-request-timeout');
      this.confirmBtn =
        document.getElementById('incoming-pairing-timeout-confirm');
    },

    showConfirm: function(callback) {
      var self = this;
      this.confirmBtn.onclick = function() {
        self.close();
        if (callback) {
          callback();
        }
      };
      this.dialog.hidden = false;
    },

    get isVisible() {
      return (!this.dialog.hidden);
    },

    close: function() {
      this.dialog.hidden = true;
    }
  };

  return PairExpiredDialog;
});

// navigator.mozL10n.once(function() {
//   require(['pair_expired_dialog'], function(PairExpiredDialog) {
//     PairExpiredDialog.init();
//   });
// });
