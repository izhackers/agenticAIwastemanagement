export interface WasteFacility {
  negeri: string;
  seliaan: string;
  nama_fasil: string;
  kat_fasili: string;
  pemilik_ta: string;
  pbt: string;
  operator: string;
  tahun_mula: string | number;
  tahun_tama: string | number;
  alamat: string;
  daerah: string;
  parlimen: string;
  keluasan_h: number; // Area in hectares
  kapasiti_r: string; // Capacity (raw string)
  anggaran_k: string; // Estimated cost/volume (raw string)
  x: number; // Longitude
  y: number; // Latitude
  
  // Parsed Numeric Values for Analysis
  capacity_num: number; 
  usage_num: number;
  utilization_rate: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

export enum AnalysisType {
  GENERAL = 'General Overview',
  CAPACITY = 'Capacity & Risks',
  GEOSPATIAL = 'Geospatial Distribution'
}