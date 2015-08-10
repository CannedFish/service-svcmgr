var child = require('child_process'),
    noop = function() {};

function __svcNew(svcName, svcDes) {
  var childProc = child.fork(svcDes.path, svcDes.args);
  childProc.on('error', function(err) {
    // TODO: Log this error, handle error based on error type
  }).on('exit', function(code, signal) {
    // TODO: Log informations
    __svcDelete(svcName, (code == null ? false : true));
  });
  svcmgr._svcList[svcName] = svcDes;
  svcmgr._svcList[svcName].proc = childProc;
}

function __svcDelete(svcName, killProc) {
  if(svcmgr._svcList[svcName]) {
    if(killProc) {
      // kill this svc process
      svcmgr._svcList[svcName].proc.kill('SIGKILL');
    }
    svcmgr._svcList[svcName] = null;
    delete svcmgr._svcList[svcName];
  }
}

function __broadcastMsg(msg) {
  // TODO: broadcast a msg to all svc
}

function __sendMsg(svcName, msg) {
  // TODO: send a msg to a dedicated service like commdaemon etc.
}

function SvcMgr() {
  this._svcList = [];
}

SvcMgr.prototype.addService = function(svcName, svcDes, callback) {
  var cb = callback || noop;
  // TODO: notify 'service added'
  if(typeof this._svcList[svcName] !== 'undefined')
    return cb('Service ' + svcName + ' already added!');
  if(typeof svcDes !== 'object')
    return cb('Argument 1 must be an object!');
  if(typeof svcDes.path === 'undefined')
    return cb('Property \'path\' of argument 1 is undefined!');
  __svcNew(svcName, svcDes);
  cb(null);
}

SvcMgr.prototype.listService = function(callback) {
  var cb = callback || noop,
      list = [];
  for(var key in this._svcList) {
    list.push(key);
  }
  cb(null, list);
}

SvcMgr.prototype.checkService = function(svcName, callback) {
  // var cb = callback || noop;
  // TODO: some permission checking
  this.getService(svcName, callback);
}

SvcMgr.prototype.getService = function(svcName, callback) {
  var cb = callback || noop;
}

var svcmgr = null,
    stub = null;
exports.instance = function() {
  if(svcmgr == null) {
    svcmgr = new SvcMgr();
  }
  return svcmgr;
}

exports.setStub = function(stub_) {
  stub = stub_;
}

