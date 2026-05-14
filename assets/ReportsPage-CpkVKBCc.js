import{a as e,i as t,n,o as r,t as i}from"./card-DUQNStDy.js";import{t as a}from"./save-haQp3V5q.js";import{t as o}from"./trending-up-Co6COVQq.js";import{f as s,l as c,p as l,s as u,t as d,u as f}from"./index-BPb_EH6o.js";var p=u(`calendar-days`,[[`path`,{d:`M8 2v4`,key:`1cmpym`}],[`path`,{d:`M16 2v4`,key:`4m81vk`}],[`rect`,{width:`18`,height:`18`,x:`3`,y:`4`,rx:`2`,key:`1hopcy`}],[`path`,{d:`M3 10h18`,key:`8toen8`}],[`path`,{d:`M8 14h.01`,key:`6423bh`}],[`path`,{d:`M12 14h.01`,key:`1etili`}],[`path`,{d:`M16 14h.01`,key:`1gbofw`}],[`path`,{d:`M8 18h.01`,key:`lrp35t`}],[`path`,{d:`M12 18h.01`,key:`mhygvu`}],[`path`,{d:`M16 18h.01`,key:`kzsmim`}]]),m=u(`chart-no-axes-column`,[[`path`,{d:`M5 21v-6`,key:`1hz6c0`}],[`path`,{d:`M12 21V3`,key:`1lcnhd`}],[`path`,{d:`M19 21V9`,key:`unv183`}]]),h=u(`chevron-left`,[[`path`,{d:`m15 18-6-6 6-6`,key:`1wnfg3`}]]),g=u(`chevron-right`,[[`path`,{d:`m9 18 6-6-6-6`,key:`mthhwq`}]]),_=u(`file-down`,[[`path`,{d:`M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z`,key:`1oefj6`}],[`path`,{d:`M14 2v5a1 1 0 0 0 1 1h5`,key:`wfsgrz`}],[`path`,{d:`M12 18v-6`,key:`17g6i2`}],[`path`,{d:`m9 15 3 3 3-3`,key:`1npd3o`}]]),v=u(`printer`,[[`path`,{d:`M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2`,key:`143wyd`}],[`path`,{d:`M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6`,key:`1itne7`}],[`rect`,{x:`6`,y:`14`,width:`12`,height:`8`,rx:`1`,key:`1ue0tg`}]]),y=u(`triangle-alert`,[[`path`,{d:`m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3`,key:`wmoenq`}],[`path`,{d:`M12 9v4`,key:`juzpu7`}],[`path`,{d:`M12 17h.01`,key:`p32p05`}]]),b=l(s(),1),x=f(),S=`rex-productions`,C=`rex-reports-comments`,w=e=>String(e).padStart(2,`0`),T=e=>`${w(e.getDate())}/${w(e.getMonth()+1)}/${e.getFullYear()}`,E=e=>`${e.getFullYear()}-${w(e.getMonth()+1)}-${w(e.getDate())}`,D=(e,t)=>{let n=new Date(e);return n.setMonth(n.getMonth()+t),n},O=[`Janvier`,`Février`,`Mars`,`Avril`,`Mai`,`Juin`,`Juillet`,`Août`,`Septembre`,`Octobre`,`Novembre`,`Décembre`];function k({value:e,onChange:t}){let[n,r]=(0,b.useState)(!1),[i,a]=(0,b.useState)(new Date),[o,s]=(0,b.useState)(null),c=(0,b.useRef)(null);(0,b.useEffect)(()=>{let e=e=>{c.current&&!c.current.contains(e.target)&&r(!1)};return document.addEventListener(`mousedown`,e),()=>document.removeEventListener(`mousedown`,e)},[]);let l=i,u=D(i,1),d=(e,t)=>{let n=new Date(e,t,1).getDay(),r=new Date(e,t+1,0).getDate();return{first:n===0?6:n-1,days:r}},f=n=>{!e.start||e.start&&e.end?t({start:n,end:null}):(n<e.start?t({start:n,end:e.start}):t({start:e.start,end:n}),r(!1))},m=t=>{if(!e.start)return!1;let n=e.end||o;if(!n)return!1;let r=e.start<n?e.start:n,i=e.start<n?n:e.start;return t>r&&t<i},_=t=>e.start&&E(t)===E(e.start),v=t=>e.end&&E(t)===E(e.end),y=e.start&&e.end?`${T(e.start)} → ${T(e.end)}`:e.start?`${T(e.start)} → ...`:`Sélectionner une période`,S=e=>{let t=e.getFullYear(),n=e.getMonth(),{first:r,days:i}=d(t,n);return(0,x.jsxs)(`div`,{className:`select-none min-w-[200px]`,children:[(0,x.jsxs)(`p`,{className:`text-center text-white font-semibold mb-3 text-sm`,children:[O[n],` `,t]}),(0,x.jsx)(`div`,{className:`grid grid-cols-7 gap-0.5 text-center mb-1`,children:[`Lu`,`Ma`,`Me`,`Je`,`Ve`,`Sa`,`Di`].map(e=>(0,x.jsx)(`span`,{className:`text-xs text-muted-foreground py-1`,children:e},e))}),(0,x.jsxs)(`div`,{className:`grid grid-cols-7 gap-0.5`,children:[Array(r).fill(null).map((e,t)=>(0,x.jsx)(`div`,{},`e${t}`)),Array.from({length:i},(e,r)=>{let i=new Date(t,n,r+1),a=_(i),o=v(i),c=m(i);return(0,x.jsx)(`button`,{onClick:()=>f(i),onMouseEnter:()=>s(i),onMouseLeave:()=>s(null),className:`
                  text-xs py-1.5 rounded transition-colors
                  ${a||o?`bg-accent text-white font-bold`:``}
                  ${c?`bg-accent/20 text-accent`:``}
                  ${!a&&!o&&!c?`text-white hover:bg-accent/30`:``}
                `,children:r+1},r)})]})]})};return(0,x.jsxs)(`div`,{className:`relative`,ref:c,children:[(0,x.jsxs)(`button`,{onClick:()=>r(!n),className:`flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border text-white text-sm hover:border-accent transition-colors`,children:[(0,x.jsx)(p,{className:`h-4 w-4 text-accent`}),y]}),n&&(0,x.jsxs)(`div`,{className:`absolute z-50 mt-2 p-4 bg-card border border-border rounded-xl shadow-2xl right-0 sm:right-auto`,children:[(0,x.jsxs)(`div`,{className:`flex items-center justify-between mb-3`,children:[(0,x.jsx)(`button`,{onClick:()=>a(D(i,-1)),className:`text-muted-foreground hover:text-white p-1`,children:(0,x.jsx)(h,{className:`h-4 w-4`})}),(0,x.jsx)(`button`,{onClick:()=>a(D(i,1)),className:`text-muted-foreground hover:text-white p-1`,children:(0,x.jsx)(g,{className:`h-4 w-4`})})]}),(0,x.jsxs)(`div`,{className:`flex flex-col sm:flex-row gap-6`,children:[S(l),(0,x.jsx)(`div`,{className:`hidden sm:block w-px bg-border`}),S(u)]}),(e.start||e.end)&&(0,x.jsxs)(`div`,{className:`mt-3 pt-3 border-t border-border flex justify-between items-center`,children:[(0,x.jsx)(`span`,{className:`text-xs text-muted-foreground`,children:y}),(0,x.jsx)(`button`,{onClick:()=>t({start:null,end:null}),className:`text-xs text-destructive hover:opacity-80`,children:`Effacer`})]})]})]})}function A({data:e}){let t=Math.max(...e.map(e=>e.value),1);return(0,x.jsx)(`div`,{className:`flex items-end gap-2 h-48 w-full`,children:e.map((e,n)=>(0,x.jsxs)(`div`,{className:`flex flex-col items-center flex-1 gap-1 group relative`,children:[(0,x.jsx)(`span`,{className:`absolute -top-6 text-[10px] text-accent font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap`,children:e.value.toLocaleString()}),(0,x.jsx)(`div`,{className:`w-full bg-secondary/50 rounded-t relative h-32`,children:(0,x.jsx)(`div`,{className:`absolute bottom-0 w-full bg-accent rounded-t transition-all duration-700 hover:bg-accent/80 cursor-pointer`,style:{height:`${e.value/t*100}%`}})}),(0,x.jsx)(`span`,{className:`text-[10px] text-muted-foreground truncate w-full text-center`,children:e.label})]},n))})}function j({label:e,value:t,sub:n,icon:r,color:i=`text-accent`}){return(0,x.jsxs)(`div`,{className:`bg-card rounded-xl p-5 border border-border shadow-sm hover:border-accent/30 transition-all`,children:[(0,x.jsxs)(`div`,{className:`flex items-center justify-between mb-3`,children:[(0,x.jsx)(`span`,{className:`text-xs font-semibold text-muted-foreground uppercase tracking-wider`,children:e}),(0,x.jsx)(`div`,{className:`p-2 rounded-lg ${i.replace(`text-`,`bg-`).replace(`400`,`400/10`)}`,children:(0,x.jsx)(r,{className:`h-5 w-5 ${i}`})})]}),(0,x.jsx)(`p`,{className:`text-2xl font-black ${i}`,children:t}),n&&(0,x.jsxs)(`p`,{className:`text-xs text-muted-foreground mt-2 flex items-center gap-1`,children:[(0,x.jsx)(o,{className:`h-3 w-3`}),` `,n]})]})}function M(){let[s,l]=(0,b.useState)({start:null,end:null}),[u,f]=(0,b.useState)(``),[p,h]=(0,b.useState)(!1),[g,w]=(0,b.useState)([]);(0,b.useEffect)(()=>{let e=localStorage.getItem(S);if(e)try{w(JSON.parse(e))}catch{}let t=localStorage.getItem(C);if(t)try{f(JSON.parse(t).ceo||``)}catch{}},[]);let D=g.filter(e=>{if(!s.start||!s.end)return!0;let t=new Date(e.date),n=new Date(s.start);n.setHours(0,0,0,0);let r=new Date(s.end);return r.setHours(23,59,59,999),t>=n&&t<=r}).sort((e,t)=>new Date(t.date).getTime()-new Date(e.date).getTime()),M=D.reduce((e,t)=>e+Number(t.revenue||0),0),N=D.reduce((e,t)=>e+Number(t.fuel||0)+Number(t.toll||0)+Number(t.washing||0)+Number(t.others||0),0),P=D.reduce((e,t)=>e+Number(t.netToDeposit||0),0),F=D.length?Math.round(D.reduce((e,t)=>e+Number(t.passengersAtDeparture)/Number(t.totalSeats)*100,0)/D.length):0,I=(()=>{if(s.start&&s.end&&Math.ceil(Math.abs(s.end.getTime()-s.start.getTime())/(1e3*60*60*24))<=45){let e=[];for(let t=new Date(s.start);t<=s.end;t.setDate(t.getDate()+1)){let n=E(t),r=D.filter(e=>E(new Date(e.date))===n).reduce((e,t)=>e+Number(t.netToDeposit||0),0);e.push({label:`${t.getDate()}/${t.getMonth()+1}`,value:r})}return e}return Array.from({length:6},(e,t)=>{let n=new Date;n.setMonth(n.getMonth()-(5-t));let r=n.getFullYear(),i=n.getMonth(),a=g.filter(e=>{let t=new Date(e.date);return t.getFullYear()===r&&t.getMonth()===i}).reduce((e,t)=>e+Number(t.netToDeposit||0),0);return{label:O[i].slice(0,3),value:a}})})(),L=D.filter(e=>{let t=Number(e.passengersAtDeparture)/Number(e.totalSeats),n=(Number(e.fuel)+Number(e.toll)+Number(e.washing)+Number(e.others))/Number(e.revenue);return t<.4||Number(e.netToDeposit)<5e3||n>.6}),R=()=>{localStorage.setItem(C,JSON.stringify({ceo:u})),h(!0),c.success(`Commentaire sauvegardé`),setTimeout(()=>h(!1),3e3)},z=e=>{let t=`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Rex - Rapport ${e}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
          body { font-family: 'Inter', sans-serif; color: #1f2937; padding: 40px; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
          .logo-box { display: flex; align-items: center; gap: 15px; }
          .logo { width: 60px; height: 60px; background: #10b981; border-radius: 15px; display: flex; align-items: center; justify-content: center; color: white; font-size: 32px; font-weight: 800; }
          .brand-name { font-size: 28px; font-weight: 800; color: #064e3b; margin: 0; }
          .report-title { font-size: 18px; color: #059669; font-weight: 600; margin-top: 5px; }
          .meta { text-align: right; font-size: 12px; color: #6b7280; }
          
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
          .kpi { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 15px; text-align: center; }
          .kpi-label { font-size: 11px; font-weight: 600; color: #065f46; text-transform: uppercase; margin-bottom: 5px; }
          .kpi-value { font-size: 20px; font-weight: 800; color: #047857; }
          
          h2 { font-size: 16px; font-weight: 800; color: #064e3b; border-left: 4px solid #10b981; padding-left: 10px; margin: 25px 0 15px 0; text-transform: uppercase; }
          
          table { width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden; font-size: 12px; }
          th { background: #065f46; color: white; padding: 12px; text-align: left; font-weight: 600; }
          td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; }
          tr:nth-child(even) { background: #f9fafb; }
          .net-val { font-weight: 800; color: #059669; }
          
          .anomaly-list { display: flex; flex-direction: column; gap: 8px; }
          .anomaly { background: #fff1f2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px 15px; font-size: 12px; color: #991b1b; display: flex; align-items: center; gap: 10px; }
          .anomaly b { color: #be123c; }
          
          .ceo-section { margin-top: 40px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; }
          .ceo-title { font-weight: 800; color: #1e293b; font-size: 14px; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
          .ceo-text { font-style: italic; color: #475569; font-size: 13px; border-left: 3px solid #10b981; padding-left: 15px; }
          
          .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; }
          
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-box">
            <div class="logo">R</div>
            <div>
              <h1 class="brand-name">REX</h1>
              <div class="report-title">RAPPORT ${e.toUpperCase()}</div>
            </div>
          </div>
          <div class="meta">
            <div>Généré le <b>${new Date().toLocaleDateString(`fr-FR`,{dateStyle:`full`})}</b></div>
            ${s.start?`<div>Période : <b>${T(s.start)} — ${s.end?T(s.end):`...`}</b></div>`:``}
            <div>Agences : <b>Toutes Agences</b></div>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi"><div class="kpi-label">Recette Brut</div><div class="kpi-value">${M.toLocaleString()} XAF</div></div>
          <div class="kpi"><div class="kpi-label">Dépenses</div><div class="kpi-value">${N.toLocaleString()} XAF</div></div>
          <div class="kpi"><div class="kpi-label">Net à Verser</div><div class="kpi-value">${P.toLocaleString()} XAF</div></div>
          <div class="kpi"><div class="kpi-label">Occupation Moy.</div><div class="kpi-value">${F}%</div></div>
        </div>

        <h2>Détail des Activités</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Véhicule</th>
              <th>Chauffeur</th>
              <th>Occ.</th>
              <th>Recette</th>
              <th>Net</th>
            </tr>
          </thead>
          <tbody>
            ${D.map(e=>`
              <tr>
                <td>${new Date(e.date).toLocaleDateString(`fr-FR`)}</td>
                <td><b>${e.immatriculation}</b></td>
                <td>${e.driverName}</td>
                <td>${e.passengersAtDeparture}/${e.totalSeats}</td>
                <td>${Number(e.revenue).toLocaleString()}</td>
                <td class="net-val">${Number(e.netToDeposit).toLocaleString()}</td>
              </tr>
            `).join(``)||`<tr><td colspan="6" style="text-align:center;color:#6b7280;padding:40px">Aucune donnée trouvée sur cette période.</td></tr>`}
          </tbody>
        </table>

        ${L.length>0?`
          <h2>Audit & Anomalies Detected</h2>
          <div class="anomaly-list">
            ${L.map(e=>`
              <div class="anomaly">
                <span>⚠</span>
                <div>
                  <b>${e.immatriculation} (${e.driverName})</b> : 
                  ${Number(e.netToDeposit)<5e3?`Performance critique (${Number(e.netToDeposit).toLocaleString()} XAF)`:`Faible taux d'occupation (${Math.round(Number(e.passengersAtDeparture)/Number(e.totalSeats)*100)}%)`}
                </div>
              </div>
            `).join(``)}
          </div>
        `:``}

        <div class="ceo-section">
          <div class="ceo-title">📝 OBSERVATIONS & COMMENTAIRE DU PDG</div>
          <div class="ceo-text">${u||`Aucune observation particulière pour ce rapport.`}</div>
        </div>

        <div class="footer">
          Système de Gestion Rex — Document Confidentiel — © ${new Date().getFullYear()}
        </div>
      </body>
      </html>
    `,n=window.open(``,`_blank`);n&&(n.document.write(t),n.document.close(),n.focus(),setTimeout(()=>{n.print()},700)),c.success(`Rapport ${e} prêt à l'impression`)},B=[{label:`Rapport Journalier`,sub:`Audit des départs du jour`,type:`Journalier`,icon:v},{label:`Rapport Hebdomadaire`,sub:`Analyse de performance hebdo`,type:`Hebdomadaire`,icon:o},{label:`Rapport Mensuel`,sub:`Bilan comptable mensuel`,type:`Mensuel`,icon:m}];return(0,x.jsxs)(`div`,{className:`space-y-8`,children:[(0,x.jsxs)(`div`,{className:`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6`,children:[(0,x.jsxs)(`div`,{children:[(0,x.jsx)(`h2`,{className:`text-3xl font-black tracking-tight text-white`,children:`Reports Center`}),(0,x.jsx)(`p`,{className:`text-muted-foreground mt-1`,children:`Intelligence d'affaires et audit de performance Rex.`})]}),(0,x.jsxs)(`div`,{className:`flex flex-wrap gap-3`,children:[(0,x.jsx)(k,{value:s,onChange:l}),(0,x.jsx)(d,{variant:`outline`,className:`border-border text-white hover:bg-secondary`,onClick:()=>{l({start:null,end:null})},children:`Reset`})]})]}),(0,x.jsxs)(`div`,{className:`grid gap-6 md:grid-cols-2 lg:grid-cols-4`,children:[(0,x.jsx)(j,{label:`Chiffre d'Affaires`,value:`${M.toLocaleString()} XAF`,icon:o}),(0,x.jsx)(j,{label:`Charges Opérationnelles`,value:`${N.toLocaleString()} XAF`,icon:m,color:`text-destructive`}),(0,x.jsx)(j,{label:`Net à Verser Total`,value:`${P.toLocaleString()} XAF`,icon:r,color:`text-green-400`}),(0,x.jsx)(j,{label:`Productivité Moy.`,value:`${F}%`,icon:m,color:F>=75?`text-green-400`:`text-yellow-400`,sub:`${D.length} missions auditées`})]}),(0,x.jsxs)(`div`,{className:`grid gap-6 lg:grid-cols-3`,children:[(0,x.jsxs)(i,{className:`lg:col-span-2 bg-card border-border shadow-lg`,children:[(0,x.jsxs)(t,{className:`flex flex-row items-center justify-between`,children:[(0,x.jsxs)(`div`,{children:[(0,x.jsxs)(e,{className:`text-white flex items-center gap-2`,children:[(0,x.jsx)(o,{className:`h-5 w-5 text-accent`}),`Performance `,s.start?`sur la période`:`Mensuelle`]}),(0,x.jsx)(`p`,{className:`text-xs text-muted-foreground mt-1`,children:`Evolution du revenu net (XAF)`})]}),s.start&&(0,x.jsx)(`span`,{className:`text-[10px] bg-accent/10 text-accent px-2 py-1 rounded font-bold uppercase`,children:`Dynamic View`})]}),(0,x.jsx)(n,{className:`pt-6`,children:I.length===0?(0,x.jsx)(`div`,{className:`h-48 flex items-center justify-center text-muted-foreground bg-secondary/10 rounded-xl border border-dashed border-border`,children:(0,x.jsx)(`p`,{children:`Aucune donnée disponible pour cette période.`})}):(0,x.jsx)(A,{data:I})})]}),(0,x.jsxs)(`div`,{className:`space-y-4`,children:[(0,x.jsx)(`h3`,{className:`text-sm font-bold text-white uppercase tracking-widest px-1`,children:`Exporter Reports`}),B.map(({label:e,sub:t,type:r,icon:a})=>(0,x.jsx)(i,{className:`bg-card border-border hover:border-accent/40 transition-all group cursor-pointer`,onClick:()=>z(r),children:(0,x.jsxs)(n,{className:`p-4 flex items-center gap-4`,children:[(0,x.jsx)(`div`,{className:`h-10 w-10 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-accent transition-colors`,children:(0,x.jsx)(a,{className:`h-5 w-5 text-white`})}),(0,x.jsxs)(`div`,{className:`flex-1`,children:[(0,x.jsx)(`p`,{className:`text-sm font-bold text-white`,children:e}),(0,x.jsx)(`p`,{className:`text-[10px] text-muted-foreground`,children:t})]}),(0,x.jsx)(_,{className:`h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors`})]})},r))]})]}),(0,x.jsxs)(`div`,{className:`grid gap-6 md:grid-cols-2`,children:[(0,x.jsxs)(i,{className:`bg-card border-border ${L.length>0?`ring-1 ring-yellow-500/20`:``}`,children:[(0,x.jsxs)(t,{children:[(0,x.jsxs)(e,{className:`text-white flex items-center gap-2`,children:[(0,x.jsx)(y,{className:`h-5 w-5 ${L.length>0?`text-yellow-400`:`text-muted-foreground`}`}),`Audit de Conformité`]}),(0,x.jsx)(`p`,{className:`text-xs text-muted-foreground`,children:`Détection automatique des performances critiques.`})]}),(0,x.jsx)(n,{className:`max-h-[300px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-border`,children:L.length===0?(0,x.jsxs)(`div`,{className:`flex flex-col items-center justify-center py-10 text-muted-foreground opacity-50`,children:[(0,x.jsx)(r,{className:`h-10 w-10 mb-2 text-green-400`}),(0,x.jsx)(`p`,{className:`text-sm`,children:`Toutes les missions sont conformes.`})]}):L.map((e,t)=>(0,x.jsxs)(`div`,{className:`flex items-start gap-4 bg-secondary/20 border border-border rounded-xl p-4 hover:bg-secondary/30 transition-colors`,children:[(0,x.jsx)(`div`,{className:`h-8 w-8 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0`,children:(0,x.jsx)(y,{className:`h-4 w-4 text-yellow-400`})}),(0,x.jsxs)(`div`,{className:`flex-1 min-w-0`,children:[(0,x.jsxs)(`p`,{className:`text-sm font-bold text-white truncate`,children:[e.immatriculation,` — `,e.driverName]}),(0,x.jsx)(`p`,{className:`text-xs text-muted-foreground mt-1`,children:Number(e.netToDeposit)<5e3?`Alerte Revenu : ${Number(e.netToDeposit).toLocaleString()} XAF (trop faible)`:`Alerte Occupation : ${Math.round(Number(e.passengersAtDeparture)/Number(e.totalSeats)*100)}% (sous le seuil)`})]}),(0,x.jsxs)(`span`,{className:`text-[10px] text-muted-foreground bg-border px-2 py-1 rounded`,children:[`Audit Ref. `,t+1]})]},t))})]}),(0,x.jsxs)(i,{className:`bg-card border-border`,children:[(0,x.jsxs)(t,{children:[(0,x.jsx)(e,{className:`text-white text-base`,children:`Directives de Direction`}),(0,x.jsx)(`p`,{className:`text-xs text-muted-foreground`,children:`Ce texte sera apposé sur les rapports PDF officiels.`})]}),(0,x.jsxs)(n,{className:`space-y-4`,children:[(0,x.jsx)(`textarea`,{value:u,onChange:e=>{f(e.target.value),h(!1)},placeholder:`Saisissez vos observations ou instructions ici...`,rows:6,className:`w-full rounded-xl bg-secondary/30 border border-border text-white placeholder:text-muted-foreground px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all resize-none`}),(0,x.jsxs)(`div`,{className:`flex items-center justify-between`,children:[(0,x.jsx)(`div`,{className:`flex items-center gap-2`,children:p&&(0,x.jsxs)(`span`,{className:`flex items-center gap-1.5 text-green-400 text-xs font-bold animate-in fade-in slide-in-from-left-2`,children:[(0,x.jsx)(r,{className:`h-4 w-4`}),` Sauvegardé`]})}),(0,x.jsxs)(d,{onClick:R,className:`bg-accent hover:bg-accent/90 text-white font-bold px-8 shadow-lg shadow-accent/20`,children:[(0,x.jsx)(a,{className:`mr-2 h-4 w-4`}),` Publier`]})]})]})]})]})]})}export{M as default};