"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAllTools = registerAllTools;
const broker_tools_1 = require("./broker-tools");
const monitor_tools_1 = require("./monitor-tools");
const queue_tools_1 = require("./queue-tools");
const client_tools_1 = require("./client-tools");
const acl_tools_1 = require("./acl-tools");
const diagnostic_tools_1 = require("./diagnostic-tools");
const passthrough_1 = require("./passthrough");
function registerAllTools(server, registry) {
    (0, broker_tools_1.registerBrokerTools)(server, registry);
    (0, monitor_tools_1.registerMonitorTools)(server, registry);
    (0, queue_tools_1.registerQueueTools)(server, registry);
    (0, client_tools_1.registerClientTools)(server, registry);
    (0, acl_tools_1.registerAclTools)(server, registry);
    (0, diagnostic_tools_1.registerDiagnosticTools)(server, registry);
    (0, passthrough_1.registerPassthroughTool)(server, registry);
}
//# sourceMappingURL=index.js.map