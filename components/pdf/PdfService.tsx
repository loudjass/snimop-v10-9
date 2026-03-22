"use client";
import React, { useState, useEffect } from 'react';
import { useDossierStore } from '@/store/useDossierStore';
import jsPDF from 'jspdf';
import { format, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';

import { SNIMOP_LOGO_PATH } from '@/components/ui/SnimopLogo';

// --- HELPERS FROM ORIGINAL ENGINE (High Quality) ---

const loadLogoBase64 = async (): Promise<{img: HTMLImageElement, ratio: number} | null> => {
  try {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ img, ratio: img.width / img.height });
      img.onerror = () => {
         console.error("ERREUR CRITIQUE: Impossible de lire les dimensions du logo.");
         resolve(null);
      };
      img.src = SNIMOP_LOGO_PATH;
    });
  } catch (e) {
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

// Calculation Helper (to keep TVA modifiable logic)
const calculateTotals = (store: any) => {
  const moEstimee = store.moEstimee || store.heuresMO || 0;
  const moHeures = typeof moEstimee === 'number' ? moEstimee : parseFloat(moEstimee) || 0;
  
  const totalMoHT = (store.tauxHoraireMO || 66) * moHeures;
  const totalNacelleHT = store.nacelleActive ? (store.coutNacelleHT || 0) : 0;
  const coutBaseHT = (store.coutMaterielHT || 0) + totalMoHT + (store.coutDeplacementHT || 0) + totalNacelleHT + (store.autresFraisHT || 0);
  
  const margeEuros = coutBaseHT * ((store.margePourcentage || 30) / 100);
  const prixConseilleHT = coutBaseHT + margeEuros;
  
  const isEcrasementTotal = store.prixFinalManuel !== null && store.prixFinalManuel !== undefined && String(store.prixFinalManuel) !== '';
  const prixRetenuHT = isEcrasementTotal ? Number(store.prixFinalManuel) : prixConseilleHT + (store.ajustementManuel || 0);
  
  const tva = prixRetenuHT * ((store.tvaPourcentage || 20) / 100);
  const totalTTC = prixRetenuHT + tva;
  const acompteCalcule = store.acompteDemande ? totalTTC * ((store.acomptePourcentage || 30) / 100) : 0;

  return {
    prixRetenuHT,
    tva,
    totalTTC,
    acompteCalcule,
    totalMoHT,
    isEcrasementTotal
  };
};

export const PdfService = () => {
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

  const generateFullPdf = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const logoData = await loadLogoBase64();
    const mascotteData = await loadMascotteBase64();
    
    const photoPromises = (store.photos || []).map(p => loadPhotoBase64(p.imageBase64, p.type, p.title, p.timestamp));
    const loadedPhotosResult = await Promise.all(photoPromises);
    const validPhotos = loadedPhotosResult.filter(p => p !== null) as any[];

    // --- SHARED DRAWERS (ORIGINAL HIGH QUALITY) ---
    const drawHeader = (p: jsPDF, title: string) => {
      p.setFillColor(255, 255, 255);
      p.rect(0, 0, 210, 40, 'F');

      let lastLogoEndX = 14;
      if (logoData && logoData.img) {
        let targetWidth = 53;
        let targetHeight = targetWidth / logoData.ratio;
        if (targetHeight > 25) { targetHeight = 25; targetWidth = targetHeight * logoData.ratio; }
        p.addImage(logoData.img, 'PNG', 14, 10, targetWidth, targetHeight);
        lastLogoEndX = 14 + targetWidth;
      }

      if (mascotteData && mascotteData.img) {
        try {
          const mHeight = 18; const mWidth = mHeight * mascotteData.ratio;
          p.saveGraphicsState();
          p.setGState(new (p as any).GState({ opacity: 0.85 }));
          p.addImage(mascotteData.img, 'PNG', lastLogoEndX + 8, 12, mWidth, mHeight);
          p.restoreGraphicsState();
        } catch(e) {}
      }

      p.setTextColor(100, 100, 100); p.setFontSize(10); p.setFont("helvetica", "bold");
      p.text(`Dossier N° ${store.numeroAffaire || '-'}`, 196, 16, { align: 'right' });
      p.setFontSize(9); p.setFont("helvetica", "normal");
      p.text(`Le ${getSafeDateShort(store.date)}`, 196, 22, { align: 'right' });

      p.setTextColor(30, 58, 138); p.setFontSize(16); p.setFont("helvetica", "bold");
      p.text(title.toUpperCase(), 14, 44);
      p.setDrawColor(200, 200, 200); p.setLineWidth(0.3);
      p.line(14, 48, 196, 48);
      return 58;
    };

    const addSection = (p: jsPDF, title: string, content?: string | number, halfWidth: boolean = false, xPos: number = 14, currentY: number = 58) => {
      let text = String(content || '').trim();
      if (!text || text === "undefined" || text === "null") text = "Non renseigné";

      if (currentY > 270) {
        p.addPage();
        currentY = drawHeader(p, "Suite...");
      }

      p.setFontSize(11); p.setFont("helvetica", "bold"); p.setTextColor(30, 58, 138);
      p.text(title.toUpperCase(), xPos, currentY);

      const nextY = currentY + 7;
      p.setFontSize(11); p.setFont("helvetica", "normal"); p.setTextColor(50, 50, 50);
      const objWidth = halfWidth ? 85 : 182;
      const lines = p.splitTextToSize(text, objWidth);
      p.text(lines, xPos, nextY);

      return nextY + (lines.length * 6) + 16;
    };

    const addSectionAt = (p: jsPDF, title: string, content: string | number | undefined, xPos: number, startY: number, halfWidth: boolean = false) => {
      let text = String(content || '').trim();
      if (!text || text === "undefined") text = "Non renseigné";
      
      let localY = startY;
      p.setFontSize(11); p.setFont("helvetica", "bold"); p.setTextColor(30, 58, 138); 
      p.text(title.toUpperCase(), xPos, localY);
      localY += 7;
      p.setFontSize(11); p.setFont("helvetica", "normal"); p.setTextColor(50, 50, 50);
      const objWidth = halfWidth ? 85 : 182;
      const lines = p.splitTextToSize(text, objWidth);
      p.text(lines, xPos, localY);
      return localY + (lines.length * 6) + 16;
    };

    const addStepSignature = (p: jsPDF, stepKey: string, stepTitle: string, currentY: number) => {
      const sig = store.stepSignatures?.[stepKey];
      if (!sig) return currentY;

      if (currentY + 55 > 280) { 
        p.addPage(); 
        currentY = drawHeader(p, stepTitle + " (Validation)"); 
      }

      currentY += 5;
      p.setDrawColor(200, 200, 200); p.setLineWidth(0.5); p.line(14, currentY, 196, currentY);
      currentY += 8;
      p.setFontSize(10); p.setFont("helvetica", "bold"); p.setTextColor(30, 58, 138);
      p.text("--- VALIDATION DE L'ÉTAPE ---", 105, currentY, { align: 'center' });
      currentY += 8;
      p.setFontSize(9); p.setTextColor(80, 80, 80);
      p.text(`Technicien : ${sig.technicienNom || '-'}`, 14, currentY);
      if (sig.technicienSignature && sig.technicienSignature.startsWith('data:image')) {
        p.addImage(sig.technicienSignature, 'PNG', 14, currentY + 2, 35, 12);
      }
      p.text(`Client : ${sig.clientNom || '-'}`, 110, currentY);
      if (sig.clientSignature && sig.clientSignature.startsWith('data:image')) {
        p.addImage(sig.clientSignature, 'PNG', 110, currentY + 2, 35, 12);
      }
      currentY += 25;
      if (sig.dateSignature) {
        p.setFont("helvetica", "italic"); p.setFontSize(8);
        p.text(`Signé le ${new Date(sig.dateSignature).toLocaleString('fr-FR')}`, 105, currentY, { align: 'center' });
      }
      return currentY + 10;
    };

    // --- PAGE 1: COVER ---
    pdf.setFillColor(255, 255, 255); pdf.rect(0, 0, 210, 297, 'F');
    let coverY = 25;
    if (logoData && logoData.img) {
      const targetWidth = 125; const targetHeight = targetWidth / logoData.ratio; 
      pdf.addImage(logoData.img, 'PNG', (210 - targetWidth) / 2, coverY, targetWidth, targetHeight);
      coverY += targetHeight + 15;
    }
    pdf.setTextColor(30, 58, 138); pdf.setFontSize(30); pdf.setFont("helvetica", "bold");
    pdf.text("DOSSIER D'INTERVENTION", 105, coverY, { align: 'center' });
    coverY += 8; pdf.setDrawColor(30, 58, 138); pdf.setLineWidth(1.5); pdf.line(60, coverY, 150, coverY);
    coverY += 15; pdf.setTextColor(100, 100, 100); pdf.setFontSize(16);
    pdf.text(`Dossier N° ${store.numeroAffaire || 'Non renseigné'}`, 105, coverY, { align: 'center' });
    coverY += 10; pdf.setFont("helvetica", "normal");
    pdf.text(`Édité le ${getSafeDateFormatted(store.date)}`, 105, coverY, { align: 'center' });

    coverY += 25;
    const drawBlock = (title: string, content: string, y: number) => {
      pdf.setFillColor(250, 251, 255); pdf.setDrawColor(30, 58, 138); pdf.setLineWidth(0.3);
      pdf.roundedRect(25, y, 160, 40, 3, 3, 'FD'); 
      pdf.setTextColor(30, 58, 138); pdf.setFontSize(14); pdf.setFont("helvetica", "bold");
      pdf.text(title, 35, y + 10);
      pdf.setTextColor(40, 40, 40); pdf.setFont("helvetica", "normal"); pdf.setFontSize(12);
      pdf.text(pdf.splitTextToSize(content, 140), 40, y + 18);
    };

    drawBlock("CLIENT", `Nom : ${store.client || '-'}\nContact : ${store.contact || '-'}\nTél : ${store.telephone || '-'}\nEmail : ${store.email || '-'}`, coverY);
    drawBlock("CHANTIER", `Site : ${store.site || '-'}\nAdresse : ${store.adresse || '-'}\nTechnicien : ${store.technicien || '-'}`, coverY + 50);

    // WATERMARK PAGE 1
    if (mascotteData && mascotteData.img) {
      try {
        const markWidth = 140; const markHeight = markWidth / mascotteData.ratio;
        pdf.saveGraphicsState(); pdf.setGState(new (pdf as any).GState({ opacity: 0.06 }));
        pdf.addImage(mascotteData.img, 'PNG', (210 - markWidth) / 2, 297 - markHeight - 20, markWidth, markHeight);
        pdf.restoreGraphicsState();
      } catch(e) {}
    }

    // --- PAGE 2: INFOS ---
    pdf.addPage();
    let y = drawHeader(pdf, "INFORMATIONS GÉNÉRALES");
    let yL = addSectionAt(pdf, "Client", `Nom : ${store.client || '-'}\nContact : ${store.contact || '-'}\nTél : ${store.telephone || '-'}\nEmail : ${store.email || '-'}`, 14, y, true);
    let yR = addSectionAt(pdf, "Chantier", `Site : ${store.site || '-'}\nAdresse : ${store.adresse || '-'}\nTechnicien : ${store.technicien || '-'}`, 110, y, true);
    y = Math.max(yL, yR) + 5;
    pdf.setDrawColor(230, 230, 230); pdf.line(14, y - 5, 196, y - 5);
    y = addSection(pdf, "Objet de l'intervention", store.objet, false, 14, y);
    y = addStepSignature(pdf, 'informations', "INFORMATIONS GÉNÉRALES", y);

    // --- PAGE 3: VISITE ---
    pdf.addPage();
    y = drawHeader(pdf, "VISITE AVANT DEVIS");
    y = addSection(pdf, "Contexte et Constat", store.constat || store.contexte, false, 14, y);
    y = addSection(pdf, "Équipement concerné", store.equipement, false, 14, y);
    y = addSection(pdf, "Observations", store.observations, false, 14, y);
    y = addSection(pdf, "Travaux à réaliser", store.travauxPreconises, false, 14, y);
    y = addSection(pdf, "Matériel nécessaire", store.materielEnvisage, false, 14, y);
    let yVTop = y;
    let yVL = addSectionAt(pdf, "Main d'œuvre estimée", store.moEstimee, 14, yVTop, true);
    let yVR = addSectionAt(pdf, "Déplacement", store.deplacement, 110, yVTop, true);
    y = Math.max(yVL, yVR);
    y = addSection(pdf, "Option nacelle", store.optionNacelle, false, 14, y);
    y = addSection(pdf, "Remarques", store.remarques, false, 14, y);
    y = addStepSignature(pdf, 'visite', "VISITE AVANT DEVIS", y);

    // --- PAGE 4: DEVIS ---
    pdf.addPage();
    const prestationTitle = store.prestationType ? store.prestationType.replace('_', ' + ').toUpperCase() : 'DEVIS';
    y = drawHeader(pdf, `DEVIS SNIMOP - ${prestationTitle}`);
    y = addSection(pdf, "Descriptif technique des prestations", store.descriptifTravaux, false, 14, y);
    y = addSection(pdf, "Détail du matériel prévu", store.devisMateriel, false, 14, y);
    y = addSection(pdf, "Réserves et Exclusions", store.reserves, false, 14, y);

    // Calculations
    const totals = calculateTotals(store);
    if (y > 215) { pdf.addPage(); y = drawHeader(pdf, `DEVIS (Suite)`); } else { y += 5; }

    pdf.setFillColor(250, 252, 255); pdf.setDrawColor(30, 58, 138); pdf.setLineWidth(0.4);
    pdf.roundedRect(14, y, 182, 60, 3, 3, 'FD'); 
    pdf.setFontSize(12); pdf.setFont("helvetica", "bold"); pdf.setTextColor(30, 58, 138);
    pdf.text("RÉCAPITULATIF FINANCIER", 20, y + 8);
    let fY = y + 16;
    pdf.setFontSize(10); pdf.setTextColor(60, 60, 60);

    const isClientMode = store.devisModeClient;
    if (totals.isEcrasementTotal || isClientMode) {
      pdf.setFont("helvetica", "bold"); pdf.text("Description de la prestation :", 20, fY);
      pdf.setFont("helvetica", "normal");
      const lines = pdf.splitTextToSize(store.descriptifTravaux || prestationTitle, 70);
      pdf.text(lines, 20, fY + 6);
    } else {
      pdf.text(`Fournitures matériel : ${store.coutMaterielHT?.toFixed(2) || '0.00'} €`, 20, fY);
      pdf.text(`Main d'œuvre : ${totals.totalMoHT.toFixed(2)} €`, 20, fY + 6);
      pdf.text(`Déplacement et logistique : ${store.coutDeplacementHT?.toFixed(2) || '0.00'} €`, 20, fY + 12);
      let nextY = fY + 18;
      if (store.nacelleActive) { pdf.text(`Option Nacelle : ${store.coutNacelleHT?.toFixed(2) || '0.00'} €`, 20, nextY); nextY += 6; }
      if (store.ajustementManuel) { pdf.setFont("helvetica", "bolditalic"); pdf.text(`Ajustement commercial : ${Number(store.ajustementManuel).toFixed(2)} €`, 20, nextY); }
    }

    pdf.setFont("helvetica", "bold"); pdf.setFontSize(12); pdf.setTextColor(0, 0, 0);
    pdf.text(`TOTAL HT :`, 105, fY + 6); pdf.text(`${totals.prixRetenuHT.toFixed(2)} €`, 185, fY + 6, { align: 'right' });
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(11);
    pdf.text(`TVA (${store.tvaPourcentage || 20}%) :`, 105, fY + 14); pdf.text(`${totals.tva.toFixed(2)} €`, 185, fY + 14, { align: 'right' });
    pdf.setFillColor(30, 58, 138); pdf.roundedRect(100, fY + 20, 90, 16, 2, 2, 'F');
    pdf.setTextColor(255, 255, 255); pdf.setFont("helvetica", "bold"); pdf.setFontSize(16);
    pdf.text(`TOTAL TTC :`, 105, fY + 31); pdf.text(`${totals.totalTTC.toFixed(2)} €`, 185, fY + 31, { align: 'right' });

    y += 80;
    if (store.acompteDemande) {
      pdf.setTextColor(30, 58, 138); pdf.setFontSize(12); pdf.setFont("helvetica", "bold");
      pdf.text(`Acompte demandé : ${totals.acompteCalcule.toFixed(2)} € (${store.acomptePourcentage || 0}%)`, 185, y, { align: 'right' });
      y += 10;
    }

    if (y > 230) { pdf.addPage(); y = drawHeader(pdf, `DEVIS - CONDITIONS`); } else { y += 2; }
    pdf.setFillColor(245, 247, 250); pdf.setDrawColor(200, 200, 200); pdf.roundedRect(14, y, 182, 25, 2, 2, 'FD');
    pdf.setFontSize(11); pdf.setTextColor(30, 58, 138); pdf.setFont("helvetica", "bold");
    pdf.text("CONDITIONS", 20, y + 8);
    pdf.setFontSize(9); pdf.setTextColor(80, 80, 80);
    pdf.text(`Conditions de règlement : ${store.conditionsReglement || 'À réception'}`, 20, y + 16);
    pdf.text(`Délai de réalisation : ${store.delai || 'À convenir'}`, 20, y + 22);

    y += 35;
    if (store.bonPourAccord) {
       pdf.setFontSize(14); pdf.setFont("helvetica", "bold"); pdf.setTextColor(0, 0, 0); pdf.text("Bon pour accord", 14, y); y += 8;
       pdf.setFontSize(10); pdf.setFont("helvetica", "normal");
       pdf.text("Fait à : ............................... Nom : ................................", 14, y);
       pdf.text("Le : .................................. Signature du client :", 14, y + 8);
       pdf.rect(120, y + 5, 70, 20, 'S'); y += 30;
    }

    y = addStepSignature(pdf, 'devis', "VALIDATION DEVIS", y);

    // --- PAGE 5: BON INTERVENTION ---
    pdf.addPage();
    y = drawHeader(pdf, "BON D'INTERVENTION");
    y = addSection(pdf, "Date prévue", store.dateIntervention, false, 14, y);
    y = addSection(pdf, "Nature des travaux", store.natureTravaux, false, 14, y);
    y = addSection(pdf, "Matériel prévu", store.materielPrevu, false, 14, y);
    y = addSection(pdf, "Consignes", store.consignes, false, 14, y);
    y = addStepSignature(pdf, 'intervention', "BON D'INTERVENTION", y);

    // --- PAGE 6: RAPPORT ---
    pdf.addPage();
    y = drawHeader(pdf, "RAPPORT D'INTERVENTION");
    y = addSection(pdf, "Nature réelle", store.natureReelle, false, 14, y);
    y = addSection(pdf, "Travaux réalisés", store.travauxRealises, false, 14, y);
    y = addSection(pdf, "Matériel utilisé", store.materielUtilise, false, 14, y);
    yVTop = y;
    yVL = addSectionAt(pdf, "Temps passé", store.tempsPasse, 14, yVTop, true);
    yVR = addSectionAt(pdf, "Anomalies", store.anomalies, 110, yVTop, true);
    y = Math.max(yVL, yVR);
    y = addSection(pdf, "Réserves", store.rapportReserves, false, 14, y);
    y = addSection(pdf, "Observations finales", store.observationsFinales, false, 14, y);
    y = addStepSignature(pdf, 'rapport', "RAPPORT D'INTERVENTION", y);

    // --- PAGE 7: SIGNATURE FINALE ---
    pdf.addPage();
    y = drawHeader(pdf, "VALIDATION FINALE");
    y += 10;
    pdf.setDrawColor(30, 58, 138); pdf.setLineWidth(1); pdf.roundedRect(14, y, 182, 60, 3, 3, 'S'); 
    pdf.setFontSize(13); pdf.setFont("helvetica", "bold"); pdf.setTextColor(30, 58, 138);
    pdf.text("SIGNATURE DU CLIENT", 20, y + 12);
    pdf.setFont("helvetica", "normal"); pdf.setTextColor(60, 60, 60); pdf.setFontSize(11);
    pdf.text(`Nom du signataire : ${store.nomSignataireClient || store.client || '-'}`, 20, y + 20);
    if (store.signatureClient && store.signatureClient.startsWith('data:image')) {
      pdf.addImage(store.signatureClient, 'PNG', 20, y + 25, 80, 25);
    }
    if (store.bonPourAccord) { pdf.setFontSize(15); pdf.setFont("helvetica", "bold"); pdf.text("BON POUR ACCORD", 120, y + 42); }

    // --- PHOTO ANNEX ---
    if (validPhotos.length > 0) {
      const startPhotoPage = (isFirst: boolean) => {
        pdf.addPage();
        return drawHeader(pdf, isFirst ? "ANNEXE PHOTOS" : "ANNEXE PHOTOS (Suite)") + 12;
      };
      let py = startPhotoPage(true);
      for (const p of validPhotos) {
        if (py + 130 > 280) py = startPhotoPage(false);
        const imgH = 100; const imgW = imgH * p.ratio;
        pdf.addImage(p.img, 'JPEG', 14 + (182 - imgW)/2, py, imgW, imgH);
        py += imgH + 5;
        pdf.setFontSize(9); pdf.text(`Type: ${p.type} - ${p.title || ''}`, 20, py);
        py += 15;
      }
    }

    return pdf.output('blob');
  };

  const generateSpecificPdf = async (type: string) => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const logoData = await loadLogoBase64();
    const mascotteData = await loadMascotteBase64();

    // Re-use EXACT helpers
    const drawHeader = (p: jsPDF, title: string) => {
        p.setFillColor(255, 255, 255); p.rect(0, 0, 210, 40, 'F');
        let lastLogoEndX = 14;
        if (logoData && logoData.img) {
          let targetWidth = 53; let targetHeight = targetWidth / logoData.ratio;
          if (targetHeight > 25) { targetHeight = 25; targetWidth = targetHeight * logoData.ratio; }
          p.addImage(logoData.img, 'PNG', 14, 10, targetWidth, targetHeight);
          lastLogoEndX = 14 + targetWidth;
        }
        if (mascotteData && mascotteData.img) {
          try {
            const mHeight = 18; const mWidth = mHeight * mascotteData.ratio;
            p.saveGraphicsState(); p.setGState(new (p as any).GState({ opacity: 0.85 }));
            p.addImage(mascotteData.img, 'PNG', lastLogoEndX + 8, 12, mWidth, mHeight);
            p.restoreGraphicsState();
          } catch(e) {}
        }
        p.setTextColor(100, 100, 100); p.setFontSize(10); p.setFont("helvetica", "bold");
        p.text(`Dossier N° ${store.numeroAffaire || '-'}`, 196, 16, { align: 'right' });
        p.setFontSize(16); p.setFont("helvetica", "bold"); p.setTextColor(30, 58, 138);
        p.text(title.toUpperCase(), 14, 44);
        p.line(14, 48, 196, 48);
        return 58;
    };

    const addSection = (p: jsPDF, title: string, content?: string | number, halfWidth: boolean = false, xPos: number = 14, currentY: number = 58) => {
        let text = String(content || '').trim();
        if (!text) text = "Non renseigné";
        p.setFontSize(11); p.setFont("helvetica", "bold"); p.setTextColor(30, 58, 138);
        p.text(title.toUpperCase(), xPos, currentY);
        p.setFontSize(11); p.setFont("helvetica", "normal"); p.setTextColor(50, 50, 50);
        const objWidth = halfWidth ? 85 : 182;
        const lines = p.splitTextToSize(text, objWidth);
        p.text(lines, xPos, currentY + 7);
        return currentY + 7 + (lines.length * 6) + 16;
    };

    const addSectionAt = (p: jsPDF, title: string, content: string | number | undefined, xPos: number, startY: number, halfWidth: boolean = false) => {
        let text = String(content || '').trim();
        if (!text) text = "Non renseigné";
        p.setFontSize(11); p.setFont("helvetica", "bold"); p.setTextColor(30, 58, 138); 
        p.text(title.toUpperCase(), xPos, startY);
        p.setFontSize(11); p.setFont("helvetica", "normal"); p.setTextColor(50, 50, 50);
        const objWidth = halfWidth ? 85 : 182;
        const lines = p.splitTextToSize(text, objWidth);
        p.text(lines, xPos, startY + 7);
        return startY + 7 + (lines.length * 6) + 16;
    };

    const addStepSignature = (p: jsPDF, stepKey: string, stepTitle: string, currentY: number) => {
        const sig = store.stepSignatures?.[stepKey];
        if (!sig) return currentY;
        currentY += 5;
        p.setDrawColor(200, 200, 200); p.line(14, currentY, 196, currentY);
        currentY += 8;
        p.text(`Technicien : ${sig.technicienNom || '-'}`, 14, currentY);
        if (sig.technicienSignature) p.addImage(sig.technicienSignature, 'PNG', 14, currentY + 2, 35, 12);
        p.text(`Client : ${sig.clientNom || '-'}`, 110, currentY);
        if (sig.clientSignature) p.addImage(sig.clientSignature, 'PNG', 110, currentY + 2, 35, 12);
        return currentY + 35;
    };

    if (type === 'infos') {
      let y = drawHeader(pdf, "INFORMATIONS GÉNÉRALES");
      let yL = addSectionAt(pdf, "Client", `Nom : ${store.client || '-'}\nContact : ${store.contact || '-'}\nTél : ${store.telephone || '-'}\nEmail : ${store.email || '-'}`, 14, y, true);
      let yR = addSectionAt(pdf, "Chantier", `Site : ${store.site || '-'}\nAdresse : ${store.adresse || '-'}\nTechnicien : ${store.technicien || '-'}`, 110, y, true);
      y = Math.max(yL, yR) + 5;
      y = addSection(pdf, "Objet", store.objet, false, 14, y);
      addStepSignature(pdf, 'informations', 'INFOS', y);
    } else if (type === 'visite') {
      let y = drawHeader(pdf, "VISITE AVANT DEVIS");
      y = addSection(pdf, "Contexte", store.constat || store.contexte, false, 14, y);
      y = addSection(pdf, "Équipement concerné", store.equipement, false, 14, y);
      y = addSection(pdf, "Observations", store.observations, false, 14, y);
      y = addSection(pdf, "Travaux à réaliser", store.travauxPreconises, false, 14, y);
      y = addSection(pdf, "Matériel nécessaire", store.materielEnvisage, false, 14, y);
      addStepSignature(pdf, 'visite', 'VISITE', y);
    } else if (type === 'devis') {
      const pTitle = store.prestationType ? store.prestationType.replace('_', ' + ').toUpperCase() : 'DEVIS';
      let y = drawHeader(pdf, pTitle);
      y = addSection(pdf, "Descriptif technique des prestations", store.descriptifTravaux, false, 14, y);
      y = addSection(pdf, "Détail du matériel prévu", store.devisMateriel, false, 14, y);
      y = addSection(pdf, "Réserves et Exclusions", store.reserves, false, 14, y);
      const totals = calculateTotals(store);
      y += 10; pdf.setFillColor(250, 252, 255); pdf.setDrawColor(30, 58, 138); pdf.setLineWidth(0.4);
      pdf.roundedRect(14, y, 182, 50, 3, 3, 'FD'); 
      pdf.setFontSize(12); pdf.setFont("helvetica", "bold"); pdf.setTextColor(30, 58, 138);
      pdf.text("RÉCAPITULATIF FINANCIER", 20, y + 8);
      pdf.setFontSize(11); pdf.setTextColor(0, 0, 0);
      pdf.text(`TOTAL HT : ${totals.prixRetenuHT.toFixed(2)} €`, 20, y + 20);
      pdf.text(`TVA (${store.tvaPourcentage || 20}%) : ${totals.tva.toFixed(2)} €`, 20, y + 28);
      pdf.setFillColor(30, 58, 138); pdf.roundedRect(100, y + 15, 90, 16, 2, 2, 'F');
      pdf.setTextColor(255, 255, 255); pdf.text(`TOTAL TTC : ${totals.totalTTC.toFixed(2)} €`, 105, y + 26);
      y += 60; y = addStepSignature(pdf, 'devis', 'DEVIS', y);
    } else if (type === 'intervention') {
      let y = drawHeader(pdf, "BON D'INTERVENTION");
      y = addSection(pdf, "Date prévue", store.dateIntervention, false, 14, y);
      y = addSection(pdf, "Nature des travaux", store.natureTravaux, false, 14, y);
      y = addSection(pdf, "Matériel", store.materielPrevu, false, 14, y);
      y = addSection(pdf, "Consignes", store.consignes, false, 14, y);
      addStepSignature(pdf, 'intervention', 'INTERVENTION', y);
    } else if (type === 'rapport') {
      let y = drawHeader(pdf, "RAPPORT D'INTERVENTION");
      y = addSection(pdf, "Nature réelle", store.natureReelle, false, 14, y);
      y = addSection(pdf, "Travaux réalisés", store.travauxRealises, false, 14, y);
      y = addSection(pdf, "Matériel utilisé", store.materielUtilise, false, 14, y);
      y = addSection(pdf, "Observations", store.observationsFinales, false, 14, y);
      addStepSignature(pdf, 'rapport', 'RAPPORT', y);
    }

    return pdf.output('blob');
  };

  useEffect(() => {
    (window as any).triggerSpecificPDF = async (type: string) => {
      try {
        setIsGenerating(true);
        const blob = await generateSpecificPdf(type);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `SNIMOP_${type.toUpperCase()}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
      } catch (e) {
        alert("Erreur export individuel.");
      } finally {
        setIsGenerating(false);
      }
    };

    (window as any).triggerGlobalPDF = async () => {
        try {
          setIsGenerating(true);
          const blob = await generateFullPdf();
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `SNIMOP_Dossier_Complet.pdf`;
          link.click();
          URL.revokeObjectURL(url);
        } catch (e) {
          alert("Erreur export global.");
        } finally {
          setIsGenerating(false);
        }
    };

    return () => {
      delete (window as any).triggerSpecificPDF;
      delete (window as any).triggerGlobalPDF;
    };
  }, [store]);

  if (isGenerating) {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-white font-black uppercase tracking-widest animate-pulse">Restauration du rendu Premium...</p>
      </div>
    );
  }

  return null;
};
