var child = require('child_process'),
    util = require('util'),
    noop = function() {};

function __svcNew(svcName, svcDes) {
  var childProc = child.fork(svcDes.path, svcDes.args);
  childProc.on('error', function(err) {
    // TODO: Log this error, handle error based on error type, start up error
  }).on('exit', function(code, signal) {
    // TODO: Log informations
    svcmgr._svcList[svcName].status = 'stopped';
    __svcDelete(svcName);
  });
  svcmgr._svcList[svcName] = svcDes;
  svcmgr._svcList[svcName].proc = childProc;
  svcmgr._svcList[svcName].proc.name = svcName;
  svcmgr._svcList[svcName].status = 'running';
}

function __svcTerm(svcName) {
  if(svcmgr._svcList[svcName] && svcmgr._svcList[svcName].status == 'running') {
    // kill this svc process
    svcmgr._svcList[svcName].proc.kill('SIGKILL');
  }
}

function __svcDelete(svcName) {
  if(svcmgr._svcList[svcName] && svcmgr._svcList[svcName].status == 'stopped') {
    svcmgr._svcList[svcName] = null;
    delete svcmgr._svcList[svcName];
  }
}

function __broadcastMsg(msg) {
  // broadcast a msg to all svc
  var list = svcmgr._svcList;
  for(var key in list) {
    list[key].proc.send(msg);
  }
}

function __sendMsg(svcName, msg) {
  // send a msg to a dedicated service like commdaemon etc.
  var svc = svcmgr._svcList[svcName];
  svc.proc.send(msg);
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

// TODO: add an argument
SvcMgr.prototype.getService = function(svcName, callback) {
  var cb = callback || noop;
  if(typeof this._svcList[svcName] != 'undefined') {
    if(this._svcList[svcName].proc.status != 'stopped') {
      cb(null, this._svcList[svcName].path + '/interface/' + svcName + 'Proxy');
    } else {
      cb('Service stopped!');
    }
  } else {
    cb('Service not found!');
  }
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

