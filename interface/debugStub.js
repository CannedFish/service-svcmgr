// This file is auto generated based on user-defined interface.
// Please make sure that you have checked all TODOs in this file.
// TODO: please replace types with peramters' name you wanted of any functions
// TODO: please replace $ipcType with one of dbus, binder, websocket and socket

var initObj = {
  "address": "nodejs.webde.svcmgr",
  "path": "/nodejs/webde/svcmgr",
  "name": "nodejs.webde.svcmgr.debug",
  "type": "dbus",
  "service": true,
  "interface": [
    {
      "name": "list",
      "in": [],
      "show": "l"
    },
    {
      "name": "stop",
      "in": [
        "Array"
      ],
      "show": "l"
    },
    {
      "name": "restart",
      "in": [
        "Array"
      ],
      "show": "l"
    }
  ],
  "serviceObj": {
    list: function(callback) {
      debug.list(function(err, list) {
        if(err) return callback({err: err});
        callback({ret: list});
      });
    },
    stop: function(nameList, callback) {
      debug.stop(nameList, function(err, res) {
        if(err) return callback({err: err});
        callback({ret: res});
      });
    },
    restart: function(nameList, callback) {
      debug.restart(nameList, function(err, res) {
        if(err) return callback({err: err});
        callback({ret: res});
      });
    }
  }
}

function Stub() {
  this._ipc = require('webde-rpc').getIPC(initObj);
}

Stub.prototype.notify = function(event) {
  this._ipc.notify.apply(this._ipc, arguments);
};

var stub = null,
    debug = null;
exports.getStub = function(debug_) {
  if(stub == null) {
    stub = new Stub();
    debug = debug_;
  }
  return stub;
}
