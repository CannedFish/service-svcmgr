// This file is auto generated based on user-defined interface.
// Please make sure that you have checked all TODOs in this file.
// TODO: please replace types with peramters' name you wanted of any functions
// TODO: please replace $ipcType with one of dbus, binder, websocket and socket

var initObj = {
  "address": "nodejs.webde.svcmgr",
  "path": "/nodejs/webde/svcmgr",
  "name": "nodejs.webde.svcmgr",
  "type": "dbus",
  "service": true,
  "interface": [
    {
      "name": "addService",
      "in": [
        "String",
        "Object"
      ],
      "show": "l"
    },
    {
      "name": "listService",
      "in": [],
      "show": "l"
    },
    {
      "name": "checkService",
      "in": [
        "String",
        "String"
      ],
      "show": "l"
    },
    {
      "name": "getService",
      "in": [
        "String"
      ],
      "show": "l"
    }
  ],
  "serviceObj": {
    addService: function(svcName, svcDes, callback) {
      svcmgr.addService(svcName, svcDes, function(err) {
        if(err) return callback({err: err});
        callback({});
      });
    },
    listService: function(callback) {
      svcmgr.listService();
    },
    checkService: function(String, String, callback) {
      svcmgr.checkService();
    },
    getService: function(String, callback) {
      svcmgr.getService();
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
    svcmgr = null;
exports.getStub = function(svcMgr) {
  if(stub == null) {
    svcmgr = svcMgr;
    stub = new Stub();
  }
  return stub;
}

