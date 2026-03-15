export interface Broker { name: string; label: string; url: string; username: string; password: string; }
export interface BrokerPublic { name: string; label: string; url: string; }
export interface BrokersConfig { brokers: Broker[]; }
