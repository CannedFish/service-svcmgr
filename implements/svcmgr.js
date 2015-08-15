var child = require('child_process'),
    util = require('util'),
    fs = require('fs'),
    LOG_PATH = process.env.HOME + '/.custard/servlog/',
    INNER_PROXY_PATH = '/interface/proxy',
    noop = function() {};

function __bind2Remote(mode, svcName, svcProxy) {
  svcmgr.getService('commdaemon', 'local', function(err, path) {
    if(err) return util.log(err);
    var cd = require(path).getProxy(),
        arg = [], r = false;
    if(mode == 0) { // a service aquires actively.
      arg[svcName] = svcProxy;
      r = true;
    } else { // bind services start up before commdaemon
      var list = svcmgr._svcList,
          arg = [];
      for(var key in list) {
        if(list[key].remote) {
          r = true;
          arg[key] = list[key].path + INNER_PROXY_PATH;
        }
      }
    }
    if(r) {
      console.log('__bind2Remote: ', arg);
      cd.register(arg, function(ret) {
        if(ret.err) util.log('Fail to bind on commdaemon: ' + ret.err);
      });
    }
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
  // TODO: remove later
  // var childProc = child.fork(svcDes.path, svcDes.args);
  var childProc = child.spawn('node', [svcDes.path].concat(svcDes.args), {
    stdio: ['ignore', fs.openSync(LOG_PATH + svcName + '.log', 'a'), 'ignore']
  });
  childProc.on('error', function(err) {
    // TODO: Log this error, handle error based on error type, start up error
    util.log('Child Process Error:' + err);
  }).on('exit', function(code, signal) {
    // TODO: Log informations
    util.log(svcName + ' exited with code ' + code + ' by ' + signal);
    svcmgr._svcList[svcName].status = 'stopped';
    if(code != 0) {
      util.log(svcName + ' exited unexecpted, restarting...');
      var name = this.name,
          svc = svcmgr._svcList[this.name];
      process.nextTick(function() {
        __svcNew(name, {
          path: svc.path,
          args: svc.args,
          remote: svc.remote
        });
      });
    }
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
  if(__status(svcName) == 'running') {
    var svc = svcmgr._svcList[svcName];
    // kill this svc process
    svc.proc.kill('SIGTERM');
    svc.status = 'killing';
  }
}

function __svcDelete(svcName) {
  if(svcmgr._svcList[svcName] && svcmgr._svcList[svcName].status == 'stopped') {
    __unbindFromRemote(svcName);
    svcmgr._svcList[svcName] = null;
    delete svcmgr._svcList[svcName];
  }
}

function __svcmgrExit() {
  for(var svc in svcmgr._svcList) {
    // TODO: save to restore?
    __svcTerm(svc);
  }
  process.exit(0);
}
/* TODO: remove later since now use spawn to replace fork
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
*/
function __status(svcName, status) {
  var svc = svcmgr._svcList[svcName];
  if(typeof svc !== 'undefined') {
    if(!status)
      return svc.status;
    svc.status = status;
    return svc.status;
  }
  return null;
}

function SvcMgr() {
  this._svcList = [];
  process.on('exit', function(code) {
    util.log('Process exit');
  }).on('uncaughtException', function(err) {
    util.log('Caught Exception: ' + err);
    console.trace(err);
  }).on('SIGTERM', __svcmgrExit).on('SIGINT', __svcmgrExit);
}

SvcMgr.prototype.addService = function(svcName, svcDes, callback) {
  var cb = callback || noop;
  // TODO: notify 'service added'
  if(__status(svcName) == 'running')
    return process.nextTick(function() {
      cb('Service ' + svcName + ' already added!');
    });
  if(typeof svcDes !== 'object')
    return process.nextTick(function() {
      cb('Argument 1 must be an object!');
    });
  if(typeof svcDes.path === 'undefined')
    return process.nextTick(function() {
      cb('Property \'path\' of argument 1 is undefined!');
    });
  __svcNew(svcName, svcDes);
  process.nextTick(function() {
    cb(null);
  });
}

SvcMgr.prototype.listService = function(callback) {
  var cb = callback || noop,
      list = [];
  for(var key in this._svcList) {
    if(__status(key) == 'running')
      list.push(key);
  }
  process.nextTick(function() {
    cb(null, list);
  });
}

SvcMgr.prototype.checkService = function(svcName, addr, callback) {
  // var cb = callback || noop;
  // TODO: some permission checking
  this.getService.apply(this, arguments);
}

SvcMgr.prototype.getService = function(svcName, addr, callback) {
  var cb = callback || noop;
  // console.log(svcName, 'status:', __status(svcName), arguments);
  if(__status(svcName) == 'running') {
    var ret = this._svcList[svcName].path + INNER_PROXY_PATH;
    if(addr != 'local') {
      if(__status('commdaemon') != 'running') {
        process.nextTick(function() {
          cb('commdaemon is not running!');
        });
      } else {
        process.nextTick(function() {
          cb(null, ret + 'remote');
        });
      }
    } else {
      process.nextTick(function() {
        cb(null, ret);
      });
    }
  } else {
    process.nextTick(function() {
      cb(svcName + ' is not running!');
    });
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

function __stop(nameList, callback) {
  if(svcmgr == null)
    return console.error('Error: service manager is not running.');
  var list = svcmgr._svcList,
      n = nameList.length,
      res = {},
      cb = callback || noop;
  for(var i = 0; i < nameList.length; ++i) {
    var svc = nameList[i];
    if(__status(svc) == 'running') {
      res[svc] = {};
      res[svc].path = list[svc].path;
      res[svc].args = list[svc].args;
      res[svc].remote = list[svc].remote;
      list[svc].proc.on('exit', function(code, signal) {
        res[svc].status = 'stopped';
        if(--n == 0) {
          process.nextTick(function() {
            cb(null, res);
          });
        }
      });
      __svcTerm(svc);
    } else {
      res[svc].status = 'not running';
      --n;
    }
  }
}

exports.DEBUG = {
  list: function(callback) {
    if(svcmgr == null)
      return console.error('Error: service manager is not running.');
    svcmgr.listService(callback);
  },
  stop: __stop,
  restart: function(nameList, callback) {
    if(svcmgr == null)
      return console.error('Error: service manager is not running.');
    var cb = callback || noop;
    __stop(nameList, function(err, ret) {
      var n = nameList.length,
          rets = {};
      for(var i = 0; i < nameList.length; ++i) {
        var svc = nameList[i];
        rets[svc] = {};
        if(ret[svc].status == 'stopped') {
          svcmgr.addService(svc, ret[svc], function(err) {
            if(err) rets[svc] = err;
            else rets[svc].status = 'OK';
            if(--n == 0)
            process.nextTick(function() {
              cb(null, rets);
            });
          });
        } else {
          rets[svc].status = ret[svc].status;
          --n;
        }
      }
    });
  }
}

