// initialize
var svcmgr = require('./implements/svcmgr').instance();
// publish
var stub = require('./interface/svcmgrStub').getStub(svcmgr);
require('./implements/svcmgr').setStub(stub);

