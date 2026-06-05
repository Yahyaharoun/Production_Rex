const fs = require('fs');

// 1. CREATE BORDEREAUX PAGE
let bp = fs.readFileSync('src/modules/production/ProductionPage.tsx', 'utf8');

bp = bp.replace(/ProductionPage/g, 'BordereauxPage');
bp = bp.replace(/TicketPrint/g, 'TicketBordereau');

bp = bp.replace(/>\s*Saisie de Production\s*<\/h1>/, "> Génération de Bordereau de Voyage </h1>");
bp = bp.replace(/>\s*Nouvelle Production\s*<\/CardTitle>/, "> Nouveau Bordereau </CardTitle>");
bp = bp.replace(/>\s*Historique des Productions\s*<\/CardTitle>/, "> Historique des Voyages </CardTitle>");
bp = bp.replace(/>\s*Enregistrer la Production\s*<\/Button>/, "> Générer le Bordereau </Button>");
bp = bp.replace(/> Enregistrement...<\//g, "> Génération...</");
bp = bp.replace(/'Production enregistrée !'/g, "'Bordereau enregistré !'");
bp = bp.replace(/'Production sauvegardée localement'/g, "'Bordereau sauvegardé localement'");

// History filters
bp = bp.replace(/\.neq\('status', 'CANCELLED'\)/g, ".in('status', ['BORDEREAU_EN_COURS', 'BORDEREAU_TERMINE', 'TICKET_ONLY'])");
bp = bp.replace(/\.filter\(r => r\.status !== 'CANCELLED'\)/g, ".filter(r => ['BORDEREAU_EN_COURS', 'BORDEREAU_TERMINE', 'TICKET_ONLY'].includes(r.status))");

// Status saving
bp = bp.replace(/status: 'TICKET_ONLY'/g, "status: 'BORDEREAU_EN_COURS'");
bp = bp.replace(/status: 'DRAFT'/g, "status: 'BORDEREAU_EN_COURS'");

// Add departure_time to payload
bp = bp.replace(/trip_number: tripNumber,/g, "trip_number: tripNumber,\n        departure_time: new Date().toISOString(),");

// In Bordereaux, we don't sync fuel because Agent Recette has no fuel!
// Actually, let's just let it be, data.fuel is 0 by default. So payload.expense_fuel is 0.

fs.writeFileSync('src/modules/bordereaux/BordereauxPage.tsx', bp);


// 2. CREATE TICKET BORDEREAU
let tb = fs.readFileSync('src/modules/production/TicketPrint.tsx', 'utf8');
tb = tb.replace(/TicketPrint/g, 'TicketBordereau');
tb = tb.replace(/>\s*REÇU DE PRODUCTION\s*<\/div>/, "> TICKET DE BORDEREAU </div>");
fs.writeFileSync('src/modules/bordereaux/TicketBordereau.tsx', tb);


// 3. MODIFY PRODUCTION PAGE TO EXCLUDE BORDEREAUX
let pp = fs.readFileSync('src/modules/production/ProductionPage.tsx', 'utf8');

// Filter out BORDEREAU_EN_COURS and BORDEREAU_TERMINE
pp = pp.replace(/\.neq\('status', 'CANCELLED'\)/g, ".not('status', 'in', '(\"BORDEREAU_EN_COURS\",\"BORDEREAU_TERMINE\",\"TICKET_ONLY\")')");
pp = pp.replace(/\.filter\(r => r\.status !== 'CANCELLED'\)/g, ".filter(r => !['BORDEREAU_EN_COURS', 'BORDEREAU_TERMINE', 'TICKET_ONLY'].includes(r.status))");

fs.writeFileSync('src/modules/production/ProductionPage.tsx', pp);

console.log("Done");
