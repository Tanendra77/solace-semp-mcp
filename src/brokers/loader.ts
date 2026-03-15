import fs from 'fs';
import path from 'path';
import { Broker, BrokersConfig } from './types';
import { logger } from '../logger';

export function loadBrokersFromFile(filePath: string): Broker[] {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) { logger.info(`No brokers.json at ${resolved}, skipping.`); return []; }
  try {
    const config: BrokersConfig = JSON.parse(fs.readFileSync(resolved, 'utf-8'));
    logger.info(`Loaded ${config.brokers.length} broker(s) from ${resolved}`);
    return config.brokers;
  } catch (err) { logger.warn(`Failed to parse brokers.json: ${String(err)}`); return []; }
}

export function loadBrokersFromEnv(): Broker[] {
  const map = new Map<string, Partial<Broker>>();
  for (const [key, value] of Object.entries(process.env)) {
    if (!value) continue;
    const match = /^SEMP_BROKER_([A-Z0-9_]+)_(URL|USERNAME|PASSWORD|LABEL)$/.exec(key);
    if (!match) continue;
    const name = match[1]!.toLowerCase();
    if (!map.has(name)) map.set(name, { name });
    const b = map.get(name)!;
    const field = match[2]!;
    if (field === 'URL') b.url = value;
    else if (field === 'USERNAME') b.username = value;
    else if (field === 'PASSWORD') b.password = value;
    else if (field === 'LABEL') b.label = value;
  }
  const result: Broker[] = [];
  for (const [name, p] of map) {
    if (p.url && p.username && p.password)
      result.push({ name, label: p.label ?? name, url: p.url, username: p.username, password: p.password });
    else logger.warn(`Incomplete env broker "${name}" — needs URL, USERNAME, PASSWORD`);
  }
  return result;
}

export function mergeBrokers(fileBrokers: Broker[], envBrokers: Broker[]): Broker[] {
  const merged = new Map<string, Broker>();
  for (const b of fileBrokers) merged.set(b.name.toLowerCase(), b);
  for (const b of envBrokers) merged.set(b.name.toLowerCase(), b);
  return Array.from(merged.values());
}
