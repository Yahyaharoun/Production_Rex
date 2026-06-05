import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PrintableReportProps {
  periodLabel: string;
  generatedBy: string;
  statsByAgence: any[];
  globalRevenue: number;
  globalExpense: number;
  globalNet: number;
  globalFuel: number;
  globalWash: number;
  globalOther: number;
  totalTickets: number;
  totalVoyages: number;
  fuelRecords: any[];
  washRecords: any[];
  otherRecords: any[];
}

export const PrintableReport = React.forwardRef<HTMLDivElement, PrintableReportProps>(({
  periodLabel, generatedBy, statsByAgence, globalRevenue, globalExpense, globalNet,
  globalFuel, globalWash, globalOther, totalTickets, totalVoyages,
  fuelRecords, washRecords, otherRecords
}, ref) => {

  const COLORS = ['#ef4444', '#3b82f6', '#eab308'];

  const pieData = [
    { name: 'Carburant', value: globalFuel, color: COLORS[0] },
    { name: 'Lavage', value: globalWash, color: COLORS[1] },
    { name: 'Autres Dépenses', value: globalOther, color: COLORS[2] }
  ].filter(d => d.value > 0);

  const formatCFA = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  const barData = statsByAgence.map(a => ({
    name: a.name,
    net: a.net
  }));

  const ExecutiveSummary = () => (
    <div className="grid grid-cols-5 gap-4">
      <div className="border border-green-200 bg-green-50 rounded-lg p-4 flex flex-col items-center justify-center text-center">
        <div className="bg-green-600 text-white rounded-full p-2 mb-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <div className="text-xs font-bold text-green-700 uppercase">Recette Totale</div>
        <div className="text-xl font-black">{formatCFA(globalRevenue)} FCFA</div>
        <div className="text-[10px] text-muted-foreground mt-1">Total des recettes générées</div>
      </div>
      <div className="border border-red-200 bg-red-50 rounded-lg p-4 flex flex-col items-center justify-center text-center">
        <div className="bg-red-500 text-white rounded-full p-2 mb-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
        </div>
        <div className="text-xs font-bold text-red-700 uppercase">Dépenses Totales</div>
        <div className="text-xl font-black">{formatCFA(globalExpense)} FCFA</div>
        <div className="text-[10px] text-muted-foreground mt-1">Total des dépenses</div>
      </div>
      <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-4 flex flex-col items-center justify-center text-center">
        <div className="bg-emerald-600 text-white rounded-full p-2 mb-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
        </div>
        <div className="text-xs font-bold text-emerald-700 uppercase">Net à Verser</div>
        <div className="text-xl font-black">{formatCFA(globalNet)} FCFA</div>
        <div className="text-[10px] text-muted-foreground mt-1">Recette - Dépenses</div>
      </div>
      <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 flex flex-col items-center justify-center text-center">
        <div className="bg-blue-600 text-white rounded-full p-2 mb-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
        </div>
        <div className="text-xs font-bold text-blue-700 uppercase">Tickets Vendus</div>
        <div className="text-xl font-black">{formatCFA(totalTickets)}</div>
        <div className="text-[10px] text-muted-foreground mt-1">Nombre total de tickets</div>
      </div>
      <div className="border border-orange-200 bg-orange-50 rounded-lg p-4 flex flex-col items-center justify-center text-center">
        <div className="bg-orange-500 text-white rounded-full p-2 mb-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
        </div>
        <div className="text-xs font-bold text-orange-700 uppercase">Voyages Effectués</div>
        <div className="text-xl font-black">{formatCFA(totalVoyages)}</div>
        <div className="text-[10px] text-muted-foreground mt-1">Nombre total de voyages</div>
      </div>
    </div>
  );

  return (
    <div ref={ref} className="bg-white p-8 w-[1200px] text-slate-800 font-sans mx-auto shadow-2xl">
      {/* HEADER */}
      <div className="flex justify-between items-center border-b pb-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-600 text-white font-black text-4xl w-16 h-16 flex items-center justify-center rounded-xl border-4 border-emerald-100">
            R
          </div>
          <div>
            <h1 className="text-2xl font-black text-emerald-800 tracking-tight">PRODUCTION REX</h1>
            <p className="text-sm text-slate-500 font-medium">Gestion des transports</p>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-black uppercase tracking-widest text-slate-800">Rapport Global</h2>
          <p className="text-slate-500 mt-1">Rapport détaillé des productions</p>
          <div className="mt-4 inline-flex items-center gap-4 border px-4 py-2 rounded-full text-sm font-medium">
             <span className="text-slate-500 uppercase text-xs">Période Sélectionnée:</span>
             <span className="bg-emerald-600 text-white px-3 py-1 rounded-full">{periodLabel}</span>
          </div>
        </div>

        <div className="text-xs space-y-2 border-l pl-6 border-slate-200">
           <div className="flex justify-between gap-8">
             <span className="text-slate-500 font-medium uppercase">Date du rapport :</span>
             <span className="font-bold">{format(new Date(), 'dd MMMM yyyy', { locale: fr })}</span>
           </div>
           <div className="flex justify-between gap-8">
             <span className="text-slate-500 font-medium uppercase">Date de génération :</span>
             <span className="font-bold">{format(new Date(), 'dd/MM/yyyy à HH:mm')}</span>
           </div>
           <div className="flex justify-between gap-8">
             <span className="text-slate-500 font-medium uppercase">Généré par :</span>
             <span className="font-bold">{generatedBy}</span>
           </div>
        </div>
      </div>

      {/* 1. RÉSUMÉ EXÉCUTIF */}
      <div className="mb-8">
        <h3 className="text-emerald-700 font-bold uppercase text-sm mb-4 border-b border-emerald-100 pb-2">1. Résumé Exécutif</h3>
        <ExecutiveSummary />
      </div>

      {/* 2. RAPPORT PAR LIGNE */}
      <div className="mb-8">
        <h3 className="text-emerald-700 font-bold uppercase text-sm mb-4 border-b border-emerald-100 pb-2">2. Rapport Global</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-emerald-700 text-white">
              <th className="px-4 py-3 text-left rounded-tl-lg">LIGNE</th>
              <th className="px-4 py-3 text-right">RECETTE (FCFA)</th>
              <th className="px-4 py-3 text-right">CARBURANT (FCFA)</th>
              <th className="px-4 py-3 text-right">LAVAGE (FCFA)</th>
              <th className="px-4 py-3 text-right">AUTRES (FCFA)</th>
              <th className="px-4 py-3 text-right">TOT. DÉPENSES (FCFA)</th>
              <th className="px-4 py-3 text-right">NET À VERSER (FCFA)</th>
              <th className="px-4 py-3 text-right rounded-tr-lg">MARGE (%)</th>
            </tr>
          </thead>
          <tbody>
            {statsByAgence.map((a, i) => {
              const margin = a.revenue > 0 ? ((a.net / a.revenue) * 100).toFixed(1) : '0.0';
              return (
                <tr key={i} className={`border-b ${i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}>
                  <td className="px-4 py-3 font-bold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    {a.name}
                  </td>
                  <td className="px-4 py-3 text-right">{formatCFA(a.revenue)}</td>
                  <td className="px-4 py-3 text-right">{formatCFA(a.fuelExpense)}</td>
                  <td className="px-4 py-3 text-right">{formatCFA(a.washExpense)}</td>
                  <td className="px-4 py-3 text-right">{formatCFA(a.otherExpense)}</td>
                  <td className="px-4 py-3 text-right font-bold text-red-600">{formatCFA(a.totalExpense)}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatCFA(a.net)}</td>
                  <td className="px-4 py-3 text-right">{margin}%</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
             <tr className="bg-slate-100 font-bold">
               <td className="px-4 py-4 rounded-bl-lg">TOTAL GLOBAL</td>
               <td className="px-4 py-4 text-right">{formatCFA(globalRevenue)}</td>
               <td className="px-4 py-4 text-right">{formatCFA(globalFuel)}</td>
               <td className="px-4 py-4 text-right">{formatCFA(globalWash)}</td>
               <td className="px-4 py-4 text-right">{formatCFA(globalOther)}</td>
               <td className="px-4 py-4 text-right text-red-600">{formatCFA(globalExpense)}</td>
               <td className="px-4 py-4 text-right text-emerald-600">{formatCFA(globalNet)}</td>
               <td className="px-4 py-4 text-right rounded-br-lg">{globalRevenue > 0 ? ((globalNet / globalRevenue)*100).toFixed(1) : 0}%</td>
             </tr>
          </tfoot>
        </table>
      </div>

      {/* 3 & 4. CHARTS */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="border border-slate-200 rounded-xl p-4">
          <h3 className="text-emerald-700 font-bold uppercase text-sm mb-6">3. Performance des Lignes (Net à Verser)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ left: 40, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={12} />
                <RechartsTooltip formatter={(val: number) => `${formatCFA(val)} FCFA`} />
                <Bar dataKey="net" fill="#0ea57a" radius={[0, 4, 4, 0]} barSize={20} label={{ position: 'right', formatter: (val: number) => `${formatCFA(val)} FCFA`, fill: '#64748b', fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="border border-slate-200 rounded-xl p-4">
           <h3 className="text-emerald-700 font-bold uppercase text-sm mb-6">4. Répartition des Dépenses</h3>
           <div className="flex items-center h-64">
             <div className="w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
             </div>
             <div className="w-1/2 space-y-4">
                {pieData.map((d, i) => (
                   <div key={i} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                         <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                         <span className="text-slate-600">{d.name}</span>
                      </div>
                      <div className="font-bold">{formatCFA(d.value)}</div>
                   </div>
                ))}
                <div className="border-t pt-2 mt-2 flex justify-between items-center font-bold">
                   <span>TOTAL</span>
                   <span className="text-red-600">{formatCFA(globalExpense)} FCFA</span>
                </div>
             </div>
           </div>
        </div>
      </div>

      {/* 5. DÉTAIL DES DÉPENSES */}
      <div className="mb-8">
        <h3 className="text-emerald-700 font-bold uppercase text-sm mb-4 border-b border-emerald-100 pb-2">5. Détail des Dépenses</h3>
        <div className="grid grid-cols-3 gap-4">
          
          {/* Carburant */}
          <div className="border border-red-200 rounded-lg overflow-hidden">
            <div className="bg-red-50 p-2 flex justify-between items-center border-b border-red-200">
              <span className="text-red-700 font-bold text-xs uppercase flex items-center gap-2">⛽ Carburant</span>
              <span className="text-red-700 font-bold text-xs">{formatCFA(globalFuel)} FCFA</span>
            </div>
            <div className="p-2 max-h-48 overflow-hidden">
              <table className="w-full text-[10px]">
                <thead className="text-slate-500 uppercase border-b border-slate-100">
                  <tr><th className="text-left pb-1">Date</th><th className="text-left pb-1">Véhicule</th><th className="text-right pb-1">Montant</th></tr>
                </thead>
                <tbody>
                  {fuelRecords.slice(0,6).map((r,i) => (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="py-1">{format(new Date(r.date), 'dd/MM/yyyy')}</td>
                      <td className="py-1 truncate max-w-[80px]">{r.vehicle_immat || r.vehicleImmat}</td>
                      <td className="py-1 text-right font-medium">{formatCFA(r.amount)}</td>
                    </tr>
                  ))}
                  {fuelRecords.length > 6 && <tr><td colSpan={3} className="text-center py-2 text-slate-400 italic">... et {fuelRecords.length - 6} autres</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lavage */}
          <div className="border border-blue-200 rounded-lg overflow-hidden">
            <div className="bg-blue-50 p-2 flex justify-between items-center border-b border-blue-200">
              <span className="text-blue-700 font-bold text-xs uppercase flex items-center gap-2">🚿 Lavage</span>
              <span className="text-blue-700 font-bold text-xs">{formatCFA(globalWash)} FCFA</span>
            </div>
            <div className="p-2 max-h-48 overflow-hidden">
              <table className="w-full text-[10px]">
                <thead className="text-slate-500 uppercase border-b border-slate-100">
                  <tr><th className="text-left pb-1">Date</th><th className="text-left pb-1">Véhicule</th><th className="text-right pb-1">Montant</th></tr>
                </thead>
                <tbody>
                  {washRecords.slice(0,6).map((r,i) => (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="py-1">{format(new Date(r.date), 'dd/MM/yyyy')}</td>
                      <td className="py-1 truncate max-w-[80px]">{r.vehicle_immat || r.vehicleImmat}</td>
                      <td className="py-1 text-right font-medium">{formatCFA(r.amount)}</td>
                    </tr>
                  ))}
                  {washRecords.length > 6 && <tr><td colSpan={3} className="text-center py-2 text-slate-400 italic">... et {washRecords.length - 6} autres</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* Autres Dépenses */}
          <div className="border border-orange-200 rounded-lg overflow-hidden">
            <div className="bg-orange-50 p-2 flex justify-between items-center border-b border-orange-200">
              <span className="text-orange-700 font-bold text-xs uppercase flex items-center gap-2">💸 Autres</span>
              <span className="text-orange-700 font-bold text-xs">{formatCFA(globalOther)} FCFA</span>
            </div>
            <div className="p-2 max-h-48 overflow-hidden">
              <table className="w-full text-[10px]">
                <thead className="text-slate-500 uppercase border-b border-slate-100">
                  <tr><th className="text-left pb-1">Date</th><th className="text-left pb-1">Motif</th><th className="text-right pb-1">Montant</th></tr>
                </thead>
                <tbody>
                  {otherRecords.slice(0,6).map((r,i) => (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="py-1">{format(new Date(r.date), 'dd/MM/yyyy')}</td>
                      <td className="py-1 truncate max-w-[80px]">{r.label}</td>
                      <td className="py-1 text-right font-medium">{formatCFA(r.amount)}</td>
                    </tr>
                  ))}
                  {otherRecords.length > 6 && <tr><td colSpan={3} className="text-center py-2 text-slate-400 italic">... et {otherRecords.length - 6} autres</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* 6. SYNTHÈSE ET SIGNATURE */}
      <div>
        <h3 className="text-emerald-700 font-bold uppercase text-sm mb-4 border-b border-emerald-100 pb-2">6. Synthèse Globale</h3>
        <ExecutiveSummary />
        
        <div className="mt-8 flex justify-between items-end">
           <div className="w-1/2">
             <div className="text-xs text-slate-500 uppercase font-bold mb-2">Commentaires :</div>
             <div className="border border-slate-200 rounded-lg p-4 h-24 bg-slate-50 text-slate-400 italic text-sm">
                Aucune remarque pour cette période.
             </div>
           </div>
           <div className="w-1/3 text-center">
             <div className="border-t border-slate-800 pt-2 text-sm font-bold">
               SIGNATURE / CACHET
             </div>
             <div className="h-24"></div>
           </div>
        </div>
        <div className="text-center text-[10px] text-slate-400 mt-8">
           Rapport généré automatiquement par Production Rex &nbsp;|&nbsp; {format(new Date(), 'dd/MM/yyyy HH:mm')} &nbsp;|&nbsp; Page 1/1
        </div>
      </div>

    </div>
  );
});
