const fs = require('fs');

let bp = fs.readFileSync('src/modules/bordereaux/BordereauxPage.tsx', 'utf8');

// 1. Remove "Dépenses du trajet (FCFA)" section
const startDepenses = bp.indexOf("{/*  Dépenses du trajet (affiché pour admin, chef et caissière)  */}");
const endNet = bp.indexOf("{/*  Bouton d'enregistrement  */}");
if (startDepenses !== -1 && endNet !== -1) {
    bp = bp.slice(0, startDepenses) + bp.slice(endNet);
}

// 2. Fix the display of the status badge
bp = bp.replace(/{rec\.status === 'VALIDATED' \? '✔ Validé' : '⏳ Brouillon'}/g, 
  "{rec.status === 'BORDEREAU_TERMINE' ? '✔ Terminé' : '⏳ En cours'}");

bp = bp.replace(/rec\.status === 'VALIDATED'/g, "rec.status === 'BORDEREAU_TERMINE'");

// 3. Fix handleValidateArrival to update status to 'BORDEREAU_TERMINE'
bp = bp.replace(
  /update\(\{ arrival_time: new Date\(\)\.toISOString\(\) \}\)/g, 
  "update({ status: 'BORDEREAU_TERMINE', arrival_time: new Date().toISOString() })"
);

// 4. Change handleValidateSelected to use BORDEREAU_TERMINE instead of VALIDATED
// (already partially covered by replace VALIDATED above, but let's check it)
bp = bp.replace(/update\(\{ status: 'VALIDATED' \}\)/g, "update({ status: 'BORDEREAU_TERMINE' })");

fs.writeFileSync('src/modules/bordereaux/BordereauxPage.tsx', bp);

console.log("Cleanup done");
