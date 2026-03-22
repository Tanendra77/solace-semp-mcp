import { BrokerRegistry } from '../../src/brokers/registry';
import { SempClient } from '../../src/semp/client';
import { handleListAclProfiles, handleDeleteAclProfile, handleCreateClientUsername } from '../../src/tools/acl-tools';
jest.mock('../../src/semp/client');

const broker = { name: 'test', label: 'Test', url: 'http://x', username: 'a', password: 'b' };
const registry = new BrokerRegistry([broker]);
beforeEach(() => { jest.clearAllMocks(); });

describe('handleListAclProfiles', () => {
  it('returns JSON list', async () => {
    (SempClient.prototype.request as jest.Mock).mockResolvedValue({ data: [{ aclProfileName: 'default' }], meta: { count: 1 } });
    const r = await handleListAclProfiles(registry, 'test', 'default', 50);
    expect(r).toContain('aclProfileName');
  });
});

describe('handleDeleteAclProfile', () => {
  it('dry_run contains "cannot be undone"', async () => {
    const r = await handleDeleteAclProfile(registry, 'test', 'default', 'myProfile', false);
    expect(r).toContain('cannot be undone');
  });
  it('executes with confirm', async () => {
    (SempClient.prototype.request as jest.Mock).mockResolvedValue({ data: {} });
    const r = await handleDeleteAclProfile(registry, 'test', 'default', 'myProfile', true);
    expect(r).toContain('[EXECUTED]');
  });
});

describe('handleCreateClientUsername', () => {
  it('dry_run without confirm', async () => {
    const r = await handleCreateClientUsername(registry, 'test', 'default', { clientUsername: 'user1' }, false);
    expect(r).toContain('[DRY RUN]');
  });
});
