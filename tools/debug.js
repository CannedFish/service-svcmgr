#!/usr/bin/env node

var action = process.argv[2] || '--list',
    debug = require('../interface/debugProxy').getProxy();

debug.list(function(ret) {
  if(ret.err) {
    console.log('Error: ', ret.err);
    process.exit(1);
  }
  console.log('%d services are running:', ret.ret.length);
  console.log('========================================\n');
  for(var i = 0; i < ret.ret.length; ++i) {
    console.log(' %d. %s', i + 1, ret.ret[i]);
  }
  console.log('\n========================================\n');
  if(action == '--list' || action == '-l') process.exit(0);

  if(ret.ret.length == 0) {
    console.log('No services are running.');
    process.exit(1);
  }
  if(action == '--stop' || action == '-s') {
    console.log('Please select services to stop(separated by a space):');
  } else if(action == '--restart' || action == '-r') {
    console.log('Please select services to restart(separated by a space):');
  } else {
    console.log('Paramters: -l/--list      list all running services');
    console.log('           -s/--stop      stop one or more running services');
    console.log('           -r/--restart   restart one or more running services');
    process.exit(1);
  }

  var actionCB = function(ret) {
    if(ret.err) {
      console.log('Error: ', ret.err);
      process.exit(1);
    }
    console.log('Result:');
    for(var key in ret.ret) {
      console.log(' %s ==> %s', key, ret.ret[key].status);
    }
    process.exit(0);
  }
  process.stdout.write('>>> ');
  process.stdin.setEncoding('utf8');
  process.stdin.on('readable', function() {
    var chunk = process.stdin.read();
    if(chunk !== null) {
      var input = (chunk + '').replace(/\n/g, '').split(' '),
          todo = [];
      for(var i = 0; i < input.length; ++i) {
        var seq = input[i] - 1;
        if(seq < ret.ret.length && seq >= 0) {
          todo.push(ret.ret[seq]);
        }
      }
      if(todo.length == 0) {
        console.error('No valid selection!!');
        process.exit(1);
      }
      if(action == '--stop' || action == '-s') {
        debug.stop(todo, actionCB);
      } else {
        debug.restart(todo, actionCB);
      }
    }
  });
});

