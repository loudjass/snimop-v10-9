import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const drawDevisSection = (pdf: jsPDF, store: any, drawHeader: any, addSection: any, addStepSignature: any) => {
  pdf.addPage();
  const prestationStr = store.prestationType ? store.prestationType.replace('_', ' + ').toUpperCase() : 'NON DÉFINI';
  let y = drawHeader(pdf, `DEVIS SNIMOP - ${prestationStr}`);
  
  y = addSection("Descriptif technique des prestations", store.descriptifTravaux);
  y = addSection("Détail du matériel prévu", store.devisMateriel);
  y = addSection("Réserves et Exclusions", store.reserves);

  // Moteur de calcul PDF
  const totalMoHT = (store.tauxHoraireMO || 0) * (store.heuresMO || 0);
  const totalNacelleHT = store.nacelleActive ? (store.coutNacelleHT || 0) : 0;
  const coutTotalHT = (store.coutMaterielHT || 0) + totalMoHT + (store.coutDeplacementHT || 0) + totalNacelleHT + (store.autresFraisHT || 0);
  const margeEuros = coutTotalHT * ((store.margePourcentage || 0) / 100);
  const prixConseilleHT = coutTotalHT + margeEuros;

  const isEcrasementTotal = store.prixFinalManuel !== null && store.prixFinalManuel !== undefined && String(store.prixFinalManuel) !== '';
  const prixRetenuHT = isEcrasementTotal ? Number(store.prixFinalManuel) : prixConseilleHT + (store.ajustementManuel || 0);
  const tva = prixRetenuHT * ((store.tvaPourcentage || 0) / 100);
  const totalTTC = prixRetenuHT + tva;

  if (y > 215) { pdf.addPage(); y = drawHeader(pdf, `DEVIS SNIMOP - ${prestationStr} (Suite)`); }
  else { y += 5; }

  // BLOC FINANCIER
  pdf.setFillColor(250, 252, 255);
  pdf.setDrawColor(30, 58, 138); 
  pdf.setLineWidth(0.4);
  pdf.roundedRect(14, y, 182, 60, 3, 3, 'FD'); 

  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(30, 58, 138);
  pdf.text("RÉCAPITULATIF FINANCIER", 20, y + 10);
  
  let fY = y + 18;
  pdf.setFontSize(10);
  pdf.setTextColor(60, 60, 60);

  const calcMode = isEcrasementTotal ? 'IMPOSÉ' : (Number(store.ajustementManuel) !== 0 ? 'AJUSTÉ' : 'AUTO');
  const isClientMode = store.devisModeClient;

  pdf.setFont("helvetica", "normal");
  if (calcMode === 'IMPOSÉ' || isClientMode) {
    pdf.setFont("helvetica", "bold");
    pdf.text("Description de la prestation :", 20, fY);
    pdf.setFont("helvetica", "normal");
    const lines = pdf.splitTextToSize(store.descriptifTravaux || prestationStr, 70);
    pdf.text(lines, 20, fY + 6);
  } else {
    pdf.text(`Fournitures matériel : ${store.coutMaterielHT?.toFixed(2) || '0.00'} €`, 20, fY);
    pdf.text(`Main d'œuvre (${store.heuresMO || 0}h) : ${totalMoHT.toFixed(2)} €`, 20, fY + 6);
    pdf.text(`Déplacement et logistique : ${store.coutDeplacementHT?.toFixed(2) || '0.00'} €`, 20, fY + 12);
    
    let nextY = fY + 18;
    if (store.nacelleActive) {
      pdf.text(`Option Nacelle : ${store.coutNacelleHT?.toFixed(2) || '0.00'} €`, 20, nextY);
    }
  }
  
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`TOTAL HT :`, 105, fY + 6);
  pdf.text(`${prixRetenuHT.toFixed(2)} €`, 185, fY + 6, { align: 'right' });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.text(`TVA (${store.tvaPourcentage || 0}%) :`, 105, fY + 14);
  pdf.text(`${tva.toFixed(2)} €`, 185, fY + 14, { align: 'right' });

  pdf.setFillColor(30, 58, 138);
  pdf.roundedRect(100, fY + 20, 90, 16, 2, 2, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text(`TOTAL TTC : ${totalTTC.toFixed(2)} €`, 145, fY + 31, { align: 'center' });

  addStepSignature('devis', "VALIDATION DEVIS");
};

