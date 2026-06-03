import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Droplets, Plus, Clock, FileText } from 'lucide-react';
import { useWashingControl } from './hooks/useWashingControl';
import { WashingControlForm } from './WashingControlForm';
import { Skeleton } from '../../components/ui/skeleton';
import { useRBAC } from '../../hooks/useRBAC';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function WashingControlPage() {
  const { washes, loading, addWash } = useWashingControl();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const { can } = useRBAC();
  const canAdd = can('write', 'wash');

  const handleSave = async (data: any) => {
    setSaving(true);
    try {
      await addWash(data);
      setShowForm(false);
    } catch (e) {
      // Error handled in hook (toast)
    } finally {
      setSaving(false);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Rapport des Lavages', 14, 15);
    
    const tableData = washes.map(w => [
      w.date,
      w.time,
      w.immatriculation,
      w.user_name,
      `${w.amount.toLocaleString()} FCFA`,
      w.synced ? 'Oui' : 'Non'
    ]);

    autoTable(doc, {
      startY: 25,
      head: [['Date', 'Heure', 'Véhicule', 'Auteur', 'Montant', 'Synchronisé']],
      body: tableData,
    });

    doc.save(`lavages_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-foreground">Contrôle Lavage</h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
            Suivi des lavages (1/jour/véhicule)
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportPDF} variant="outline" className="border-border rounded-xl h-11 px-4 font-bold shadow-sm">
            <FileText className="mr-2 h-4 w-4" /> Exporter
          </Button>
          {canAdd && !showForm && (
            <Button onClick={() => setShowForm(true)} className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl h-11 px-6 font-black shadow-lg">
              <Plus className="mr-2 h-4 w-4" /> Nouveau Lavage
            </Button>
          )}
        </div>
      </div>

      {showForm && (
        <WashingControlForm onSave={handleSave} onCancel={() => setShowForm(false)} saving={saving} />
      )}

      {/* List */}
      <Card className="bg-white border-border shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="bg-secondary/5 pb-4 p-6 border-b border-border/50 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-black text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" /> Historique des Lavages
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : washes.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground font-medium">
              Aucun lavage enregistré.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-secondary/30 text-muted-foreground border-b border-border font-bold">
                  <tr>
                    <th className="px-6 py-4">Date & Heure</th>
                    <th className="px-6 py-4">Véhicule</th>
                    <th className="px-6 py-4">Auteur</th>
                    <th className="px-6 py-4 text-right">Montant</th>
                    <th className="px-6 py-4 text-center">Sync</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {washes.map((wash) => (
                    <tr key={wash.id || wash.clientId} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-4 font-medium">
                        {wash.date} <span className="text-muted-foreground text-xs">{wash.time}</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-foreground">
                        {wash.immatriculation}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-muted-foreground">
                        {wash.user_name}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-foreground">
                        {wash.amount.toLocaleString()} FCFA
                      </td>
                      <td className="px-6 py-4 text-center">
                        {wash.synced ? (
                          <span className="text-emerald-500 font-bold" title="Synchronisé">✅</span>
                        ) : (
                          <span className="text-amber-500 font-bold" title="En attente de synchronisation">⏳</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
