import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { FileText, Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface OtherExpenseFormProps {
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

export function OtherExpenseForm({ onSave, onCancel, saving }: OtherExpenseFormProps) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    ligne: 'Principale', 
    label: '',
    motif: '',
    unit_price: '',
    quantity: '1',
  });

  const total = Number(form.unit_price) * Number(form.quantity) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.label || !form.motif || !form.unit_price) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    onSave({
      ...form,
      unit_price: Number(form.unit_price),
      quantity: Number(form.quantity),
      total
    });
  };

  return (
    <Card className="bg-white border-primary/20 shadow-xl rounded-xl mb-6 animate-in slide-in-from-top-4 duration-300">
      <CardHeader className="bg-secondary/20 pb-4 p-6 border-b border-border/50 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-black text-foreground flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" /> Nouvelle Dépense
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onCancel} className="hover:bg-white rounded-xl p-2 border border-border">
          <X className="h-4 w-4 text-muted-foreground" />
        </Button>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Libellé (Nom de la dépense) *</Label>
              <Input value={form.label} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, label: e.target.value})} placeholder="Ex: Achat fournitures" className="bg-secondary/10 border-border rounded-xl h-11 font-bold text-sm" required />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Motif (Justification) *</Label>
              <Input value={form.motif} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, motif: e.target.value})} placeholder="Ex: Manque de papier à l'agence" className="bg-secondary/10 border-border rounded-xl h-11 font-bold text-sm" required />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Prix Unitaire (FCFA) *</Label>
              <Input type="number" value={form.unit_price} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, unit_price: e.target.value})} placeholder="Ex: 5000" className="bg-secondary/10 border-border rounded-xl h-11 font-bold text-sm" required min="1" />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Quantité *</Label>
              <Input type="number" value={form.quantity} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, quantity: e.target.value})} className="bg-secondary/10 border-border rounded-xl h-11 font-bold text-sm" required min="1" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Date & Heure</Label>
              <div className="flex gap-2">
                <Input type="date" value={form.date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, date: e.target.value})} className="bg-secondary/10 border-border rounded-xl h-11 font-bold text-sm flex-1" required />
                <Input type="time" value={form.time} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, time: e.target.value})} className="bg-secondary/10 border-border rounded-xl h-11 font-bold text-sm w-32" required />
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex justify-between items-center">
            <span className="text-sm font-bold text-muted-foreground">Total à valider :</span>
            <span className="text-xl font-black text-primary">{total.toLocaleString()} FCFA</span>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
            <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl font-bold h-10 px-6 border-border">Annuler</Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-white rounded-xl font-black h-10 px-8 shadow-md" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Soumettre pour validation
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
