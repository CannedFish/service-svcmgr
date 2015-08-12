var child = require('child_process'),
    util = require('util'),
    INNER_PROXY_PATH = '/interface/proxy',
    noop = function() {};

function __bind2Remote(mode, svcName, svcProxy) {
  svcmgr.getService('commdaemon', 'local', function(err, path) {
    if(err) return util.log(err);
    var cd = require(path).getProxy(),
        arg = [];
    if(mode == 0) { // a service aquires actively.
      arg[svcName] = svcProxy;
    } else { // bind services start up before commdaemon
      var list = svcmgr._svcList,
          arg = [];
      for(var key in svcmgr) {
        if(list[key].remote) {
          arg[key] = list[key].path + INNER_PROXY_PATH;
        }
      }
    }
    cd.register(arg, function(ret) {
      if(ret.err) util.log('Fail to bind on commdaemon: ' + ret.err);
    });
  });
}

function __unbindFromRemote(svcName) {
  svcmgr.getService('commdaemon', 'local', function(err, path) {
    if(err) return util.log(err);
    var cd = require(path).getProxy();
    cd.unregister(svcName, function(ret) {
      if(ret.err) util.log('Fail to unbind from commdaemon: ' + ret.err);
    });
  });
}

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
  if(svcName == 'commdaemon') {
    __bind2Remote(1);
  } else {
    if(svcDes.remote)
      __bind2Remote(0, svcName, svcDes.path + INNER_PROXY_PATH);
  }
}

function __svcTerm(svcName) {
  if(svcmgr._svcList[svcName] && svcmgr._svcList[svcName].status == 'running') {
    // kill this svc process
    svcmgr._svcList[svcName].proc.kill('SIGKILL');
  }
}

function __svcDelete(svcName) {
  if(svcmgr._svcList[svcName] && svcmgr._svcList[svcName].status == 'stopped') {
    __unbindFromRemote(svcName);
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

function __status(svcName) {
  var svc = svcmgr._svcList[svcName];
  if(typeof svc !== 'undefined') {
    return svc.status;
  }
  return null;
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

SvcMgr.prototype.checkService = function(svcName, addr, callback) {
  // var cb = callback || noop;
  // TODO: some permission checking
  this.getService.apply(this, arguments);
}

SvcMgr.prototype.getService = function(svcName, addr, callback) {
  var cb = callback || noop;
  console.log(svcName, 'status:', __status(svcName), arguments);
  if(__status(svcName) == 'running') {
    var ret = this._svcList[svcName].path + INNER_PROXY_PATH;
    if(addr != 'local') {
      if(__status('commdaemon') != 'running') {
        cb('commdaemon is not running!');
      } else {
        cb(null, ret + 'remote');
      }
    } else {
      cb(null, ret);
    }
  } else {
    cb(svcName + ' is not running!');
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

