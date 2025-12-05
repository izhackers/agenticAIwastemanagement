import Papa from 'papaparse';
import { WasteFacility } from '../types';

const parseCleanNumber = (value: string | number): number => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  // Remove commas, handle "TM" (Tiada Maklumat), handle units like "m3"
  const str = String(value).toUpperCase().replace(/,/g, '');
  
  if (str.includes('TM') || str === '-') return 0;
  
  // Extract first valid floating point number found
  const match = str.match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[0]) : 0;
};

export const parseCSV = (fileContent: string): Promise<WasteFacility[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        const parsedData = results.data.map((row: any) => {
          const capacity_num = parseCleanNumber(row.kapasiti_r);
          const usage_num = parseCleanNumber(row.anggaran_k);
          
          return {
            negeri: row.negeri || 'Tidak Diketahui',
            seliaan: row.seliaan || '-',
            nama_fasil: row.nama_fasil || 'Fasiliti Tidak Dinamakan',
            kat_fasili: row.kat_fasili || 'Tidak Dikategorikan',
            pemilik_ta: row.pemilik_ta || '-',
            pbt: row.pbt || '-',
            operator: row.operator || '-',
            tahun_mula: row.tahun_mula || '-',
            tahun_tama: row.tahun_tama || '-',
            alamat: row.alamat || '-',
            daerah: row.daerah || '-',
            parlimen: row.parlimen || '-',
            keluasan_h: typeof row.keluasan_h === 'number' ? row.keluasan_h : 0,
            kapasiti_r: row.kapasiti_r || '-',
            anggaran_k: row.anggaran_k || '-',
            x: typeof row.x === 'number' ? row.x : parseFloat(row.x) || 0,
            y: typeof row.y === 'number' ? row.y : parseFloat(row.y) || 0,
            
            // Calculated fields
            capacity_num,
            usage_num,
            utilization_rate: capacity_num > 0 ? (usage_num / capacity_num) * 100 : 0
          } as WasteFacility;
        });
        resolve(parsedData);
      },
      error: (error: any) => {
        reject(error);
      }
    });
  });
};