"use client";
import React, { useState, useEffect } from 'react';
import { useDossierStore } from '@/store/useDossierStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SignaturePad } from '@/components/SignaturePad';
import { ArrowLeft, Download, Share2, CheckCircle, MessageCircle, Mail } from 'lucide-react';
import jsPDF from 'jspdf';
import { format, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';

import { SNIMOP_LOGO_PATH } from '@/components/ui/SnimopLogo';
import { 
  drawDevisSection, 
  drawRapportSection, 
  drawInformationsSection, 
  drawVisiteSection, 
  drawInterventionSection 
} from '@/utils/pdfSectionDrawers';

// LOAD REAL PNG LOGO AVEC RATIO NATUREL
const loadLogoBase64 = async (): Promise<{img: HTMLImageElement, ratio: number} | null> => {
  try {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ img, ratio: img.width / img.height });
      img.onerror = () => {
         console.error("ERREUR CRITIQUE: Impossible de lire les dimensions de l'image.");
         resolve(null);
      };
      img.src = SNIMOP_LOGO_PATH;
    });
  } catch (e) {
    console.error("ERREUR CRITIQUE: Impossible de lire le logo", e);
    return null;
  }
};

const loadMascotteBase64 = async (): Promise<{img: HTMLImageElement, ratio: number} | null> => {
  try {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ img, ratio: img.width / img.height });
      img.onerror = () => resolve(null);
      img.src = '/snimop-mascote.png';
    });
  } catch (e) {
    return null;
  }
};

const loadPhotoBase64 = async (src: string, type: string, title: string, timestamp: string): Promise<{img: HTMLImageElement, ratio: number, type: string, title: string, timestamp: string} | null> => {
  try {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ img, ratio: img.width / img.height, type, title, timestamp });
      img.onerror = () => resolve(null);
      img.src = src;
    });
  } catch (e) {
    return null;
  }
};