export const drawRapportSection = (pdf: jsPDF, store: any, drawHeader: any, addSection: any, addSectionAt: any, addStepSignature: any) => {
  pdf.addPage();
  const y = drawHeader(pdf, "RAPPORT D'INTERVENTION SNIMOP");
  
  addSection("Nature réelle de l'intervention", store.natureReelle);
  addSection("Travaux effectivement réalisés", store.travauxRealises);
  addSection("Matériel utilisé sur site", store.materielUtilise);
  
  let yRTop = (pdf as any).getY ? (pdf as any).getY() : 150;
  let yRL = addSectionAt("Temps passé sur site", store.tempsPasse ? `${store.tempsPasse} heures` : "", 14, yRTop, true);
  let yRR = addSectionAt("Anomalies constatées", store.anomalies, 110, yRTop, true);
  
  const yBottom = Math.max(yRL, yRR);
  if ((pdf as any).setY) (pdf as any).setY(yBottom);
  
  addSection("Réserves techniques éventuelles", store.rapportReserves);
  addSection("Observations finales et commentaires", store.observationsFinales);
  
  addStepSignature('rapport', "RAPPORT D'INTERVENTION");
};

export const drawInformationsSection = (pdf: jsPDF, store: any, drawHeader: any, addSection: any, addSectionAt: any, addStepSignature: any) => {
  pdf.addPage();
  const y = drawHeader(pdf, "INFORMATIONS GÉNÉRALES SNIMOP");
  const yL = addSectionAt("Client", `Nom : ${store.client || 'Non renseigné'}\nContact : ${store.contact || '-'}\nTél : ${store.telephone || '-'}\nEmail : ${store.email || '-'}`, 14, y, true);
  const yR = addSectionAt("Chantier", `Site : ${store.site || 'Non renseigné'}\nAdresse : ${store.adresse || '-'}\nTechnicien assigné : ${store.technicien || '-'}`, 110, y, true);
  
  const bottomY = Math.max(yL, yR) + 5;
  pdf.setDrawColor(230, 230, 230);
  pdf.line(14, bottomY - 5, 196, bottomY - 5);
  
  addSection("Objet de l'intervention", store.objet);
  addStepSignature('informations', "INFORMATIONS GÉNÉRALES");
};

export const drawVisiteSection = (pdf: jsPDF, store: any, drawHeader: any, addSection: any, addSectionAt: any, addStepSignature: any) => {
  pdf.addPage();
  let y = drawHeader(pdf, "VISITE AVANT DEVIS SNIMOP");
  
  y = addSection("Contexte et Constat", store.constat || store.contexte);
  y = addSection("Équipement concerné", store.equipement);
  y = addSection("Observations détaillées", store.observations); 
  y = addSection("Travaux à réaliser préconisés", store.travauxPreconises);
  y = addSection("Matériel nécessaire envisagé", store.materielEnvisage);
  
  let yVTop = y;
  let yVL = addSectionAt("Main d'œuvre estimée", store.moEstimee, 14, yVTop, true);
  let yVR = addSectionAt("Déplacement", store.deplacement, 110, yVTop, true);
  y = Math.max(yVL, yVR);
  
  addSection("Option nacelle", store.optionNacelle);
  addSection("Remarques complémentaires", store.remarques);
  
  addStepSignature('visite', "VISITE AVANT DEVIS");
};

export const drawInterventionSection = (pdf: jsPDF, store: any, drawHeader: any, addSection: any, addStepSignature: any) => {
  pdf.addPage();
  drawHeader(pdf, "BON D'INTERVENTION SNIMOP");
  
  addSection("Date d'intervention prévue", store.dateIntervention);
  addSection("Nature des travaux à réaliser", store.natureTravaux);
  addSection("Matériel et logistique nécessaires", store.materielPrevu); 
  addSection("Consignes et Remarques de préparation", store.consignes);
  
  addStepSignature('intervention', "BON D'INTERVENTION");
};
