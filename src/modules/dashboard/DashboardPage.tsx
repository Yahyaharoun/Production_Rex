import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from '../../components/ui/button';
import { Bus, Banknote, MapPin, TrendingUp, CheckCircle, ArrowUpRight, Loader2, Calendar, Database } from "lucide-react";
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Skeleton } from '../../components/ui/skeleton';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/useAuthStore';
import { db } from '../../lib/dexie';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const roleStr = String(user?.role || '').toUpperCase().trim();
  const isAdmin = roleStr === 'PDG' || roleStr === 'ADMIN';
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({
    revenue: 0, expenses: 0, net: 0,
    vehiclesActive: 0, vehiclesTotal: 0,
    driversAvailable: 0, alerts: 0,
    recentDepartures: [] as any[],
    weeklyTrend: [] as number[],
    todayEntries: [] as any[]
  });

  const fetchDashboard = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      // Obtenir la date locale (Cameroun GMT+1)
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      // Date il y a 7 jours
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

      // Exécuter toutes les requêtes en parallèle sur IndexedDB
      let todayQuery = db.productions.where('date').equals(today);
      let recentQuery = db.productions.orderBy('date').reverse().limit(5);
      let allQuery = db.productions.orderBy('date');

      if (!isAdmin && user?.agenceId) {
        // En vrai avec dexie, c'est plus complexe de filtrer après orderBy.
        // On va filtrer en mémoire pour faire simple.
      }

      const [allProds, vehicles, drivers, fuelExp, otherExp, washesList] = await Promise.all([
        db.productions.toArray(),
        db.vehicles.toArray(),
        db.drivers.toArray(),
        db.fuelExpenses.toArray(),
        db.otherExpenses.where('status').equals('VALIDEE').toArray(),
        db.washes.toArray()
      ]);

      const filteredProds = isAdmin ? allProds : allProds.filter(p => p.agence_id === user?.agenceId);
      const filteredFuel = isAdmin ? fuelExp : fuelExp.filter(f => f.agence_id === user?.agenceId);
      const filteredOther = isAdmin ? otherExp : otherExp.filter(o => o.agence_id === user?.agenceId);
      const filteredWashes = isAdmin ? washesList : washesList.filter(w => w.agence_id === user?.agenceId);

      const todayProds = filteredProds.filter(p => p.date === today && p.status === 'VALIDATED');
      
      const revenue = todayProds.reduce((s, p) => s + Number(p.revenue || 0), 0);
      
      // Calculer les dépenses du jour (productions + modules indépendants)
      const todayFuel = filteredFuel.filter(f => f.date === today).reduce((sum, f) => sum + Number(f.amount), 0);
      const todayOther = filteredOther.filter(o => o.date === today).reduce((sum, o) => sum + Number(o.total), 0);
      const todayWashes = filteredWashes.filter(w => w.date === today).reduce((sum, w) => sum + Number(w.amount), 0);
      
      const expenses = todayProds.reduce((s, p) => s + Number(p.expense_fuel || 0) + Number(p.expense_toll || 0) + Number(p.expense_washing || 0) + Number(p.expense_others || 0), 0) + todayFuel + todayOther + todayWashes;
      
      const net = revenue - expenses;

      // Calculer la tendance hebdomadaire
      const trendMap: Record<string, number> = {};
      const expenseMap: Record<string, number> = {};
      
      filteredProds.filter(p => p.date >= sevenDaysAgoStr && p.status === 'VALIDATED').forEach(p => {
        trendMap[p.date] = (trendMap[p.date] || 0) + Number(p.revenue || 0);
        expenseMap[p.date] = (expenseMap[p.date] || 0) + Number(p.expense_fuel || 0) + Number(p.expense_toll || 0) + Number(p.expense_washing || 0) + Number(p.expense_others || 0);
      });
      
      filteredFuel.filter(f => f.date >= sevenDaysAgoStr).forEach(f => {
        expenseMap[f.date] = (expenseMap[f.date] || 0) + Number(f.amount);
      });
      filteredOther.filter(o => o.date >= sevenDaysAgoStr).forEach(o => {
        expenseMap[o.date] = (expenseMap[o.date] || 0) + Number(o.total);
      });
      filteredWashes.filter(w => w.date >= sevenDaysAgoStr).forEach(w => {
        expenseMap[w.date] = (expenseMap[w.date] || 0) + Number(w.amount);
      });
      
      const weeklyTrend = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        weeklyTrend.push({
          name: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][d.getDay()],
          revenue: trendMap[dStr] || 0,
          expenses: expenseMap[dStr] || 0
        });
      }

      const recentProds = filteredProds.filter(p => p.status === 'VALIDATED').sort((a, b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime()).slice(0, 5);

      setData({
        revenue, expenses, net,
        vehiclesActive: vehicles.filter((v) => v.status === 'ACTIVE').length || 0,
        vehiclesTotal: vehicles.length || 0,
        driversAvailable: drivers.filter((d) => d.status === 'AVAILABLE').length || 0,
        alerts: vehicles.filter((v) => v.status === 'MAINTENANCE').length || 0,
        recentDepartures: recentProds,
        weeklyTrend: weeklyTrend as any,
        todayEntries: todayProds
      });
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // Auto-refresh toutes les 2 minutes
    const interval = setInterval(() => fetchDashboard(true), 120000);
    return () => clearInterval(interval);
  }, []);

  const maxTrend = Math.max(...data.weeklyTrend, 1);

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <Skeleton className="h-12 w-64 rounded-2xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-3xl" />)}
        </div>
        <div className="grid gap-6 md:grid-cols-7">
          <Skeleton className="col-span-4 h-[400px] rounded-3xl" />
          <Skeleton className="col-span-3 h-[400px] rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black tracking-tighter text-foreground">Dashboard</h2>
            {refreshing && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
          </div>
          <p className="text-muted-foreground mt-1 font-bold flex items-center gap-2">
            <Calendar className="h-4 w-4" /> 
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Button onClick={() => fetchDashboard(true)} variant="outline" className="border-border rounded-xl font-bold bg-white shadow-sm hover:bg-secondary">
          <Database className={cn("mr-2 h-4 w-4", refreshing && "animate-pulse")} /> Actualiser les données
        </Button>
      </div>

      {/* KPIs Principaux */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border-border shadow-sm rounded-[1.25rem] hover:shadow-xl transition-all border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Recette Brut</CardTitle>
            <div className="p-2 bg-primary/10 rounded-xl text-primary"><Banknote className="h-5 w-5" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-black text-foreground">{data.revenue.toLocaleString()} <span className="text-xs">XAF</span></div>
            <div className="flex items-center gap-1 mt-3 text-[10px] text-primary font-black uppercase tracking-wider">
              <CheckCircle className="h-3 w-3" /> Données réelles DB
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-border shadow-sm rounded-[1.25rem] hover:shadow-xl transition-all border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Total Charges</CardTitle>
            <div className="p-2 bg-destructive/10 rounded-xl text-destructive"><TrendingUp className="h-5 w-5" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-black text-foreground">{data.expenses.toLocaleString()} <span className="text-xs">XAF</span></div>
            <p className="text-[10px] text-muted-foreground font-bold mt-3 uppercase">Carburant, Péage, Maintenance</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-border shadow-sm rounded-[1.25rem] hover:shadow-xl transition-all border-l-4 border-l-blue-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Net à Verser</CardTitle>
            <div className="p-2 bg-blue-600/10 rounded-xl text-blue-600"><CheckCircle className="h-5 w-5" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-black text-blue-600">{data.net.toLocaleString()} <span className="text-xs">XAF</span></div>
            <div className="flex items-center gap-1 mt-3 text-[10px] text-blue-600 font-black uppercase tracking-wider">
              <ArrowUpRight className="h-3 w-3" /> {data.todayEntries.length} Voyages aujourd'hui
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-border shadow-sm rounded-[1.25rem] hover:shadow-xl transition-all border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Disponibilité</CardTitle>
            <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-600"><Bus className="h-5 w-5" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-black text-foreground">{data.vehiclesActive} <span className="text-xs font-medium text-muted-foreground">/ {data.vehiclesTotal} bus</span></div>
            <p className="text-[10px] text-yellow-600 font-black mt-3 uppercase tracking-wider">{data.driversAvailable} Chauffeurs dispo.</p>
          </CardContent>
        </Card>
      </div>

      {/* Détails de la base de données */}
      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4 bg-white border-border shadow-sm rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-secondary/10 pb-6 pt-8 px-8">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl font-black text-foreground flex items-center gap-3">
                  <TrendingUp className="h-6 w-6 text-primary" /> Performance Hebdomadaire
                </CardTitle>
                <p className="text-sm font-bold text-muted-foreground mt-1">Comparaison des revenus journaliers réels.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.weeklyTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `${value / 1000}k`} />
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [`${Number(value).toLocaleString()} FCFA`, '']}
                  />
                  <Legend verticalAlign="top" height={36}/>
                  <Area type="monotone" name="Recettes" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" name="Dépenses" dataKey="expenses" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 bg-white border-border shadow-sm rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-secondary/10 pb-6 pt-8 px-8">
            <CardTitle className="text-2xl font-black text-foreground flex items-center gap-3">
              <MapPin className="h-6 w-6 text-primary" /> Voyages Récents
            </CardTitle>
            <p className="text-sm font-bold text-muted-foreground mt-1">Données extraites en direct de la base.</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {data.recentDepartures.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground">
                   <p className="font-bold">Aucune donnée stockée.</p>
                </div>
              ) : (
                data.recentDepartures.map((prod: any, i) => (
                  <div key={i} className="flex items-center group p-4 rounded-3xl hover:bg-secondary/40 transition-all border border-transparent hover:border-border/50">
                    <div className="h-14 w-14 rounded-2xl bg-white border border-border shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Bus className="h-6 w-6 text-primary" />
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <p className="text-sm font-black text-foreground truncate">{prod.immatriculation}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                        {prod.driver_name} • {new Date(prod.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-md font-black text-primary">{Number(prod.net_to_deposit).toLocaleString()}</p>
                      <p className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter">Net Versé</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vue Tableur Directe pour vérification */}
      <Card className="bg-white border-border shadow-sm rounded-[2.5rem] overflow-hidden">
        <CardHeader className="bg-foreground text-white p-8">
          <CardTitle className="text-xl font-black flex items-center gap-3">
            <Database className="h-6 w-6 text-primary" /> Vue d'ensemble des données stockées (Aujourd'hui)
          </CardTitle>
          <p className="text-xs font-bold text-white/60 uppercase tracking-widest mt-1">Ceci affiche les entrées exactes de la table "productions"</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-secondary/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border">
                  <th className="px-8 py-4">ID Voyage</th>
                  <th className="px-8 py-4">Véhicule</th>
                  <th className="px-8 py-4">Chauffeur</th>
                  <th className="px-8 py-4 text-right">Recette</th>
                  <th className="px-8 py-4 text-right">Charges</th>
                  <th className="px-8 py-4 text-right">Net Final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {data.todayEntries.map((e: any, i) => (
                  <tr key={e.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-8 py-5 font-black text-muted-foreground text-xs">Voyage #{data.todayEntries.length - i}</td>
                    <td className="px-8 py-5 font-black text-foreground">{e.immatriculation}</td>
                    <td className="px-8 py-5 font-bold text-muted-foreground">{e.driver_name}</td>
                    <td className="px-8 py-5 text-right font-bold">{Number(e.revenue).toLocaleString()}</td>
                    <td className="px-8 py-5 text-right font-bold text-destructive">
                      {(Number(e.expense_fuel) + Number(e.expense_toll) + Number(e.expense_washing) + Number(e.expense_others)).toLocaleString()}
                    </td>
                    <td className="px-8 py-5 text-right font-black text-primary bg-primary/5">{Number(e.net_to_deposit).toLocaleString()} XAF</td>
                  </tr>
                ))}
                {data.todayEntries.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-8 py-12 text-center text-muted-foreground font-bold italic">
                      Aucune donnée enregistrée pour aujourd'hui dans la base de données.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-secondary/30 font-black">
                <tr>
                  <td colSpan={3} className="px-8 py-4 text-right uppercase tracking-widest text-xs">Total Aujourd'hui</td>
                  <td className="px-8 py-4 text-right">{data.revenue.toLocaleString()}</td>
                  <td className="px-8 py-4 text-right text-destructive">{data.expenses.toLocaleString()}</td>
                  <td className="px-8 py-4 text-right text-primary text-lg">{data.net.toLocaleString()} XAF</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