export function ExportFinal() {
  const store = useDossierStore();
  const [isGenerating, setIsGenerating] = useState(false);
  
  const getSafeDateFormatted = (dateStr: string | undefined | null) => {
    if (!dateStr) return format(new Date(), 'dd MMMM yyyy', { locale: fr });
    const parsedDate = new Date(dateStr);
    if (!isValid(parsedDate)) return format(new Date(), 'dd MMMM yyyy', { locale: fr });
    return format(parsedDate, 'dd MMMM yyyy', { locale: fr });
  };
  
  const getSafeDateShort = (dateStr: string | undefined | null) => {
    if (!dateStr) return format(new Date(), 'dd/MM/yyyy', { locale: fr });
    const parsedDate = new Date(dateStr);
    if (!isValid(parsedDate)) return format(new Date(), 'dd/MM/yyyy', { locale: fr });
    return format(parsedDate, 'dd/MM/yyyy', { locale: fr });
  };

  const generatePdfBlob = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const logoData = await loadLogoBase64();
      const mascotteData = await loadMascotteBase64();
      
      const photoPromises = (store.photos || []).map(p => loadPhotoBase64(p.imageBase64, p.type, p.title, p.timestamp));
      const loadedPhotosResult = await Promise.all(photoPromises);
      const validPhotos = loadedPhotosResult.filter(p => p !== null) as {img: HTMLImageElement, ratio: number, type: string, title: string, timestamp: string}[];

      // ==========================================
      // PAGE 1 : PAGE DE GARDE (PLUS PRO, MIEUX CENTRÉE)
      // ==========================================
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, 210, 297, 'F');
      
      let coverY = 25; // Centrage visuel parfait (remonté pour donner du souffle en bas)
      
      if (logoData && logoData.img) {
        // Agrandissement léger (+15%)
        const targetWidth = 125;
        const targetHeight = targetWidth / logoData.ratio; 
        const xCenter = (210 - targetWidth) / 2;
        pdf.addImage(logoData.img, 'PNG', xCenter, coverY, targetWidth, targetHeight);
        coverY += targetHeight + 15;
      } else {
        coverY += 30; // Skip space if no logo
      }

      pdf.setTextColor(30, 58, 138);
      pdf.setFontSize(30);
      pdf.setFont("helvetica", "bold");
      pdf.text("DOSSIER D'INTERVENTION", 105, coverY, { align: 'center' });
      
      coverY += 8;
      pdf.setDrawColor(30, 58, 138);
      pdf.setLineWidth(1.5);
      pdf.line(60, coverY, 150, coverY);
      
      coverY += 15;
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text(`Dossier N° ${store.numeroAffaire || 'Non renseigné'}`, 105, coverY, { align: 'center' });
      
      coverY += 10;
      pdf.setFont("helvetica", "normal");
      pdf.text(`Édité le ${getSafeDateFormatted(store.date)}`, 105, coverY, { align: 'center' });

      // Client block
      coverY += 25;
      pdf.setFillColor(250, 251, 255); 
      pdf.setDrawColor(30, 58, 138);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(25, coverY, 160, 40, 3, 3, 'FD'); 
      
      pdf.setTextColor(30, 58, 138);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("CLIENT", 35, coverY + 10);
      pdf.setTextColor(40, 40, 40);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      const clientContent = `Nom : ${store.client || 'Non renseigné'}\nContact : ${store.contact || '-'}\nTél : ${store.telephone || '-'}\nEmail : ${store.email || '-'}`;
      pdf.text(pdf.splitTextToSize(clientContent, 140), 40, coverY + 18);
      
      // Site block
      coverY += 50;
      pdf.setFillColor(250, 251, 255);
      pdf.setDrawColor(30, 58, 138);
      pdf.roundedRect(25, coverY, 160, 40, 3, 3, 'FD'); 
      
      pdf.setTextColor(30, 58, 138);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("CHANTIER", 35, coverY + 10);
      pdf.setTextColor(40, 40, 40);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      const siteContent = `Site : ${store.site || 'Non renseigné'}\nAdresse : ${store.adresse || '-'}\nTechnicien assigné : ${store.technicien || '-'}`;
      pdf.text(pdf.splitTextToSize(siteContent, 140), 40, coverY + 18);

      // WATERMARK MASCOTTE PAGE 1
      if (mascotteData && mascotteData.img) {
        try {
          const markWidth = 140;
          const markHeight = markWidth / mascotteData.ratio;
          const markX = (210 - markWidth) / 2; // Centered
          const markY = 297 - markHeight - 20; // Bottom 
          
          pdf.saveGraphicsState();
          pdf.setGState(new (pdf as any).GState({ opacity: 0.06 }));
          pdf.addImage(mascotteData.img, 'PNG', markX, markY, markWidth, markHeight);
          pdf.restoreGraphicsState();
        } catch(e) { console.error("Watermark error", e); }
      }

      // EN-TÊTE INTÉRIEUR
      const drawHeader = (pageContextPdf: jsPDF, pageTitle: string) => {
        pageContextPdf.setFillColor(255, 255, 255);
        pageContextPdf.rect(0, 0, 210, 40, 'F');
        
        let lastLogoEndX = 14;

        if (logoData && logoData.img) {
          let targetWidth = 53; 
          let targetHeight = targetWidth / logoData.ratio;
          
          if (targetHeight > 25) {
            targetHeight = 25;
            targetWidth = targetHeight * logoData.ratio;
          }
          
          pageContextPdf.addImage(logoData.img, 'PNG', 14, 10, targetWidth, targetHeight);
          lastLogoEndX = 14 + targetWidth;
        }

        // WATERMARK DISCRET AU CENTRE DE CHAQUE PAGE
        if (mascotteData && mascotteData.img) {
          try {
            const wWidth = 130;
            const wHeight = wWidth / mascotteData.ratio;
            const wX = (210 - wWidth) / 2;
            const wY = (297 - wHeight) / 2;
            
            pageContextPdf.saveGraphicsState();
            pageContextPdf.setGState(new (pageContextPdf as any).GState({ opacity: 0.06 }));
            pageContextPdf.addImage(mascotteData.img, 'PNG', wX, wY, wWidth, wHeight);
            pageContextPdf.restoreGraphicsState();
          } catch(e) {}
        }

        pageContextPdf.setTextColor(100, 100, 100);
        pageContextPdf.setFontSize(10);
        pageContextPdf.setFont("helvetica", "bold");
        pageContextPdf.text(`Dossier N° ${store.numeroAffaire || '-'}`, 196, 14, { align: 'right' });
        
        pageContextPdf.setFontSize(9);
        pageContextPdf.setFont("helvetica", "normal");
        let headerY = 19;
        if (store.client && store.client.trim() !== '') {
          pageContextPdf.text(`Client : ${store.client}`, 196, headerY, { align: 'right' });
          headerY += 5;
        }
        if (store.site && store.site.trim() !== '') {
          pageContextPdf.text(`Chantier : ${store.site}`, 196, headerY, { align: 'right' });
          headerY += 5;
        }
        pageContextPdf.text(`Date : ${getSafeDateShort(store.date)}`, 196, headerY, { align: 'right' });

        pageContextPdf.setTextColor(30, 58, 138);
        pageContextPdf.setFontSize(16);
        pageContextPdf.setFont("helvetica", "bold");
        pageContextPdf.text(pageTitle.toUpperCase(), 14, 44);
        
        pageContextPdf.setDrawColor(200, 200, 200);
        pageContextPdf.setLineWidth(0.3);
        pageContextPdf.line(14, 48, 196, 48);

        return 58; 
      };

      const addSection = (title: string, content?: string | number, halfWidth: boolean = false, xPos: number = 14) => {
        let text = String(content || '').trim();
        if (!text || text === "undefined" || text === "null") text = "Non renseigné";

        // @ts-ignore
        if (pdf.internal.getCurrentPageInfo().pageNumber > 0 && (pdf as any).getY?.() > 270) {
          pdf.addPage();
          drawHeader(pdf, "Suite...");
        }

        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(30, 58, 138);
        // @ts-ignore
        const currentY = (pdf as any).getY ? (pdf as any).getY() : 58;
        pdf.text(title.toUpperCase(), xPos, currentY);

        const nextY = currentY + 7;
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(50, 50, 50);

        const ObjectifWidth = halfWidth ? 85 : 182;
        const lines = pdf.splitTextToSize(text, ObjectifWidth);
        pdf.text(lines, xPos, nextY);

        const finalY = nextY + (lines.length * 6) + 16;
        // @ts-ignore
        if ((pdf as any).setY) (pdf as any).setY(finalY);
        return finalY;
      };

      const addSectionAt = (title: string, content: string | number | undefined, xPos: number, startY: number, halfWidth: boolean = false) => {
        let text = String(content || '').trim();
        if (!text || text === "undefined") text = "Non renseigné";
        
        let localY = startY;
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(30, 58, 138); 
        pdf.text(title.toUpperCase(), xPos, localY);

        localY += 7;
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(50, 50, 50);

        const ObjectifWidth = halfWidth ? 85 : 182;
        const lines = pdf.splitTextToSize(text, ObjectifWidth);
        pdf.text(lines, xPos, localY);

        return localY + (lines.length * 6) + 16;
      };

      const addStepSignature = (stepKey: string, stepTitle: string) => {
        const sig = store.stepSignatures?.[stepKey];
        if (!sig) return;

        // @ts-ignore
        let currentY = (pdf as any).getY ? (pdf as any).getY() : 100;
        
        // Anti-debordement
        if (currentY + 55 > 280) { 
          pdf.addPage(); 
          currentY = drawHeader(pdf, stepTitle + " (Validation)"); 
        }

        currentY += 5;
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.5);
        pdf.line(14, currentY, 196, currentY);

        currentY += 8;
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(30, 58, 138);
        pdf.text("--- VALIDATION DE L'ÉTAPE ---", 105, currentY, { align: 'center' });

        currentY += 8;
        pdf.setFontSize(9);
        pdf.setTextColor(80, 80, 80);
        pdf.text(`Technicien : ${sig.technicienNom || '-'}`, 14, currentY);
        if (sig.technicienSignature && sig.technicienSignature.startsWith('data:image')) {
          pdf.addImage(sig.technicienSignature, 'PNG', 14, currentY + 2, 35, 12);
        }

        pdf.text(`Client : ${sig.clientNom || '-'}`, 110, currentY);
        if (sig.clientSignature && sig.clientSignature.startsWith('data:image')) {
          pdf.addImage(sig.clientSignature, 'PNG', 110, currentY + 2, 35, 12);
        }

        currentY += 25;
        if (sig.dateSignature) {
          pdf.setFont("helvetica", "italic");
          pdf.setFontSize(8);
          // @ts-ignore
          pdf.text(`Signé le ${new Date(sig.dateSignature).toLocaleString('fr-FR')}`, 105, currentY, { align: 'center' });
        }

        // @ts-ignore
        if ((pdf as any).setY) (pdf as any).setY(currentY + 10);
      };

      // PAGE 2 : INFOS GÉNÉRALES
      pdf.addPage();
      let y = drawHeader(pdf, "INFORMATIONS GÉNÉRALES SNIMOP");
      let yTopLine = y;
      let yL = addSectionAt("Client", `Nom : ${store.client || 'Non renseigné'}\nContact : ${store.contact || '-'}\nTél : ${store.telephone || '-'}\nEmail : ${store.email || '-'}`, 14, yTopLine, true);
      let yR = addSectionAt("Chantier", `Site : ${store.site || 'Non renseigné'}\nAdresse : ${store.adresse || '-'}\nTechnicien assigné : ${store.technicien || '-'}`, 110, yTopLine, true);
      
      y = Math.max(yL, yR) + 5;
      pdf.setDrawColor(230, 230, 230);
      pdf.line(14, y - 5, 196, y - 5);
      
      y = addSection("Objet de l'intervention", store.objet);
      
      addStepSignature('informations', "INFORMATIONS GÉNÉRALES");

      // PAGE 3 : VISITE TECHNIQUE
      pdf.addPage();
      y = drawHeader(pdf, "VISITE AVANT DEVIS SNIMOP");
      
      y = addSection("Contexte et Constat", store.constat || store.contexte);
      y = addSection("Équipement concerné", store.equipement);
      y = addSection("Observations détaillées", store.observations); 
      y = addSection("Travaux à réaliser préconisés", store.travauxPreconises);
      y = addSection("Matériel nécessaire envisagé", store.materielEnvisage);
      
      let yVTop = y;
      let yVL = addSectionAt("Main d'œuvre estimée", store.moEstimee, 14, yVTop, true);
      let yVR = addSectionAt("Déplacement", store.deplacement, 110, yVTop, true);
      y = Math.max(yVL, yVR);
      
      y = addSection("Option nacelle", store.optionNacelle);
      y = addSection("Remarques complémentaires", store.remarques);
      
      addStepSignature('visite', "VISITE AVANT DEVIS");

      // PAGE 4 : DEVIS (OPTIONNEL MAIS PRÉSENT)
      pdf.addPage();
      const prestationStr = store.prestationType ? store.prestationType.replace('_', ' + ').toUpperCase() : 'NON DÉFINI';
      y = drawHeader(pdf, `DEVIS SNIMOP - ${prestationStr}`);
      
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
      const acompteCalcule = store.acompteDemande ? totalTTC * ((store.acomptePourcentage || 0) / 100) : 0;

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
      pdf.text("RÉCAPITULATIF FINANCIER", 20, y + 8);
      
      let fY = y + 16;
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
          pdf.text(`Option Nacelle / Élévation : ${store.coutNacelleHT?.toFixed(2) || '0.00'} €`, 20, nextY);
          nextY += 6;
        }
        if (store.autresFraisHT) {
          pdf.text(`Autres frais : ${store.autresFraisHT.toFixed(2)} €`, 20, nextY);
          nextY += 6;
        }
        if (calcMode === 'AJUSTÉ') {
          pdf.setFont("helvetica", "bolditalic");
          pdf.text(`Ajustement commercial Chantier : ${(store.ajustementManuel || 0).toFixed(2)} €`, 20, nextY);
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
      pdf.text(`TOTAL TTC :`, 105, fY + 31);
      pdf.text(`${totalTTC.toFixed(2)} €`, 185, fY + 31, { align: 'right' });

      y += 80;

      if (store.acompteDemande) {
        pdf.setTextColor(30, 58, 138);
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.text(`Acompte demandé : ${acompteCalcule.toFixed(2)} € (soit ${store.acomptePourcentage || 0}%)`, 185, y, { align: 'right' });
        y += 10;
      }

      if (y > 230) { pdf.addPage(); y = drawHeader(pdf, `DEVIS SNIMOP - CONDITIONS`); }
      else { y += 2; }

      pdf.setFillColor(245, 247, 250);
      pdf.setDrawColor(200, 200, 200);
      pdf.roundedRect(14, y, 182, 25, 2, 2, 'FD');
      pdf.setFontSize(11);
      pdf.setTextColor(30, 58, 138);
      pdf.setFont("helvetica", "bold");
      pdf.text("CONDITIONS", 20, y + 8);

      pdf.setFontSize(9);
      pdf.setTextColor(80, 80, 80);
      pdf.text(`Conditions de règlement : `, 20, y + 16);
      pdf.setFont("helvetica", "normal");
      pdf.text(`${store.conditionsReglement || 'À réception de facture'}`, 60, y + 16);
      
      pdf.setFont("helvetica", "bold");
      pdf.text(`Délai de réalisation estimé : `, 20, y + 22);
      pdf.setFont("helvetica", "normal");
      pdf.text(`${store.delai || 'À convenir'}`, 65, y + 22);

      y += 35;

      if (store.bonPourAccord) {
         if (y > 240) { pdf.addPage(); y = drawHeader(pdf, `DEVIS SNIMOP - SIGNATURE`); }
         
         pdf.setFontSize(14);
         pdf.setFont("helvetica", "bold");
         pdf.setTextColor(0, 0, 0);
         pdf.text("Bon pour accord", 14, y);
         y += 8;
         pdf.setFontSize(10);
         pdf.setFont("helvetica", "normal");
         pdf.text("Fait à : ..............................................", 14, y);
         pdf.text("Le : ..................................................", 14, y + 8);
         pdf.text("Nom du signataire : ...................................", 14, y + 16);
         
         pdf.text("Signature du client (précédée de la mention 'Bon pour accord') :", 100, y);
         pdf.setDrawColor(0, 0, 0);
         pdf.setLineDashPattern([1, 1], 0);
         pdf.rect(100, y + 5, 80, 25, 'S');
         pdf.setLineDashPattern([], 0);
         
         y += 35;
      }

      y += 5;
      addStepSignature('devis', "VALIDATION DEVIS");

      // PAGE 5 : BON D'INTERVENTION
      pdf.addPage();
      y = drawHeader(pdf, "BON D'INTERVENTION SNIMOP");
      
      y = addSection("Date d'intervention prévue", store.dateIntervention);
      y = addSection("Nature des travaux à réaliser", store.natureTravaux);
      y = addSection("Matériel et logistique nécessaires", store.materielPrevu); 
      y = addSection("Consignes et Remarques de préparation", store.consignes);
      
      addStepSignature('intervention', "BON D'INTERVENTION");

      // PAGE 6 : RAPPORT D'INTERVENTION
      pdf.addPage();
      y = drawHeader(pdf, "RAPPORT D'INTERVENTION SNIMOP");
      
      y = addSection("Nature réelle de l'intervention", store.natureReelle);
      y = addSection("Travaux effectivement réalisés", store.travauxRealises);
      y = addSection("Matériel utilisé sur site", store.materielUtilise);
      
      let yRTop = y;
      let yRL = addSectionAt("Temps passé sur site", store.tempsPasse ? `${store.tempsPasse} heures` : "", 14, yRTop, true);
      let yRR = addSectionAt("Anomalies constatées", store.anomalies, 110, yRTop, true);
      y = Math.max(yRL, yRR);
      
      y = addSection("Réserves techniques éventuelles", store.rapportReserves);
      y = addSection("Observations finales et commentaires", store.observationsFinales);
      
      addStepSignature('rapport', "RAPPORT D'INTERVENTION");

      // PAGE FINALE : SIGNATURES ET PHOTOS
      pdf.addPage();
      y = drawHeader(pdf, "VALIDATION FINALE ET SIGNATURE CLIENT");
      
      y += 10;
      pdf.setDrawColor(30, 58, 138);
      pdf.setLineWidth(1);
      pdf.roundedRect(14, y, 182, 60, 3, 3, 'S'); 

      pdf.setFontSize(13);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(30, 58, 138);
      pdf.text("SIGNATURE DU CLIENT", 20, y + 12);
      
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(60, 60, 60);
      pdf.setFontSize(11);
      const signataire = store.nomSignataireClient || store.contact || store.client || '';
      pdf.text(`Nom du signataire : ${signataire ? signataire : 'Non renseigné'}`, 20, y + 20);

      if (store.signatureClient && store.signatureClient.startsWith('data:image')) {
        pdf.addImage(store.signatureClient, 'PNG', 20, y + 25, 80, 25);
      } else {
        pdf.setTextColor(150, 150, 150);
        pdf.setFont("helvetica", "italic");
        pdf.text("Signature non renseignée / Document non signé numériquement sur place", 20, y + 42);
      }

      if (store.bonPourAccord) {
        pdf.setTextColor(30, 58, 138);
        pdf.setFontSize(15);
        pdf.setFont("helvetica", "bold");
        pdf.text("BON POUR ACCORD", 120, y + 42);
      }

      // ANNEXE PHOTOS
      if (validPhotos.length > 0) {
        let isFirstPhotoPage = true;
        let currentY = 0;
        
        const startNewPhotoPage = (isFirst: boolean) => {
          pdf.addPage();
          const title = isFirst ? "ANNEXE PHOTOS" : "ANNEXE PHOTOS (Suite)";
          return drawHeader(pdf, title) + 12; // Base Y after header
        };

        currentY = startNewPhotoPage(isFirstPhotoPage);
        isFirstPhotoPage = false;

        for (let i = 0; i < validPhotos.length; i++) {
          const p = validPhotos[i];
          const typeStr = `Type : ${p.type}`;
          const dateStr = p.timestamp ? `Date : ${new Date(p.timestamp).toLocaleString('fr-FR')}` : '';
          const titleStr = p.title || '';

          const maxImageH = 100;
          let imgW = 150;
          let imgH = imgW / p.ratio;
          
          if (imgH > maxImageH) {
            imgH = maxImageH;
            imgW = imgH * p.ratio;
          }

          pdf.setFontSize(10);
          pdf.setFont("helvetica", "normal");
          
          // Calculer la hauteur du texte pour le saut de page
          const maxTextW = 160; 
          let titleLines: string[] = [];
          if (titleStr) {
            titleLines = pdf.splitTextToSize(titleStr, maxTextW - 10);
          }
          
          const textContainerHeight = titleLines.length > 0 ? 15 + (titleLines.length * 5) : 10;
          const blockGap = 15;
          const blockTotalHeight = imgH + 4 + textContainerHeight + blockGap;

          if (currentY + blockTotalHeight > 282) {
            currentY = startNewPhotoPage(false);
          }

          const drawXImage = 14 + (182 - imgW) / 2;
          const drawXText = 14 + (182 - maxTextW) / 2;

          try {
            pdf.addImage(p.img, 'JPEG', drawXImage, currentY, imgW, imgH);
            pdf.setDrawColor(200, 200, 200);
            pdf.setLineWidth(0.3);
            pdf.rect(drawXImage, currentY, imgW, imgH);
          } catch(e) {}

          const textY = currentY + imgH + 4;
          pdf.setFillColor(250, 251, 255);
          pdf.setDrawColor(220, 225, 235);
          pdf.setLineWidth(0.3);
          pdf.roundedRect(drawXText, textY, maxTextW, textContainerHeight, 2, 2, 'FD');

          pdf.setFontSize(10);
          pdf.setTextColor(30, 58, 138);
          pdf.setFont("helvetica", "bold");
          pdf.text(typeStr, drawXText + 5, textY + 6);
          
          if (dateStr) {
            pdf.setFont("helvetica", "italic");
            pdf.setTextColor(120, 120, 120);
            pdf.text(dateStr, drawXText + maxTextW - 5, textY + 6, { align: 'right' });
          }

          if (titleLines.length > 0) {
            pdf.setFont("helvetica", "normal");
            pdf.setTextColor(60, 60, 60);
            pdf.text(titleLines, drawXText + 5, textY + 13);
          }

          currentY += imgH + 4 + textContainerHeight + blockGap;
        }
      }

      return pdf.output('blob');
    } catch (error) {
      console.error("CRITICAL PDF GENERATION ERROR:", error);
      throw error;
    }
  };

  const generateSpecificPdfBlob = async (type: string) => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const logoData = await loadLogoBase64();
      const mascotteData = await loadMascotteBase64();

      const drawHeader = (p: jsPDF, title: string) => {
        if (logoData) p.addImage(logoData.img, 'PNG', 14, 10, 40, 40 / logoData.ratio);
        p.setFontSize(10); p.setTextColor(100, 100, 100);
        p.text(`Dossier N° ${store.numeroAffaire || '-'}`, 196, 15, { align: 'right' });
        p.setFontSize(16); p.setFont("helvetica", "bold"); p.setTextColor(30, 58, 138);
        p.text(title.toUpperCase(), 14, 45);
        p.line(14, 48, 196, 48);
        return 58;
      };

      const addSection = (title: string, content: any) => {
        const y = (pdf as any).getY ? (pdf as any).getY() : 60;
        pdf.setFontSize(11); pdf.setFont("helvetica", "bold"); pdf.setTextColor(30, 58, 138);
        pdf.text(title.toUpperCase(), 14, y);
        pdf.setFont("helvetica", "normal"); pdf.setTextColor(60, 60, 60);
        const lines = pdf.splitTextToSize(String(content || 'Non renseigné'), 182);
        pdf.text(lines, 14, y + 7);
        const finalY = y + 7 + (lines.length * 6) + 10;
        if ((pdf as any).setY) (pdf as any).setY(finalY);
        return finalY;
      };

      const addStepSignature = (step: string, title: string) => {
        const sig = store.stepSignatures?.[step];
        if (!sig) return;
        const y = (pdf as any).getY ? (pdf as any).getY() : 240;
        pdf.setFontSize(9); pdf.setTextColor(150, 150, 150);
        pdf.text(`Validé par ${sig.technicienNom || 'Tech'} le ${new Date(sig.dateSignature).toLocaleDateString()}`, 14, y);
        if (sig.technicienSignature) pdf.addImage(sig.technicienSignature, 'PNG', 14, y + 2, 30, 10);
      };

      if (mascotteData) {
        pdf.saveGraphicsState();
        // @ts-ignore
        pdf.setGState(new (pdf as any).GState({ opacity: 0.05 }));
        pdf.addImage(mascotteData.img, 'PNG', 40, 80, 130, 130 / mascotteData.ratio);
        pdf.restoreGraphicsState();
      }

      const addSectionAt = (title: string, content: any, x: number, y: number, half: boolean) => {
        pdf.setFontSize(11); pdf.setFont("helvetica", "bold"); pdf.setTextColor(30, 58, 138);
        pdf.text(title.toUpperCase(), x, y);
        pdf.setFont("helvetica", "normal"); pdf.setTextColor(60, 60, 60);
        const lines = pdf.splitTextToSize(String(content || 'Non renseigné'), half ? 85 : 182);
        pdf.text(lines, x, y + 7);
        return y + 7 + (lines.length * 6) + 10;
      };

      if (type === 'devis') {
        drawDevisSection(pdf, store, drawHeader, addSection, addStepSignature);
      } else if (type === 'rapport') {
        drawRapportSection(pdf, store, drawHeader, addSection, addSectionAt, addStepSignature);
      } else if (type === 'infos') {
        drawInformationsSection(pdf, store, drawHeader, addSection, addSectionAt, addStepSignature);
      } else if (type === 'visite') {
        drawVisiteSection(pdf, store, drawHeader, addSection, addSectionAt, addStepSignature);
      } else if (type === 'intervention') {
        drawInterventionSection(pdf, store, drawHeader, addSection, addStepSignature);
      }

      return pdf.output('blob');
    } catch (e) {
      console.error("Error specific PDF", e);
      throw e;
    }
  };

  // Specific PDF trigger logic moved to PdfService.tsx

  const handleDownload = async () => {
    (window as any).triggerGlobalPDF?.();
  };

  const handleWhatsApp = async () => {
    try {
      if (!store.telephone || store.telephone.trim() === '') {
        alert("⚠️ Option impossible : Numéro de téléphone client manquant. Veuillez revenir à l'étape 'Infos' pour le renseigner.");
        return;
      }
      
      setIsGenerating(true);
      const blob = await generatePdfBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SNIMOP_Dossier_${store.numeroAffaire || 'SansRef'}.pdf`;
      link.click();
      
      const cleanPhone = store.telephone.replace(/\s+/g, '').replace(/^0/, '33');
      const message = `Bonjour,\n\nVoici votre dossier d'intervention SNIMOP :\n\n📁 Dossier : ${store.numeroAffaire || 'Non renseigné'}\n📅 Date : ${getSafeDateFormatted(store.date)}\n👤 Client : ${store.client || 'Non renseigné'}\n🏭 Chantier : ${store.site || 'Non renseigné'}\n\n📄 Contenu :\n- Visite avant devis\n- Devis\n- Bon d'intervention\n- Rapport\n\n👉 Le fichier PDF vient d'être généré, le technicien va vous le joindre à la discussion.\n\nCordialement,\nL'équipe SNIMOP`;
      const encodedMsg = encodeURIComponent(message);
      
      setTimeout(() => {
        window.open(`https://wa.me/${cleanPhone}?text=${encodedMsg}`, '_blank');
      }, 500);

    } catch (e: any) {
      alert("Erreur critique lors du processus WhatsApp.\n" + (e.message || String(e)));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEmail = async () => {
    try {
      setIsGenerating(true);
      const blob = await generatePdfBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SNIMOP_Dossier_${store.numeroAffaire || 'SansRef'}.pdf`;
      link.click();
      
      const subject = encodeURIComponent(`Dossier intervention SNIMOP - ${store.numeroAffaire || 'SansRef'}`);
      const body = encodeURIComponent(`Bonjour,\n\nVeuillez trouver ci-joint votre dossier d'intervention SNIMOP.\n\nCordialement,\nL'équipe SNIMOP`);
      const targetMail = store.email || '';
      
      setTimeout(() => {
        window.location.href = `mailto:${targetMail}?subject=${subject}&body=${body}`;
      }, 800);

    } catch (e: any) {
      alert("Erreur lors de la génération de l'email.\n" + (e.message || String(e)));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    try {
      setIsGenerating(true);
      const blob = await generatePdfBlob();
      const file = new File([blob], `SNIMOP_Dossier_${store.numeroAffaire || 'SansRef'}.pdf`, { type: 'application/pdf' });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `SNIMOP - Dossier d'Intervention`,
          text: `Voici le dossier complet SNIMOP (Dossier ${store.numeroAffaire}).`
        });
      } else {
        alert("Le partage natif mobile n'est pas supporté sur cet appareil. Le fichier va être téléchargé.");
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `SNIMOP_Dossier_${store.numeroAffaire || 'SansRef'}.pdf`;
        link.click();
      }
    } catch (e: any) {
      alert("Erreur critique lors de l'export de partage.\n" + (e.message || String(e)));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 py-2 pb-10">
      <h2 className="text-3xl md:text-4xl font-black border-b border-white/10 pb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-slate-200 tracking-widest uppercase drop-shadow-lg">
        Export du final
      </h2>
      <div className="bg-[#0f172a]/70 backdrop-blur-2xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-slate-700/50 flex flex-col gap-8 mt-2 relative z-30">

        {/* Pre-export summary */}
        <div className="bg-slate-800/80 border border-slate-600 rounded-2xl p-5 text-sm text-slate-200 shadow-md">
          <h4 className="font-bold text-white mb-3 pb-3 border-b border-slate-600/50 text-base uppercase tracking-wider">Résumé avant export</h4>
          <ul className="flex flex-col gap-3">
            <li className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 drop-shadow-sm" />
              <span className="text-[15px]">Document principal : <strong className="text-white ml-1">{store.typeDoc}</strong></span>
            </li>
            <li className="flex items-center gap-3">
              {store.signatureClient && store.signatureClient.startsWith('data:image') ? (
                <CheckCircle className="w-5 h-5 text-emerald-400 drop-shadow-sm" />
              ) : (
                <div className="w-5 h-5 rounded-full border border-amber-400 bg-amber-400/20" />
              )}
              <span className="text-[15px]">Signature client : <strong className={store.signatureClient ? "text-emerald-400 ml-1" : "text-amber-400 ml-1"}>{store.signatureClient ? "Présente" : "Manquante (Optionnelle)"}</strong></span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle className={store.photos && store.photos.length > 0 ? "w-5 h-5 text-emerald-400 drop-shadow-sm" : "w-5 h-5 text-slate-500"} />
              <span className="text-[15px]">Photos jointes : <strong className="text-white ml-1">{store.photos ? store.photos.length : 0} image(s)</strong></span>
            </li>
          </ul>
        </div>

        <div className="border border-slate-300 rounded-3xl p-6 bg-slate-50 shadow-inner flex flex-col gap-5 relative overflow-hidden">
          <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-blue-500 to-green-500 left-0" />
          <h3 className="font-black flex items-center gap-2 text-xl text-slate-800 uppercase tracking-wide">
            <CheckCircle className="w-6 h-6 text-green-500" />
            Validation Fine
          </h3>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <Input 
              label="Nom du signataire" 
              className="!bg-transparent child-input-light border-0 px-2 text-slate-800"
              value={store.nomSignataireClient || store.contact || store.client} 
              onChange={(e: any) => store.setField('nomSignataireClient', e.target.value)} 
            />
          </div>
          <SignaturePad 
            initialDataUrl={store.signatureClient} 
            onSave={(url) => store.setField('signatureClient', url)} 
          />
        </div>

        <div className="flex flex-col gap-4 mt-2">
          <Button onClick={handleDownload} isLoading={isGenerating} className="py-5 text-xl tracking-wide shadow-blue-900/40 border-blue-400/50">
            <Download className="w-6 h-6 mr-2" />
            Télécharger le Dossier PDF
          </Button>

          <Button onClick={handleWhatsApp} isLoading={isGenerating} variant="secondary" className="py-4 text-lg border-green-500/30 text-green-400 hover:bg-green-500/10 shadow-lg shadow-green-900/20">
            <MessageCircle className="w-5 h-5 mr-2" />
            Envoyer via WhatsApp
          </Button>

          <Button onClick={handleEmail} isLoading={isGenerating} variant="secondary" className="py-4 text-lg border-blue-400/30 text-blue-300 hover:bg-blue-800/20 shadow-lg shadow-blue-900/20">
            <Mail className="w-5 h-5 mr-2" />
            Envoyer via E-mail
          </Button>
          
          <Button onClick={handleShare} isLoading={isGenerating} variant="outline" className="py-4 text-sm mt-3 opacity-70 hover:opacity-100 border-white/5 bg-transparent hover:bg-white/5 transition-all">
            <Share2 className="w-4 h-4 mr-2" />
            Autres partages
          </Button>
        </div>
      </div>

      <div className="flex justify-start mt-4">
        <Button variant="outline" onClick={() => store.setField('currentStep', 5)} className="px-6 py-3 border-white/10 text-slate-300">
          <ArrowLeft className="w-5 h-5 mr-1" /> Retour
        </Button>
      </div>

    </div>
  );
}
