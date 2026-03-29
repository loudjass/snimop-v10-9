"use client";
import React, { useState } from 'react';
import { useDossierStore } from '@/store/useDossierStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SignaturePad } from '@/components/SignaturePad';
import { ArrowLeft, Download, Share2, CheckCircle, MessageCircle, Mail, CheckCircle2 } from 'lucide-react';
import jsPDF from 'jspdf';
import { format, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { renderPaginatedPhotos, calculateDevisTotals, cleanPdfText } from '../../utils/pdfGenerators';

import { SNIMOP_LOGO_PATH } from '@/components/ui/SnimopLogo';

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

// LOAD REAL PNG MASCOTTE
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

// HELPER FOR PHOTOS
const loadPhotoBase64 = async (base64: string): Promise<{img: HTMLImageElement, ratio: number} | null> => {
  if (!base64 || !base64.startsWith('data:image')) return null;
  try {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ img, ratio: img.width / img.height });
      img.onerror = () => resolve(null);
      img.src = base64;
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

      // Carte CLIENT
      coverY += 25;
      // Ombre douce
      pdf.setFillColor(200, 208, 228);
      pdf.roundedRect(26.5, coverY + 1.5, 160, 42, 3, 3, 'F');
      // Carte
      pdf.setFillColor(248, 251, 255);
      pdf.setDrawColor(195, 210, 240);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(25, coverY, 160, 42, 3, 3, 'FD');
      // Label CLIENT
      pdf.setFillColor(30, 58, 138);
      pdf.roundedRect(25, coverY, 160, 11, 3, 3, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text("CLIENT", 35, coverY + 7.5);
      pdf.setTextColor(40, 48, 65);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10.5);
      const clientContent = `Nom : ${store.client || 'Non renseigné'} \u00b7 Contact : ${store.contact || '-'} \u00b7 T\u00e9l : ${store.telephone || '-'}`;
      pdf.text(pdf.splitTextToSize(clientContent, 148), 32, coverY + 17);
      pdf.setFontSize(9.5); pdf.setTextColor(80, 90, 110);
      pdf.text(`Email : ${store.email || '-'}`, 32, coverY + 28);

      // Carte CHANTIER
      coverY += 52;
      // Ombre douce
      pdf.setFillColor(200, 208, 228);
      pdf.roundedRect(26.5, coverY + 1.5, 160, 42, 3, 3, 'F');
      // Carte
      pdf.setFillColor(248, 251, 255);
      pdf.setDrawColor(195, 210, 240);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(25, coverY, 160, 42, 3, 3, 'FD');
      // Label CHANTIER
      pdf.setFillColor(30, 58, 138);
      pdf.roundedRect(25, coverY, 160, 11, 3, 3, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text("CHANTIER", 35, coverY + 7.5);
      pdf.setTextColor(40, 48, 65);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10.5);
      const siteContent = `Site : ${store.site || 'Non renseign\u00e9'} \u00b7 Adresse : ${store.adresse || '-'}`;
      pdf.text(pdf.splitTextToSize(siteContent, 148), 32, coverY + 17);
      pdf.setFontSize(9.5); pdf.setTextColor(80, 90, 110);
      pdf.text(`Technicien assign\u00e9 : ${store.technicien || '-'}`, 32, coverY + 28);


      // WATERMARK MASCOTTE PAGE 1
      if (mascotteData && mascotteData.img) {
        try {
          const markWidth = 140;
          const markHeight = markWidth / mascotteData.ratio;
          const markX = (210 - markWidth) / 2; // Centered
          const markY = 297 - markHeight - 20; // Bottom 
          
          pdf.saveGraphicsState();
          pdf.setGState(new (pdf as any).GState({ opacity: 0.1 }));
          pdf.addImage(mascotteData.img, 'PNG', markX, markY, markWidth, markHeight);
          pdf.restoreGraphicsState();
        } catch(e) { console.error("Watermark error", e); }
      }

      // ==========================================
      // EN-TÊTE INTÉRIEUR (COMPACT)
      // ==========================================
      const drawHeader = (pageContextPdf: jsPDF, pageTitle: string) => {
        // Fond quasi imperceptible blanc cassé bleuté
        pageContextPdf.setFillColor(252, 253, 255);
        pageContextPdf.rect(0, 0, 210, 297, 'F');

        // Ligne accent SNIMOP en tout haut de page
        pageContextPdf.setFillColor(30, 58, 138);
        pageContextPdf.rect(0, 0, 210, 1.5, 'F');

        // Zone en-tête blanche propre
        pageContextPdf.setFillColor(255, 255, 255);
        pageContextPdf.rect(0, 1.5, 210, 46, 'F');

        // Logo TOP LEFT (Respect Ratio)
        let lastLogoEndX = 15;
        if (logoData && logoData.img) {
          let targetWidth = 53;
          let targetHeight = targetWidth / logoData.ratio;
          if (targetHeight > 25) {
            targetHeight = 25;
            targetWidth = targetHeight * logoData.ratio;
          }
          pageContextPdf.addImage(logoData.img, 'PNG', 15, 10, targetWidth, targetHeight);
          lastLogoEndX = 15 + targetWidth;
        }

        // N° & Date TOP RIGHT
        pageContextPdf.setTextColor(100, 100, 100);
        pageContextPdf.setFontSize(10);
        pageContextPdf.setFont("helvetica", "bold");
        pageContextPdf.text(`Dossier N° ${store.numeroAffaire || '-'}`, 196, 16, { align: 'right' });
        pageContextPdf.setFontSize(9);
        pageContextPdf.setFont("helvetica", "normal");
        pageContextPdf.text(`Le ${getSafeDateShort(store.date)}`, 196, 22, { align: 'right' });

        // Titre métier
        pageContextPdf.setTextColor(30, 58, 138);
        pageContextPdf.setFontSize(15);
        pageContextPdf.setFont("helvetica", "bold");
        pageContextPdf.text(pageTitle.toUpperCase(), 15, 44);

        // Séparateur fin
        pageContextPdf.setDrawColor(195, 210, 235);
        pageContextPdf.setLineWidth(0.3);
        pageContextPdf.line(15, 48, 195, 48);


        // --- FILIGRANE MASCOTTE SUR TOUTES LES PAGES ---
        if (mascotteData && mascotteData.img) {
          try {
            const markWidth = 120;
            const markHeight = markWidth / mascotteData.ratio;
            const markX = (210 - markWidth) / 2;
            const markY = (297 - markHeight) / 2 + 10;
            
            pageContextPdf.saveGraphicsState();
            pageContextPdf.setGState(new (pageContextPdf as any).GState({ opacity: 0.1 }));
            pageContextPdf.addImage(mascotteData.img, 'PNG', markX, markY, markWidth, markHeight);
            pageContextPdf.restoreGraphicsState();
          } catch(e) {}
        }


        
        return 58; // Breathing room de départ au lieu de 48
      };

      let y = 58;

      // Un peu aéré verticalement (+8px au lieu de 5) pour les textes
      const addSection = (title: string, content?: string | number, halfWidth: boolean = false, xPos: number = 15) => {
        const cleanedText = cleanPdfText(String(content || ''));
        let text = cleanedText || "Non renseigné";
        if (y > 260) { pdf.addPage(); y = drawHeader(pdf, "Suite..."); }
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(30, 58, 138);
        pdf.text(title.toUpperCase(), xPos, y);
        pdf.setDrawColor(215, 222, 236);
        pdf.setLineWidth(0.2);
        pdf.line(xPos, y + 1.5, xPos + (halfWidth ? 85 : 180), y + 1.5);
        y += 4.5;
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(55, 65, 81);
        const ObjectifWidth = halfWidth ? 85 : 180;
        const lines = pdf.splitTextToSize(text, ObjectifWidth);
        // Small padding for long texts
        pdf.text(lines, xPos, y + (lines.length > 2 ? 0.5 : 0));
        return y + (lines.length * 4.5) + 5; 
      };

      const addSectionAt = (title: string, content: string | number | undefined, xPos: number, startY: number, halfWidth: boolean = false) => {
        const cleanedText = cleanPdfText(String(content || ''));
        let text = cleanedText || "Non renseigné";
        let localY = startY;
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(30, 58, 138);
        pdf.text(title.toUpperCase(), xPos, localY);
        pdf.setDrawColor(215, 222, 236);
        pdf.setLineWidth(0.2);
        pdf.line(xPos, localY + 1.5, xPos + (halfWidth ? 85 : 180), localY + 1.5);
        localY += 4.5;
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(55, 65, 81);
        const ObjectifWidth = halfWidth ? 85 : 180;
        const lines = pdf.splitTextToSize(text, ObjectifWidth);
        pdf.text(lines, xPos, localY + (lines.length > 2 ? 0.5 : 0));
        return localY + (lines.length * 4.5) + 5;
      };

      // PAGE 2
      pdf.addPage();
      y = drawHeader(pdf, "INFORMATIONS GÉNÉRALES SNIMOP");
      let yTopLine = y;
      let yL = addSectionAt("Client", `Nom: ${store.client || 'Non renseigné'}\nContact: ${store.contact || '-'}\nTél: ${store.telephone || '-'}\nEmail: ${store.email || '-'}`, 14, yTopLine, true);
      let yR = addSectionAt("Chantier", `Site: ${store.site || 'Non renseigné'}\nAdresse: ${store.adresse || '-'}\nTechnicien: ${store.technicien || '-'}`, 110, yTopLine, true);
      y = Math.max(yL, yR) + 5;
      pdf.setDrawColor(230, 230, 230);
      pdf.line(14, y - 5, 196, y - 5);
      y = addSection("Objet de l'intervention", store.objet);
      yTopLine = y;
      yL = addSectionAt("Type d'intervention", store.interventionType, 14, yTopLine, true);
      yR = addSectionAt("Statut du dossier", store.statutDossier, 110, yTopLine, true);
      y = Math.max(yL, yR);
      y = addSection("Type de document", store.typeDoc);

      // PAGE 3
      pdf.addPage();
      y = drawHeader(pdf, "VISITE AVANT DEVIS SNIMOP");
      y = addSection("Contexte et Constat", store.constat || store.contexte);
      y = addSection("Équipement concerné", store.equipement);
      y = addSection("ANALYSE & RECOMMANDATIONS", store.observations); 
      y = addSection("SOLUTION PROPOSÉE", store.travauxPreconises);
      y = addSection("MATÉRIEL FOURNI", store.materielEnvisage);
      yTopLine = y;
      yL = addSectionAt("Main d'œuvre estimée", store.moEstimee, 14, yTopLine, true);
      yR = addSectionAt("Déplacement", store.deplacement, 110, yTopLine, true);
      y = Math.max(yL, yR);
      y = addSection("Option nacelle", store.optionNacelle);
      y = addSection("Remarques", store.remarques);

      // ── MODALITÉS D'INTERVENTION ──
      const hasModalites = store.modalitesSite || store.modalitesInstallation ||
        (store.modalitesDemontage?.length ?? 0) > 0 ||
        (store.modalitesElevation?.length ?? 0) > 0 ||
        store.modalitesRisques;

      if (hasModalites) {
        // ─ Évaluation de la hauteur requise avant rendu ─
        let estimH = 24; // entête
        if (store.modalitesSite)           estimH += 14;
        if (store.modalitesInstallation)   estimH += 14;
        if (store.modalitesDemontage?.length) estimH += 14;
        if (store.modalitesElevation?.length) estimH += 14;
        if (store.modalitesEspace?.length)    estimH += 14;
        if (store.modalitesConditions?.length) estimH += 14;
        estimH += 14; // horaires + permis
        if (store.modalitesStationnement?.length) estimH += 14;
        if (store.modalitesRisques)        estimH += Math.ceil((store.modalitesRisques.length || 0) / 45) * 6 + 14;
        if (store.modalitesSignatureCharge) estimH += 36;

        // Forcer nouvelle page si pas assez d'espace
        if (y + estimH > 270) { pdf.addPage(); y = drawHeader(pdf, "VISITE AVANT DEVIS SNIMOP"); }
        y += 6;

        // Ombre douce de la carte
        pdf.setFillColor(200, 208, 228);
        const cardX = 14, cardW = 182;
        const safeCardH = Math.min(estimH + 2, 230);
        pdf.roundedRect(cardX + 1.5, y + 1.5, cardW, safeCardH, 3, 3, 'F');

        // Fond de la carte
        pdf.setFillColor(248, 251, 255);
        pdf.setDrawColor(195, 210, 240);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(cardX, y, cardW, safeCardH, 3, 3, 'FD');

            // Filigrane Mascotte interne (très léger)
            if (mascotteData && mascotteData.img) {
              try {
                const mWidth = 70;
                const mHeight = mWidth / mascotteData.ratio;
                const mX = cardX + (cardW - mWidth) / 2;
                const mY = y + (safeCardH - mHeight) / 2;
                pdf.saveGraphicsState();
                pdf.setGState(new (pdf as any).GState({ opacity: 0.05 }));
                pdf.addImage(mascotteData.img, 'PNG', mX, mY, mWidth, mHeight);
                pdf.restoreGraphicsState();
              } catch(e) {}
            }

        // Entête section
        pdf.setFillColor(30, 58, 138);
        pdf.roundedRect(cardX, y, cardW, 10, 3, 3, 'F');
        pdf.setFontSize(9.5);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(255, 255, 255);
        pdf.text("MODALITÉS D'INTERVENTION", 105, y + 6.5, { align: 'center' });
        y += 15;

        // Helper avec page-break sécurisé
        const safeAddGroup = (label: string, val: string) => {
          if (y + 14 > 278) {
            pdf.addPage();
            y = drawHeader(pdf, "VISITE AVANT DEVIS SNIMOP");
            y += 4;
            pdf.setFillColor(248, 251, 255);
            pdf.setDrawColor(195, 210, 240);
            pdf.setLineWidth(0.3);
            pdf.roundedRect(cardX, y, cardW, 8, 2, 2, 'FD');
            pdf.setFontSize(9);
            pdf.setFont("helvetica", "italic");
            pdf.setTextColor(30, 58, 138);
            pdf.text("MODALITÉS D'INTERVENTION (suite)", cardX + 6, y + 5.5);
            y += 14;
          }
          pdf.setFontSize(8);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(30, 58, 138);
          pdf.text(label + ' :', cardX + 6, y);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(50, 58, 75);
          const valLines = pdf.splitTextToSize(val, cardW - 14);
          pdf.text(valLines.slice(0, 3), cardX + 6, y + 5);
          y += Math.max(14, valLines.slice(0, 3).length * 5 + 8);
        };

        if (store.modalitesSite) safeAddGroup('SITE', store.modalitesSite);
        if (store.modalitesInstallation) safeAddGroup('INSTALLATION', store.modalitesInstallation === 'neuf' ? 'Neuf' : 'Rénovation');
        if (store.modalitesDemontage?.length) safeAddGroup('DÉMONTAGE', store.modalitesDemontage.join(' • '));
        if (store.modalitesElevation?.length) safeAddGroup('ÉLÉVATION', store.modalitesElevation.join(' • '));
        if (store.modalitesEspace?.length) safeAddGroup('ESPACE NÉCESSAIRE', store.modalitesEspace.join(' • '));
        if (store.modalitesConditions?.length) safeAddGroup('CONDITIONS', store.modalitesConditions.join(' • '));

        // Horaires + Permis sur deux colonnes
        if (y + 14 > 278) { pdf.addPage(); y = drawHeader(pdf, "VISITE AVANT DEVIS SNIMOP"); y += 4; }
        pdf.setFontSize(8); pdf.setFont("helvetica", "bold"); pdf.setTextColor(30, 58, 138);
        pdf.text('CONTRAINTES HORAIRES :', cardX + 6, y);
        pdf.text('PERMIS REQUIS :', 105, y);
        pdf.setFont("helvetica", "normal"); pdf.setTextColor(50, 58, 75);
        const _hor = `Ouverture ${cleanPdfText(store.modalitesHeureOuverture) || '-'} — Fermeture ${cleanPdfText(store.modalitesHeureFermeture) || '-'}`;
        const _perm = store.modalitesPermis?.length ? cleanPdfText(store.modalitesPermis.join(' • ')) : 'Aucun';
        pdf.text(_hor, cardX + 6, y + 5);
        pdf.text(_perm, 105, y + 5);
        y += 14;

        if (store.modalitesStationnement?.length) safeAddGroup('STATIONNEMENT', store.modalitesStationnement.join(' • '));
        if (store.modalitesRisques) safeAddGroup('RISQUES IDENTIFIÉS', store.modalitesRisques);

        if (store.modalitesSignatureCharge) {
          if (y + 36 > 278) { pdf.addPage(); y = drawHeader(pdf, "VISITE AVANT DEVIS SNIMOP"); y += 4; }
          pdf.setFontSize(8); pdf.setFont("helvetica", "bold"); pdf.setTextColor(80, 90, 110);
          pdf.text("SIGNATURE CHARGÉ D'AFFAIRE :", cardX + 6, y);
          y += 4;
          pdf.addImage(store.modalitesSignatureCharge, 'PNG', cardX + 6, y, 70, 20);
          y += 26;
        }
        y += 4; // breathing room
      }

      // PAGE 4
      pdf.addPage();
      y = drawHeader(pdf, "DEVIS SNIMOP");
      if (store.resumeIntervention) {
        y = addSection("RÉSUMÉ DE L'INTERVENTION", store.resumeIntervention);
      }
      y = addSection("SOLUTION PROPOSÉE", store.descriptifTravaux);
      
      if (!store.devisModeClient && !store.devisModeRapide) {
        y = addSection("MATÉRIEL FOURNI", store.devisMateriel);
      }
      yTopLine = y;
      // --- CALCULS FINANCIERS DEVIS ---
      const totals = calculateDevisTotals(store);
      
      if (!store.devisModeClient) {
        let textMo = cleanPdfText(store.devisMo);
        if (totals.moHT > 0) {
          textMo = `${totals.moHT.toFixed(2)} € HT`;
          if (totals.d_int > 1) textMo += `\n(${totals.d_int} intervenants x ${totals.d_hr}h)`;
          else if (totals.d_hr > 0) textMo += `\n(${totals.d_hr}h)`;
        }
        if (!textMo) textMo = 'Non renseigné';
        
        let textDep = cleanPdfText(store.devisDeplacement);
        if (totals.dep > 0) textDep = `${totals.dep.toFixed(2)} € HT`;
        if (!textDep) textDep = 'Non renseigné';

        yL = addSectionAt("Main d'œuvre", textMo, 14, yTopLine, true);
        yR = addSectionAt("Déplacement", textDep, 110, yTopLine, true);
        y = Math.max(yL, yR);

        let textOpt = cleanPdfText(store.devisOptions) || '';
        let linesOpt = textOpt ? [textOpt] : [];
        if (store.nacelleActive && !store.devisModeRapide) linesOpt.push(`OPTION NACELLE : Oui (Coût: ${totals.nacelle.toFixed(2)} € HT)`);
        if (totals.items > 0) linesOpt.push(`AUTRES FRAIS : ${totals.items.toFixed(2)} € HT`);
        
        y = addSection("Options / Frais Annexes", linesOpt.length > 0 ? linesOpt.join('\n') : 'Aucun');
      }

      if (!store.devisModeRapide) {
        y = addSection("Réserves / Exclusions", store.reserves);
        y = addSection("Conditions de règlement", store.conditionsReglement);
        y = addSection("Délai de réalisation", store.delai);
      }
      
      // CARTE VALEUR AJOUTÉE SNIMOP
      if (y + 50 > 260) { pdf.addPage(); y = drawHeader(pdf, "DEVIS SNIMOP (Suite)"); }
      pdf.setFillColor(200, 208, 228);
      pdf.roundedRect(16.5, y + 1.5, 180, 38, 3, 3, 'F');
      pdf.setFillColor(248, 251, 255);
      pdf.setDrawColor(195, 210, 240);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(15, y, 180, 38, 3, 3, 'FD');
      pdf.setFontSize(8.5);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(30, 58, 138);
      pdf.text("VALEUR AJOUTÉE SNIMOP", 20, y + 6);
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(60, 70, 85);
      pdf.text("•  Réactivité garantie", 20, y + 13);
      pdf.text("•  Expertise technique confirmée", 20, y + 18);
      pdf.text("•  Matériel professionnel", 20, y + 23);
      pdf.text("•  Accompagnement client sur-mesure", 20, y + 28);
      
      pdf.setFont("helvetica", "italic");
      pdf.text("Notre priorité : vous assurer une prestation de qualité, claire et durable.", 20, y + 34);
      y += 44;

      // CONDITIONS FINANCIÈRES (calcul réel assuré par la fonction unifiée)
      if (y > 210) { pdf.addPage(); y = drawHeader(pdf, "DEVIS SNIMOP (Suite)"); }
      y += 8;

      // Titre section CONDITIONS
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(30, 58, 138);
      pdf.text("CONDITIONS FINANCIÈRES", 15, y);
      pdf.setDrawColor(30, 58, 138);
      pdf.setLineWidth(0.4);
      pdf.line(15, y + 2.5, 195, y + 2.5);
      y += 10;

      // Ombre douce
      pdf.setFillColor(200, 208, 228);
      pdf.roundedRect(16.5, y + 1.5, 180, 58, 3, 3, 'F');
      // Carte
      pdf.setFillColor(248, 251, 255);
      pdf.setDrawColor(195, 210, 240);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(15, y, 180, 58, 3, 3, 'FD');

      // HT
      pdf.setFontSize(9.5); pdf.setFont("helvetica", "bold"); pdf.setTextColor(90, 95, 120);
      pdf.text("Montant HT :", 22, y + 13);
      pdf.setFont("helvetica", "normal"); pdf.setTextColor(40, 45, 60);
      pdf.text(`${totals.finalHT.toFixed(2)} €`, 80, y + 13);

      // TVA
      pdf.setFont("helvetica", "bold"); pdf.setTextColor(90, 95, 120);
      pdf.text(`TVA (${store.tvaPourcentage || 20}%) :`, 22, y + 24);
      pdf.setFont("helvetica", "normal"); pdf.setTextColor(40, 45, 60);
      pdf.text(`${totals.tvaVal.toFixed(2)} €`, 80, y + 24);

      // Trait séparateur
      pdf.setDrawColor(195, 210, 240); pdf.setLineWidth(0.4);
      pdf.line(22, y + 30, 192, y + 30);

      // TTC bandeau premium
      pdf.setFillColor(30, 58, 138);
      pdf.roundedRect(15, y + 33, 180, 22, 2, 2, 'F');
      pdf.setFontSize(11); pdf.setFont("helvetica", "bold"); pdf.setTextColor(255, 255, 255);
      pdf.text("TOTAL TTC :", 24, y + 47);
      pdf.setFontSize(14);
      pdf.text(`${totals.ttc.toFixed(2)} €`, 192, y + 47, { align: 'right' });

      y += 62;

      // Acompte discret
      if (store.acompteDemande) {
        const _ac = totals.ttc * ((store.acomptePourcentage || 30) / 100);
        pdf.setFontSize(8.5); pdf.setTextColor(70, 100, 180); pdf.setFont("helvetica", "normal");
        pdf.text(`Acompte demandé (${store.acomptePourcentage}%) : ${_ac.toFixed(2)} €`, 22, y);
        y += 8;
      }
      y += 4;

      const yRL = addSectionAt("Règlement", store.conditionsReglement, 15, y, true);
      const yRR = addSectionAt("Délai", store.delai, 110, y, true);
      y = Math.max(yRL, yRR);

      // PAGE 5
      pdf.addPage();
      y = drawHeader(pdf, "BON D'INTERVENTION SNIMOP");
      const hasHor = store.heureDebut || store.heureFin;
      let dTxt = store.dateIntervention ? getSafeDateFormatted(store.dateIntervention) : 'Non renseignée';
      if (hasHor) {
        if (store.heureDebut && store.heureFin) dTxt += ` de ${store.heureDebut} à ${store.heureFin}`;
        else if (store.heureDebut) dTxt += ` à partir de ${store.heureDebut}`;
        else if (store.heureFin) dTxt += ` jusqu'à ${store.heureFin}`;
      }
      y = addSection("Date d'intervention prévue", dTxt);
      y = addSection("SOLUTION PROPOSÉE", store.natureTravaux);
      y = addSection("MATÉRIEL FOURNI", store.materielPrevu);
      y = addSection("Consignes et Remarques", store.consignes);

      // PAGE 6
      pdf.addPage();
      y = drawHeader(pdf, "COMPTE RENDU D'INTERVENTION");
      y = addSection("Nature réelle de l'intervention", store.natureReelle);
      y = addSection("Travaux réalisés", store.travauxRealises);
      y = addSection("Matériel utilisé", store.materielUtilise);
      yTopLine = y;
      const tempsPasseS = store.tempsPasse ? `${store.tempsPasse} heures` : '';
      let horS = '';
      if (store.heureDebut && store.heureFin) horS = `${store.heureDebut} - ${store.heureFin}`;
      else if (store.heureDebut) horS = `À partir de ${store.heureDebut}`;

      yL = addSectionAt("Horaires et Temps passé", horS ? `${horS}${tempsPasseS ? ' (' + tempsPasseS + ')' : ''}` : tempsPasseS, 14, yTopLine, true);
      yR = addSectionAt("Anomalies constatées", store.anomalies, 110, yTopLine, true);
      y = Math.max(yL, yR);
      y = addSection("Réserves", store.rapportReserves);
      y = addSection("Observations finales", store.observationsFinales);

      // PHOTOS SUPPLEMENTAIRES
      if (store.photos && store.photos.length > 0) {
        const headerWrapper = (p: jsPDF, l: any, m: any, s: any, title: string) => {
          return drawHeader(p, title);
        };
        await renderPaginatedPhotos(pdf, store.photos, null, null, store, headerWrapper);
      }

      // PAGE 7 — VALIDATION FINALE
      pdf.addPage();
      y = drawHeader(pdf, "VALIDATION FINALE");
      y += 8;

      // Ombre carte signature
      pdf.setFillColor(200, 208, 228);
      pdf.roundedRect(16.5, y + 1.5, 180, 84, 3, 3, 'F');

      // Carte principale
      pdf.setFillColor(248, 251, 255);
      pdf.setDrawColor(195, 210, 240);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(15, y, 180, 84, 3, 3, 'FD');

      // Bandeau titre SIGNATURE CLIENT
      pdf.setFillColor(30, 58, 138);
      pdf.roundedRect(15, y, 180, 12, 3, 3, 'F');
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(255, 255, 255);
      pdf.text("VALIDATION ET SIGNATURE CLIENT", 105, y + 8, { align: 'center' });
      y += 20;

      // Signataire
      pdf.setFontSize(9.5);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(60, 75, 100);
      pdf.text("Signataire :", 22, y);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(30, 40, 60);
      const signataire = store.nomSignataireClient || store.contact || store.client || '';
      pdf.text(signataire || 'Non renseigné', 46, y);

      // Zone signature
      y += 8;
      if (store.signatureClient && store.signatureClient.startsWith('data:image')) {
        // Léger fond blanc derrière la signature
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(210, 220, 235);
        pdf.setLineWidth(0.2);
        pdf.roundedRect(22, y, 84, 30, 2, 2, 'FD');
        pdf.addImage(store.signatureClient, 'PNG', 23, y + 1, 82, 28);
      } else {
        pdf.setFillColor(250, 250, 255);
        pdf.setDrawColor(210, 220, 235);
        pdf.setLineWidth(0.2);
        pdf.setLineDashPattern([2, 2], 0);
        pdf.roundedRect(22, y, 84, 30, 2, 2, 'FD');
        pdf.setLineDashPattern([], 0);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "italic");
        pdf.setTextColor(180, 185, 200);
        pdf.text("Signature électronique", 64, y + 16, { align: 'center' });
        pdf.text("non renseignée", 64, y + 22, { align: 'center' });
      }

      // BON POUR ACCORD
      if (store.bonPourAccord) {
        // Carte verte BPA
        pdf.setFillColor(22, 101, 52); // vert foncé
        pdf.roundedRect(114, y, 76, 30, 2, 2, 'F');
        // Badge LU ET APPROUVÉ
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(132, y + 5, 40, 6, 1, 1, 'F');
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(22, 101, 52);
        pdf.text("LU ET APPROUVÉ", 152, y + 9.5, { align: 'center' });
        // Text BPA
        pdf.setFontSize(9.5);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(255, 255, 255);
        pdf.text("BON POUR ACCORD", 152, y + 17, { align: 'center' });
        // Date/heure automatique
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(200, 230, 210);
        const signedAt = store.stepSignatures?.['devis']?.dateSignature 
           ? format(new Date(store.stepSignatures['devis'].dateSignature), "dd/MM/yyyy à HH:mm", { locale: fr })
           : format(new Date(), "dd/MM/yyyy à HH:mm", { locale: fr });
        pdf.text(`Signé le ${signedAt}`, 152, y + 25, { align: 'center' });
      }

      // ─ Pagination
      const totalPages = pdf.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        pdf.setPage(p);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(180, 180, 180);
        pdf.text(`Page ${p} / ${totalPages}`, 195, 291, { align: 'right' });
        pdf.setDrawColor(220, 220, 220);
        pdf.setLineWidth(0.2);
        pdf.line(15, 288, 195, 288);
        pdf.setTextColor(200, 200, 200);
        pdf.setFontSize(7.5);
        pdf.text('SNIMOP — Document confidentiel', 15, 291);
      }

      return pdf.output('blob');

    } catch (error) {
      console.error("CRITICAL PDF GENERATION ERROR:", error);
      throw error;
    }
  };

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      const blob = await generatePdfBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SNIMOP_Dossier_${store.numeroAffaire || 'SansRef'}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert("Erreur critique lors de la création du fichier PDF.\n" + (e.message || String(e)));
    } finally {
      setIsGenerating(false);
    }
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
    <div className="flex flex-col gap-6 py-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 shadow-inner">
            <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-slate-200 tracking-widest uppercase drop-shadow-lg">
            Exporter
          </h2>
        </div>
      </div>
      <div className="bg-[#0f172a]/70 backdrop-blur-2xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-slate-700/50 flex flex-col gap-8 mt-2">

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
            Télécharger le Dossier Complet
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
