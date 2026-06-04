import { useRef } from 'react';

interface TicketData {
  companyName?: string;
  ticketNumber: string;
  date: string;
  time: string;
  tripNumber?: string;
  vehicleImmat: string;
  driverName: string;
  passengers: number;
  revenue: number;
  agentName: string;
  ligne?: string;
  productionType?: string;
}

interface TicketPrintProps {
  data: TicketData;
  onClose: () => void;
}

export function TicketPrint({ data, onClose }: TicketPrintProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Ticket de Recette</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              width: 80mm;
              max-width: 80mm;
              padding: 4mm;
              color: #000;
              background: #fff;
            }
            @media print {
              body { width: 80mm; }
              @page { size: 80mm auto; margin: 0; }
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 6px 0; }
            .row { display: flex; justify-content: space-between; margin: 2px 0; font-size: 11px; }
            .title { font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; }
            .subtitle { font-size: 10px; margin-top: 2px; }
            .amount { font-size: 20px; font-weight: bold; text-align: center; margin: 8px 0; }
            .ticket-number { font-size: 9px; color: #555; word-break: break-all; }
            .footer { font-size: 9px; text-align: center; margin-top: 8px; }
          </style>
        </head>
        <body>
          <div class="center">
            <div class="title">${data.companyName || 'PRODUCTION REX'}</div>
            <div class="subtitle">Ticket de Recette de Voyage</div>
          </div>
          <div class="divider"></div>
          <div class="row">
            <span>Date :</span><span class="bold">${data.date}</span>
          </div>
          <div class="row">
            <span>Heure :</span><span class="bold">${data.time}</span>
          </div>
          <div class="row">
            <span>Ligne :</span><span class="bold">${data.ligne || '-'}</span>
          </div>
          <div class="row">
            <span>Type :</span><span class="bold">${data.productionType || 'CLASSIQUE'}</span>
          </div>
          ${data.tripNumber ? `<div class="row"><span>N° Voyage :</span><span class="bold">${data.tripNumber}</span></div>` : ''}
          <div class="divider"></div>
          <div class="row">
            <span>Véhicule :</span><span class="bold">${data.vehicleImmat}</span>
          </div>
          <div class="row">
            <span>Chauffeur :</span><span class="bold">${data.driverName}</span>
          </div>
          <div class="row">
            <span>Passagers :</span><span class="bold">${data.passengers}</span>
          </div>
          <div class="divider"></div>
          <div class="amount">${data.revenue.toLocaleString('fr-FR')} FCFA</div>
          <div class="divider"></div>
          <div class="row">
            <span>Agent :</span><span class="bold">${data.agentName}</span>
          </div>
          <div class="divider"></div>
          <div class="center ticket-number">Réf: ${data.ticketNumber}</div>
          <div class="footer">
            Merci pour votre confiance<br/>
            Conservez ce ticket
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-600 text-white px-6 py-4">
          <h2 className="text-lg font-bold">🖨️ Ticket de Recette</h2>
          <p className="text-xs opacity-80">Prêt pour l'impression thermique</p>
        </div>

        {/* Preview */}
        <div
          ref={printRef}
          className="p-4 font-mono text-xs bg-gray-50 mx-4 my-3 rounded-xl border-2 border-dashed border-gray-300"
        >
          <div className="text-center mb-2">
            <div className="text-base font-bold uppercase tracking-widest">{data.companyName || 'PRODUCTION REX'}</div>
            <div className="text-[10px] text-gray-500">Ticket de Recette de Voyage</div>
          </div>
          <div className="border-t border-dashed border-gray-400 my-2" />
          
          <div className="space-y-1">
            <div className="flex justify-between"><span>Date :</span><span className="font-bold">{data.date}</span></div>
            <div className="flex justify-between"><span>Heure :</span><span className="font-bold">{data.time}</span></div>
            <div className="flex justify-between"><span>Ligne :</span><span className="font-bold">{data.ligne || '-'}</span></div>
            <div className="flex justify-between"><span>Type :</span><span className="font-bold">{data.productionType || 'CLASSIQUE'}</span></div>
            {data.tripNumber && <div className="flex justify-between"><span>N° Voyage :</span><span className="font-bold">{data.tripNumber}</span></div>}
          </div>
          
          <div className="border-t border-dashed border-gray-400 my-2" />
          <div className="space-y-1">
            <div className="flex justify-between"><span>Véhicule :</span><span className="font-bold">{data.vehicleImmat}</span></div>
            <div className="flex justify-between"><span>Chauffeur :</span><span className="font-bold">{data.driverName}</span></div>
            <div className="flex justify-between"><span>Passagers :</span><span className="font-bold">{data.passengers}</span></div>
          </div>
          
          <div className="border-t border-dashed border-gray-400 my-2" />
          <div className="text-2xl font-black text-center my-2 text-emerald-700">
            {data.revenue.toLocaleString('fr-FR')} FCFA
          </div>
          <div className="border-t border-dashed border-gray-400 my-2" />
          <div className="flex justify-between"><span>Agent :</span><span className="font-bold">{data.agentName}</span></div>
          <div className="border-t border-dashed border-gray-400 my-2" />
          <div className="text-[8px] text-gray-400 text-center break-all">Réf: {data.ticketNumber}</div>
          <div className="text-center text-[9px] text-gray-400 mt-1">
            Merci pour votre confiance • Conservez ce ticket
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-4 pb-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
          >
            Fermer
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
          >
            🖨️ Imprimer
          </button>
        </div>
      </div>
    </div>
  );
}
