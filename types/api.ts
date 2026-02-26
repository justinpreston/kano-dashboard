// Types for Kano Dashboard API responses

export interface SystemStats {
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  uptime: number;
}

export interface Session {
  id: string;
  label: string;
  created: string;
  lastActivity: string;
  messageCount: number;
  tokenUsage?: number;
  cost?: number;
}

export interface CronJob {
  id: string;
  label: string;
  schedule: string;
  nextRun: string;
  lastRun?: string;
  status: 'active' | 'paused' | 'error';
}

export interface Activity {
  id: string;
  timestamp: string;
  type: string;
  description: string;
  status: 'success' | 'error' | 'pending';
}

export interface MemoryFile {
  path: string;
  name: string;
  lastModified: string;
  size: number;
}

export interface CostData {
  totalCost: number;
  totalTokens: number;
  breakdown: {
    model: string;
    tokens: number;
    cost: number;
  }[];
}
