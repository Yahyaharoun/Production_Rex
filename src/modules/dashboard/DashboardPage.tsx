import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from '../../components/ui/button';
import { Bus, Banknote, MapPin, TrendingUp, CheckCircle, ArrowUpRight, Loader2, Calendar, Database } from "lucide-react";
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Skeleton } from '../../components/ui/skeleton';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/useAuthStore';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const roleStr = String(user?.role || '').toUpperCase().trim();
  const isAdmin = roleStr === 'PDG' || roleStr === 'ADMIN';
  const isChef = roleStr === 'CHEF_AGENCE' || roleStr === 'CHEF D\'AGENCE' || roleStr === 'CHEF AGENCE';
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({
    revenue: 0, expenses: 0, net: 0,
    vehiclesActive: 0, vehiclesTotal: 0,
    driversAvailable: 0, alerts: 0,
    recentDepartures: [] as unknown[],
    weeklyTrend: [] as number[],
    todayEntries: [] as unknown[]
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

      // Exécuter toutes les requêtes en parallèle pour la performance
      let todayQuery = supabase.from('productions').select('*').eq('date', today).eq('status', 'VALIDATED');
      let recentQuery = supabase.from('productions').select('immatriculation, driver_name, net_to_deposit, created_at').eq('status', 'VALIDATED').order('created_at', { ascending: false }).limit(5);
      let trendQuery = supabase.from('productions').select('date, revenue').eq('status', 'VALIDATED').gte('date', sevenDaysAgoStr);

      if (!isAdmin && user?.agenceId) {
        todayQuery = todayQuery.eq('agence_id', user.agenceId);
        recentQuery = recentQuery.eq('agence_id', user.agenceId);
        trendQuery = trendQuery.eq('agence_id', user.agenceId);
      }

      const [todayProdsRes, recentProdsRes, vehiclesRes, driversRes, trendRes] = await Promise.all([
        todayQuery,
        recentQuery,
        supabase.from('vehicles').select('status'),
        supabase.from('drivers').select('status'),
        trendQuery
      ]);

      if (todayProdsRes.error) throw todayProdsRes.error;
      
      const todayProds = todayProdsRes.data || [];
      const revenue = todayProds.reduce((s, p) => s + Number(p.revenue || 0), 0);
      const expenses = todayProds.reduce((s, p) => s + Number(p.expense_fuel || 0) + Number(p.expense_toll || 0) + Number(p.expense_washing || 0) + Number(p.expense_others || 0), 0);
      const net = todayProds.reduce((s, p) => s + Number(p.net_to_deposit || 0), 0);

      // Calculer la tendance hebdomadaire
      const trendMap: Record<string, number> = {};
      trendRes.data?.forEach(p => {
        trendMap[p.date] = (trendMap[p.date] || 0) + Number(p.revenue || 0);
      });
      
      const weeklyTrend = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        weeklyTrend.push(trendMap[dStr] || 0);
      }

      setData({
        revenue, expenses, net,
        vehiclesActive: vehiclesRes.data?.filter((v) => v.status === 'ACTIVE').length || 0,
        vehiclesTotal: vehiclesRes.data?.length || 0,
        driversAvailable: driversRes.data?.filter((d) => d.status === 'AVAILABLE').length || 0,
        alerts: vehiclesRes.data?.filter((v) => v.status === 'MAINTENANCE').length || 0,
        recentDepartures: recentProdsRes.data || [],
        weeklyTrend,
        todayEntries: todayProds
      });
    } catch (err: unknown) {
      toast.error('Erreur de synchronisation', { description: (err as any)?.message });
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
            <div className="h-[280px] w-full flex items-end justify-between px-2 gap-6">
              {data.weeklyTrend.map((val, i) => (
                <div key={i} className="flex flex-col items-center flex-1 gap-4 group relative">
                  {val > 0 && (
                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 scale-90 group-hover:scale-100">
                      <div className="bg-foreground text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap">
                        {val.toLocaleString()} XAF
                      </div>
                      <div className="w-2 h-2 bg-foreground rotate-45 mx-auto -mt-1"></div>
                    </div>
                  )}
                  <div className="w-full bg-secondary/50 rounded-2xl relative h-[220px] overflow-hidden">
                    <div className="absolute bottom-0 w-full bg-primary rounded-2xl transition-all duration-1000 ease-out group-hover:bg-primary/80 cursor-pointer shadow-lg"
                      style={{ height: `${(val / maxTrend) * 100}%` }}>
                      <div className="w-full h-full bg-gradient-to-t from-black/10 to-transparent"></div>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][(new Date().getDay() + i + 1) % 7]}
                  </span>
                </div>
              ))}
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
                data.recentDepartures.map((prod, i) => (
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
                {data.todayEntries.map((e, i) => (
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



