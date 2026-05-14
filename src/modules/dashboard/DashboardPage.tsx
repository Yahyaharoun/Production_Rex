import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Bus, Users, Banknote, MapPin, TrendingUp, AlertCircle, CheckCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";

const STORAGE_KEY_PROD = 'rex-productions';
const STORAGE_KEY_VEHICLES = 'rex-vehicles';
const STORAGE_KEY_DRIVERS = 'rex-drivers';

export default function DashboardPage() {
  const [data, setData] = useState({
    revenue: 0,
    expenses: 0,
    net: 0,
    vehiclesActive: 0,
    vehiclesTotal: 0,
    driversAvailable: 0,
    alerts: 0,
    recentDepartures: [] as any[],
    weeklyTrend: [] as number[],
  });

  useEffect(() => {
    // Charger les données réelles
    const prodsRaw = localStorage.getItem(STORAGE_KEY_PROD);
    const vehiclesRaw = localStorage.getItem(STORAGE_KEY_VEHICLES);
    const driversRaw = localStorage.getItem(STORAGE_KEY_DRIVERS);

    const prods = prodsRaw ? JSON.parse(prodsRaw) : [];
    const vehicles = vehiclesRaw ? JSON.parse(vehiclesRaw) : [];
    const drivers = driversRaw ? JSON.parse(driversRaw) : [];

    // Calculs pour AUJOURD'HUI
    const today = new Date().toISOString().split('T')[0];
    const todayProds = prods.filter((p: any) => p.date.startsWith(today));

    const revenue = todayProds.reduce((s: number, p: any) => s + Number(p.revenue || 0), 0);
    const expenses = todayProds.reduce((s: number, p: any) => 
      s + Number(p.fuel || 0) + Number(p.toll || 0) + Number(p.washing || 0) + Number(p.others || 0), 0);
    const net = todayProds.reduce((s: number, p: any) => s + Number(p.netToDeposit || 0), 0);

    const vehiclesActive = vehicles.filter((v: any) => v.status === 'ACTIVE').length;
    const vehiclesTotal = vehicles.length;
    const alerts = vehicles.filter((v: any) => v.status === 'MAINTENANCE').length;
    const driversAvailable = drivers.filter((d: any) => d.status === 'AVAILABLE').length;

    // 7 derniers jours pour le graphe
    const trend = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      return prods
        .filter((p: any) => p.date.startsWith(dateStr))
        .reduce((s: number, p: any) => s + Number(p.revenue || 0), 0);
    });

    setData({
      revenue,
      expenses,
      net,
      vehiclesActive,
      vehiclesTotal,
      driversAvailable,
      alerts,
      recentDepartures: prods.slice(0, 4),
      weeklyTrend: trend,
    });
  }, []);

  const maxTrend = Math.max(...data.weeklyTrend, 1);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white">Dashboard</h2>
          <p className="text-muted-foreground mt-1">Surveillance en temps réel de la flotte et des revenus.</p>
        </div>
        <div className="bg-accent/10 border border-accent/20 px-4 py-2 rounded-lg flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          <span className="text-xs font-bold text-accent uppercase tracking-wider">Live System Active</span>
        </div>
      </div>

      {/* Main KPIs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border shadow-lg hover:border-accent/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Recette (Auj.)</CardTitle>
            <div className="p-2 bg-accent/10 rounded-lg">
              <Banknote className="h-5 w-5 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-white">{data.revenue.toLocaleString()} XAF</div>
            <div className="flex items-center gap-1 mt-2 text-xs text-green-400 font-bold">
              <ArrowUpRight className="h-3 w-3" />
              <span>Système à jour</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-lg hover:border-destructive/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Charges (Auj.)</CardTitle>
            <div className="p-2 bg-destructive/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-white">{data.expenses.toLocaleString()} XAF</div>
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <span>Carburant & Maintenance</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-lg hover:border-accent/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Flotte Active</CardTitle>
            <div className="p-2 bg-accent/10 rounded-lg">
              <Bus className="h-5 w-5 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-white">{data.vehiclesActive} <span className="text-sm font-normal text-muted-foreground">/ {data.vehiclesTotal}</span></div>
            <div className="flex items-center gap-1 mt-2 text-xs text-green-400 font-bold">
              <CheckCircle className="h-3 w-3" />
              <span>Opérationnel</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-lg hover:border-yellow-500/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Alertes Garage</CardTitle>
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-white">{data.alerts}</div>
            <div className="flex items-center gap-1 mt-2 text-xs text-yellow-400/70">
              <ArrowDownRight className="h-3 w-3" />
              <span>Nécessitent action</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Weekly Chart */}
        <Card className="lg:col-span-4 bg-card border-border shadow-xl">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              Tendance Revenus Hebdomadaires
            </CardTitle>
            <p className="text-xs text-muted-foreground">Comparaison des recettes sur les 7 derniers jours.</p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[280px] w-full flex items-end justify-between px-2 gap-3">
              {data.weeklyTrend.map((val, i) => (
                <div key={i} className="flex flex-col items-center flex-1 gap-3 group relative">
                  {val > 0 && (
                    <span className="absolute -top-8 text-[10px] font-bold text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                      {val.toLocaleString()}
                    </span>
                  )}
                  <div className="w-full bg-secondary/30 rounded-t-lg relative h-[200px]">
                    <div 
                      className="absolute bottom-0 w-full bg-accent rounded-t-lg transition-all duration-1000 group-hover:bg-accent/80 cursor-pointer" 
                      style={{ height: `${(val / maxTrend) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][(new Date().getDay() + i + 1) % 7]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-3 bg-card border-border shadow-xl">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              Dernières Productions
            </CardTitle>
            <p className="text-xs text-muted-foreground">Historique récent des départs enregistrés.</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {data.recentDepartures.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground flex flex-col items-center">
                  <MapPin className="h-10 w-10 mb-2 opacity-20" />
                  <p className="text-sm">Aucun départ récent.</p>
                </div>
              ) : (
                data.recentDepartures.map((prod, i) => (
                  <div key={i} className="flex items-center group">
                    <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <MapPin className="h-5 w-5 text-white group-hover:text-accent transition-colors" />
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">Mission {prod.immatriculation}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {prod.driverName} • {new Date(prod.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-accent">{Number(prod.netToDeposit).toLocaleString()} XAF</p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Net versé</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            {data.recentDepartures.length > 0 && (
              <button className="w-full mt-6 py-2 border border-dashed border-border rounded-lg text-xs font-bold text-muted-foreground hover:text-white hover:border-accent transition-all">
                Voir tout l'historique
              </button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
