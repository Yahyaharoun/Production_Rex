import { useRef, useEffect } from 'react';

export interface TicketData {
  id?: string;
  companyName?: string;
  ticketNumber: string; // The reference
  date: string;
  time: string;
  tripNumber: string; // e.g. VGE-2025-05-22-0012
  vehicleImmat: string;
  driverName: string;
  passengers: number;
  revenue: number;
  agentName: string; // Caissière
  ligne?: string;
  productionType?: string; // VIP or CLASSIQUE
}

interface TicketBordereauProps {
  data: TicketData;
  onClose: () => void;
  onPrint?: () => void;
}

export function TicketBordereau({ data, onClose, onPrint }: TicketBordereauProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const barcodeValue = data.tripNumber.replace(/[^A-Z0-9-]/gi, '').substring(0, 18) || 'PRX000000000';

  const handlePrint = () => {
    if (onPrint) onPrint();

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Reçu de Production</title>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              font-size: 12px;
              width: 80mm;
              max-width: 80mm;
              padding: 4mm;
              color: #111;
              background: #fff;
            }
            @media print {
              body { width: 80mm; }
              @page { size: 80mm auto; margin: 0; }
            }
            .header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
            .logo { 
              width: 32px; height: 32px; border: 2px solid #10b981; border-radius: 8px;
              display: flex; align-items: center; justify-content: center;
              font-size: 20px; font-weight: 900; color: #10b981;
            }
            .header-text { display: flex; flex-direction: column; }
            .company { font-size: 14px; font-weight: bold; color: #10b981; }
            .sub-company { font-size: 10px; color: #555; }
            .divider { border-top: 1px dashed #ccc; margin: 12px 0; }
            .title { text-align: center; color: #10b981; font-weight: bold; font-size: 14px; margin-bottom: 12px; }
            
            .row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 11px; }
            .row-label { color: #333; display: flex; align-items: center; gap: 6px; }
            .row-value { font-weight: bold; text-align: right; }
            
            .badge { background: #10b981; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; }
            .total-row { display: flex; justify-content: space-between; align-items: center; margin: 16px 0; }
            .total-label { font-size: 13px; font-weight: 900; display: flex; align-items: center; gap: 6px; }
            .total-value { font-size: 16px; font-weight: 900; color: #10b981; }
            
            .footer { text-align: center; margin-top: 16px; }
            .merci { font-style: italic; font-size: 10px; margin-bottom: 8px; }
            .barcode-container { text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">R</div>
            <div class="header-text">
              <div class="company">${data.companyName || 'PRODUCTION REX'}</div>
              <div class="sub-company">Gestion des transports</div>
            </div>
          </div>
          <div class="divider"></div>
          <div class="title"> TICKET DE BORDEREAU </div>
          
          <div class="row">
            <div class="row-label">📅 Date & Heure</div>
            <div class="row-value">${data.date} ${data.time}</div>
          </div>
          <div class="divider" style="margin: 8px 0; border-top: 1px solid #eee;"></div>
          <div class="row">
            <div class="row-label">📍 Ligne</div>
            <div class="row-value">${data.ligne || '-'}</div>
          </div>
          <div class="divider" style="margin: 8px 0; border-top: 1px solid #eee;"></div>
          <div class="row">
            <div class="row-label">🚌 No de Voyage</div>
            <div class="row-value">${data.tripNumber || '-'}</div>
          </div>
          <div class="divider" style="margin: 8px 0; border-top: 1px solid #eee;"></div>
          <div class="row">
            <div class="row-label">🏷️ Numéro de Véhicule</div>
            <div class="row-value">${data.vehicleImmat}</div>
          </div>
          <div class="divider" style="margin: 8px 0; border-top: 1px solid #eee;"></div>
          <div class="row">
            <div class="row-label">👤 Agent Production</div>
            <div class="row-value">${data.agentName}</div>
          </div>
          <div class="divider" style="margin: 8px 0; border-top: 1px solid #eee;"></div>
          <div class="row">
            <div class="row-label">⭐ Statut</div>
            <div class="row-value"><span class="badge">${data.productionType || 'CLASSIQUE'}</span></div>
          </div>
          <div class="divider" style="margin: 8px 0; border-top: 1px solid #eee;"></div>
          <div class="row">
            <div class="row-label">👥 Passagers au Départ</div>
            <div class="row-value">${data.passengers}</div>
          </div>
          <div class="divider" style="margin: 8px 0; border-top: 1px solid #eee;"></div>
          
          <div class="total-row">
            <div class="total-label">💰 RECETTE TOTALE</div>
            <div class="total-value">${data.revenue.toLocaleString('fr-FR')} FCFA</div>
          </div>
          <div class="divider"></div>
          
          <div class="footer">
            <div class="merci">Merci et bon voyage !</div>
            <div class="barcode-container">
              <svg id="barcode"></svg>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              JsBarcode("#barcode", "${barcodeValue}", {
                format: "CODE128",
                width: 1.5,
                height: 40,
                displayValue: true,
                fontSize: 10,
                margin: 0
              });
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Actions Header */}
        <div className="bg-slate-100 px-4 py-3 flex justify-between items-center border-b">
          <h2 className="text-sm font-bold text-slate-700">Aperçu avant impression</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 font-bold">✕</button>
        </div>

        {/* Preview Container */}
        <div className="overflow-y-auto p-6 bg-slate-50 flex-1 flex justify-center">
          <div 
            ref={printRef}
            className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 w-full max-w-[320px]"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 border-2 border-emerald-500 rounded-lg flex items-center justify-center text-xl font-black text-emerald-500">
                R
              </div>
              <div>
                <div className="font-bold text-emerald-600 text-[15px]">{data.companyName || 'PRODUCTION REX'}</div>
                <div className="text-[11px] text-slate-500">Gestion des transports</div>
              </div>
            </div>
            
            <div className="border-t border-dashed border-slate-300 my-4"></div>
            
            <div className="text-center font-bold text-emerald-600 mb-4 text-sm">
              REÇU DE PRODUCTION
            </div>

            {/* Fields */}
            <div className="space-y-3 text-[12px]">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 flex items-center gap-2"><span>📅</span> Date & Heure</span>
                <span className="font-bold text-slate-800">{data.date} {data.time}</span>
              </div>
              <div className="border-t border-slate-100"></div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 flex items-center gap-2"><span>📍</span> Ligne</span>
                <span className="font-bold text-slate-800">{data.ligne || '-'}</span>
              </div>
              <div className="border-t border-slate-100"></div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 flex items-center gap-2"><span>🚌</span> No de Voyage</span>
                <span className="font-bold text-slate-800">{data.tripNumber || '-'}</span>
              </div>
              <div className="border-t border-slate-100"></div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 flex items-center gap-2"><span>🏷️</span> N° de Véhicule</span>
                <span className="font-bold text-slate-800">{data.vehicleImmat}</span>
              </div>
              <div className="border-t border-slate-100"></div>
              <div className="flex justify-between py-2 border-b border-dashed">
                <span className="text-slate-500">Agent Production</span>
                <span className="font-medium text-slate-800">{data.agentName}</span>
              </div>
              <div className="border-t border-slate-100"></div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 flex items-center gap-2"><span>⭐</span> Statut</span>
                <span className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">{data.productionType || 'CLASSIQUE'}</span>
              </div>
              <div className="border-t border-slate-100"></div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 flex items-center gap-2"><span>👥</span> Passagers au Départ</span>
                <span className="font-bold text-slate-800">{data.passengers}</span>
              </div>
              <div className="border-t border-slate-100"></div>
              
              <div className="flex justify-between items-center py-2 mt-2">
                <span className="font-black text-slate-800 text-[13px] flex items-center gap-2"><span>💰</span> RECETTE TOTALE</span>
                <span className="font-black text-emerald-600 text-base">{data.revenue.toLocaleString('fr-FR')} FCFA</span>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-300 my-4"></div>

            <div className="text-center">
              <div className="italic text-slate-600 text-[11px] mb-3">Merci et bon voyage !</div>
              <div className="flex justify-center mt-2 p-2 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
                <div className="text-xs text-slate-400 font-mono text-center">
                  [ Code-barres {barcodeValue} ]<br/>
                  <span className="text-[9px]">Généré à l'impression</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-white border-t flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
          >
            🖨️ Imprimer le reçu
          </button>
        </div>
      </div>
    </div>
  );
}
