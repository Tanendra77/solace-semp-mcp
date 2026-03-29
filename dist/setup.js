"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSetup = runSetup;
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const readline = __importStar(require("readline"));
function sanitizeBrokerName(input) {
    return input.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}
function ask(rl, question) {
    return new Promise(resolve => rl.question(question, resolve));
}
async function askRequired(rl, question) {
    let answer = '';
    while (!answer.trim()) {
        answer = await ask(rl, question);
        if (!answer.trim())
            console.log('  This field is required.');
    }
    return answer.trim();
}
async function runSetup() {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    try {
        console.log('\n  Solace SEMP MCP — Setup\n');
        // 1. Scope
        let scope;
        if (process.argv.includes('--global')) {
            scope = 'global';
        }
        else if (process.argv.includes('--project')) {
            scope = 'project';
        }
        else {
            console.log('  Where should the MCP server be configured?');
            console.log('  [1] Global (all projects)  →  ~/.claude/claude.json');
            console.log('  [2] Project (this folder)  →  .mcp.json\n');
            const choice = await ask(rl, '  Choice [1/2]: ');
            scope = choice.trim() === '2' ? 'project' : 'global';
        }
        const configPath = scope === 'global'
            ? path.join(os.homedir(), '.claude', 'claude.json')
            : path.join(process.cwd(), '.mcp.json');
        console.log(`\n  Configuring for: ${scope} → ${configPath}\n`);
        // 2. Collect brokers
        const envBlock = { MCP_TRANSPORT: 'stdio' };
        let addMore = true;
        while (addMore) {
            console.log('  --- Broker ---\n');
            const rawName = await askRequired(rl, '  Broker name (e.g. PROD, DEV, LOCAL): ');
            const brokerKey = sanitizeBrokerName(rawName);
            if (!brokerKey) {
                console.log('  Invalid name — use letters, numbers, or underscores. Try again.\n');
                continue;
            }
            console.log(`  Key prefix: SEMP_BROKER_${brokerKey}_*\n`);
            const url = await askRequired(rl, '  URL (e.g. http://localhost:8080): ');
            const username = await askRequired(rl, '  Username: ');
            const password = await askRequired(rl, '  Password: ');
            const labelRaw = await ask(rl, `  Label (display name, press enter to use "${brokerKey}"): `);
            const label = labelRaw.trim() || brokerKey;
            envBlock[`SEMP_BROKER_${brokerKey}_URL`] = url;
            envBlock[`SEMP_BROKER_${brokerKey}_USERNAME`] = username;
            envBlock[`SEMP_BROKER_${brokerKey}_PASSWORD`] = password;
            envBlock[`SEMP_BROKER_${brokerKey}_LABEL`] = label;
            const more = await ask(rl, '\n  Add another broker? [y/N]: ');
            addMore = more.trim().toLowerCase() === 'y';
            if (addMore)
                console.log('');
        }
        // 3. Build new entry
        const newEntry = {
            command: 'npx',
            args: ['-y', '@tanendra77/solace-semp-mcp@latest'],
            env: envBlock,
        };
        // 4. Read existing config
        let config = {};
        if (fs.existsSync(configPath)) {
            try {
                config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            }
            catch {
                console.log(`\n  Warning: could not parse existing ${configPath} — will overwrite.\n`);
            }
        }
        if (!config.mcpServers)
            config.mcpServers = {};
        // 5. Handle existing "solace-semp" entry
        if (config.mcpServers['solace-semp']) {
            console.log('\n  An existing "solace-semp" entry was found.');
            console.log('  [1] Merge — add new brokers, keep existing ones');
            console.log('  [2] Overwrite — replace the entry completely');
            console.log('  [3] Cancel\n');
            const choice = await ask(rl, '  Choice [1/2/3]: ');
            if (choice.trim() === '3') {
                console.log('\n  Cancelled — no changes made.\n');
                return;
            }
            if (choice.trim() === '1') {
                const existing = config.mcpServers['solace-semp'];
                config.mcpServers['solace-semp'] = {
                    ...existing,
                    env: { ...(existing.env ?? {}), ...envBlock },
                };
            }
            else {
                config.mcpServers['solace-semp'] = newEntry;
            }
        }
        else {
            config.mcpServers['solace-semp'] = newEntry;
        }
        // 6. Write
        const dir = path.dirname(configPath);
        if (!fs.existsSync(dir))
            fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
        console.log(`\n  ✓ Written to ${configPath}`);
        console.log('  → Restart Claude Code to activate the MCP server.');
        console.log('  → Run again anytime to add more brokers.\n');
    }
    finally {
        rl.close();
    }
}
//# sourceMappingURL=setup.js.map