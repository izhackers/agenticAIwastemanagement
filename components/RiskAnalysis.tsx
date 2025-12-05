import React from 'react';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { WasteFacility } from '../types';

interface RiskAnalysisProps {
  data: WasteFacility[];
}

export const RiskAnalysis: React.FC<RiskAnalysisProps> = ({ data }) => {
  // Filter and sort for over-capacity sites
  const criticalSites = data
    .filter(site => site.capacity_num > 0 && site.usage_num > site.capacity_num)
    .sort((a, b) => b.utilization_rate - a.utilization_rate)
    .slice(0, 5);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-red-500/10 p-2 rounded-lg">
           <AlertTriangle className="w-5 h-5 text-red-500" />
        </div>
        <div>
           <h3 className="text-lg font-semibold text-white">Amaran Kapasiti Kritikal</h3>
           <p className="text-sm text-slate-400">5 Fasiliti Utama melebihi kapasiti reka bentuk (Penggunaan > 100%)</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-700 text-xs text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-2">Nama Fasiliti</th>
              <th className="py-3 px-2">Negeri</th>
              <th className="py-3 px-2 text-right">Kapasiti</th>
              <th className="py-3 px-2 text-right">Beban Semasa</th>
              <th className="py-3 px-2 text-right">Penggunaan</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-800">
            {criticalSites.length > 0 ? (
              criticalSites.map((site, idx) => (
                <tr key={idx} className="group hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-2 font-medium text-white">{site.nama_fasil}</td>
                  <td className="py-3 px-2 text-slate-400">{site.negeri}</td>
                  <td className="py-3 px-2 text-right text-slate-300">{site.capacity_num.toLocaleString()}</td>
                  <td className="py-3 px-2 text-right text-slate-300">{site.usage_num.toLocaleString()}</td>
                  <td className="py-3 px-2 text-right">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 text-red-400 text-xs font-semibold">
                      <TrendingUp size={12} />
                      {site.utilization_rate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  Tiada fasiliti kritikal dikesan dalam set data semasa.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};