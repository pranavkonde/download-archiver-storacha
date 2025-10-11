export interface User {
  id: string;
  name: string;
  avatar?: string;
  lastActivity: number;
  sessionExpiry: number;
  email: `${string}`;
  spaceDid?: `did:${string}:${string}`;
}

export interface StorachaFile {
  id: string;
  name: string;
  cid: string;
  size: number;
  type: string;
  mimeType: string;
  created: Date;
  tags: string[];
  isPublic: boolean;
  downloadCount: number;
}

export interface FilterState {
  search: string;
  fileType: string;
  dateRange: string;
  tags: string[];
  sortBy: 'name' | 'date' | 'size' | 'downloads';
  sortOrder: 'asc' | 'desc';
}

export type ViewMode = 'grid' | 'list';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}