import React, { useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, Activity, MapPin, Building2, Trash2 } from 'lucide-react';
import { parseCSV } from './utils/csvParser';
import { WasteFacility } from './types';
import { SAMPLE_CSV_DATA } from './constants';
import { StatsCard } from './components/StatsCard';
import { StateDistributionChart, CategoryPieChart, GeoScatterChart } from './components/Charts';
import { ChatInterface } from './components/ChatInterface';
import { RiskAnalysis } from './components/RiskAnalysis';

const App: React.FC = () => {
  const [data, setData] = useState<WasteFacility[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLoading(true);
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        try {
          const parsed = await parseCSV(text);
          setData(parsed);
        } catch (err) {
          console.error("Gagal memproses", err);
          alert("Ralat memproses fail CSV.");
        } finally {
          setLoading(false);
        }
      };
      reader.readAsText(file);
    }
  };

  const loadSampleData = async () => {
    setLoading(true);
    setFileName("Data_Pengurusan_Sisa_Malaysia.csv");
    try {
      // Sedikit masa pendam untuk UX yang lebih lancar
      await new Promise(r => setTimeout(r, 500));
      const parsed = await parseCSV(SAMPLE_CSV_DATA);
      setData(parsed);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Muat data secara automatik apabila aplikasi dibuka
  useEffect(() => {
    loadSampleData();
  }, []);

  const totalSites = data.length;
  const sanitarySites = data.filter(d => d.kat_fasili && d.kat_fasili.toLowerCase().includes('sanitari') && !d.kat_fasili.toLowerCase().includes('bukan')).length;
  const nonSanitarySites = data.filter(d => d.kat_fasili && d.kat_fasili.toLowerCase().includes('bukan')).length;
  const transferStations = data.filter(d => d.kat_fasili && d.kat_fasili.toLowerCase().includes('stesen')).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Navbar */}
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Trash2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">EcoInsight AI</span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={loadSampleData}
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                Reset Data
              </button>
              <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2">
                <Upload size={16} />
                <span>Muat Naik CSV</span>
                <input 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!data.length && !loading ? (
          <div className="flex flex-col items-center justify-center h-[600px] border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/50">
            <FileSpreadsheet className="w-16 h-16 text-slate-600 mb-4" />
            <h2 className="text-2xl font-semibold text-white mb-2">Memuatkan Data...</h2>
            <p className="text-slate-400 mb-6 max-w-md text-center">
              Sila tunggu sebentar sementara sistem memproses data fasiliti.
            </p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center h-[600px]">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400">Memproses Data...</p>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Header Status */}
            <div className="flex items-center justify-between">
               <div>
                  <h1 className="text-2xl font-bold text-white">Papan Pemuka Analisis</h1>
                  <p className="text-slate-400 text-sm mt-1">
                    Menganalisis <span className="text-indigo-400 font-mono">{fileName}</span> • {data.length} rekod ditemui
                  </p>
               </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard 
                title="Jumlah Fasiliti" 
                value={totalSites} 
                icon={Building2} 
                color="text-indigo-400 bg-indigo-400/10" 
              />
              <StatsCard 
                title="TP Sanitari" 
                value={sanitarySites} 
                icon={Activity} 
                color="text-green-400 bg-green-400/10" 
              />
              <StatsCard 
                title="Bukan Sanitari" 
                value={nonSanitarySites} 
                icon={Trash2} 
                color="text-red-400 bg-red-400/10" 
              />
              <StatsCard 
                title="Stesen Pemindahan" 
                value={transferStations} 
                icon={MapPin} 
                color="text-amber-400 bg-amber-400/10" 
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Visualizations */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Critical Risks Table - Newly Added */}
                <RiskAnalysis data={data} />

                {/* Row 1: State & Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                    <h3 className="text-lg font-semibold text-white mb-4">Fasiliti Mengikut Negeri</h3>
                    <StateDistributionChart data={data} />
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                    <h3 className="text-lg font-semibold text-white mb-4">Kategori Fasiliti</h3>
                    <CategoryPieChart data={data} />
                  </div>
                </div>

                {/* Row 2: Geospatial */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">Taburan Geospatial (Lon/Lat)</h3>
                  <p className="text-xs text-slate-500 mb-4">Pemetaan koordinat fasiliti merentas wilayah.</p>
                  <GeoScatterChart data={data} />
                </div>
              </div>

              {/* Right Column: AI Agent */}
              <div className="lg:col-span-1">
                <ChatInterface data={data} />
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;