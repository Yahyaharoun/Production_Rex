import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Droplets, Loader2, Save, X } from 'lucide-react';
import { db } from '../../lib/dexie';
import { toast } from 'sonner';

interface WashingControlFormProps {
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

export function WashingControlForm({ onSave, onCancel, saving }: WashingControlFormProps) {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    ligne: 'Principale',
    vehicle_id: '',
    immatriculation: '',
    amount: '',
    notes: ''
  });

  useEffect(() => {
    const fetchVehicles = async () => {
      const v = await db.vehicles.toArray();
      setVehicles(v);
    };
    fetchVehicles();
  }, []);

  const handleVehicleSelect = (id: string) => {
    const v = vehicles.find(v => v.id === id);
    setForm(prev => ({
      ...prev,
      vehicle_id: id,
      immatriculation: v?.immatriculation || '',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vehicle_id) {
      toast.error('Veuillez sélectionner un véhicule');
      return;
    }
    
    onSave({
      ...form,
      amount: Number(form.amount) || 0
    });
  };

  return (
    <Card className="bg-white border-primary/20 shadow-xl rounded-xl mb-6 animate-in slide-in-from-top-4 duration-300">
      <CardHeader className="bg-secondary/20 pb-4 p-6 border-b border-border/50 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-black text-foreground flex items-center gap-2">
          <Droplets className="h-5 w-5 text-blue-500" /> Nouveau Lavage
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onCancel} className="hover:bg-white rounded-xl p-2 border border-border">
          <X className="h-4 w-4 text-muted-foreground" />
        </Button>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Véhicule *</Label>
              <select 
                value={form.vehicle_id}
                onChange={(e) => handleVehicleSelect(e.target.value)}
                className="w-full rounded-xl bg-secondary/10 border border-border h-11 px-3 text-sm font-bold focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Sélectionner un véhicule</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.immatriculation}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Montant (FCFA)</Label>
              <Input type="number" value={form.amount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, amount: e.target.value})} placeholder="Ex: 2000" className="bg-secondary/10 border-border rounded-xl h-11 font-bold text-sm" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Date & Heure</Label>
              <div className="flex gap-2">
                <Input type="date" value={form.date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, date: e.target.value})} className="bg-secondary/10 border-border rounded-xl h-11 font-bold text-sm flex-1" required />
                <Input type="time" value={form.time} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, time: e.target.value})} className="bg-secondary/10 border-border rounded-xl h-11 font-bold text-sm w-32" required />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Notes (Optionnel)</Label>
            <Input value={form.notes} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, notes: e.target.value})} placeholder="Observations..." className="bg-secondary/10 border-border rounded-xl h-11 font-bold text-sm" />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
            <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl font-bold h-10 px-6 border-border">Annuler</Button>
            <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-black h-10 px-8 shadow-md" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Enregistrer Lavage
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
