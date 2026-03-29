// utils/pdfGenerators.ts
// Générateurs PDF individuel par onglet — SNIMOP
// Reprend exactement le style du PDF global (même header, même structure)

import jsPDF from 'jspdf';
import { format, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DossierData, StepSignature } from '@/store/useDossierStore';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
type ImgData = { img: HTMLImageElement; ratio: number } | null;

// ─────────────────────────────────────────────
// HELPERS IMAGE
// ─────────────────────────────────────────────
const loadImg = (src: string): Promise<ImgData> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ img, ratio: img.width / img.height });
    img.onerror = () => resolve(null);
    img.src = src;
  });

export const loadLogoBase64 = () => loadImg('/snimop-logo.png');
export const loadMascotteBase64 = () => loadImg('/snimop-mascote.png');
export const loadPhotoBase64 = (base64: string): Promise<ImgData> => {
  if (!base64 || !base64.startsWith('data:image')) return Promise.resolve(null);
  return loadImg(base64);
};

// ─────────────────────────────────────────────
// DATE HELPERS
// ─────────────────────────────────────────────
export const safeDateLong = (d?: string | null) => {
  if (!d) return format(new Date(), 'dd MMMM yyyy', { locale: fr });
  const p = new Date(d);
  return isValid(p) ? format(p, 'dd MMMM yyyy', { locale: fr }) : format(new Date(), 'dd MMMM yyyy', { locale: fr });
};
export const safeDateShort = (d?: string | null) => {
  if (!d) return format(new Date(), 'dd/MM/yyyy', { locale: fr });
  const p = new Date(d);
  return isValid(p) ? format(p, 'dd/MM/yyyy', { locale: fr }) : format(new Date(), 'dd/MM/yyyy', { locale: fr });
};

// ─────────────────────────────────────────────
// HEADER COMMUN (identique au PDF global)
// ─────────────────────────────────────────────
export const drawPageHeader = (
  pdf: jsPDF,
  logoData: ImgData,
  mascotteData: ImgData,
  store: DossierData,
  pageTitle: string
): number => {
  // Fond quasi imperceptible blanc cassé
  pdf.setFillColor(252, 253, 255);
  pdf.rect(0, 0, 210, 297, 'F');
  // Ligne accent SNIMOP en haut
  pdf.setFillColor(30, 58, 138);
  pdf.rect(0, 0, 210, 1.5, 'F');
  // Zone en-tête blanche
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 1.5, 210, 46, 'F');

  // Logo top-left
  if (logoData) {
    let w = 53;
    let h = w / logoData.ratio;
    if (h > 25) { h = 25; w = h * logoData.ratio; }
    pdf.addImage(logoData.img, 'PNG', 15, 10, w, h);
  }

  // N° & Date top-right
  pdf.setTextColor(100, 100, 100);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Dossier N° ${store.numeroAffaire || '-'}`, 196, 16, { align: 'right' });
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Le ${safeDateShort(store.date)}`, 196, 22, { align: 'right' });

  // Titre section
  pdf.setTextColor(30, 58, 138);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(pageTitle.toUpperCase(), 15, 44);

  // Séparateur
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.3);
  pdf.line(15, 48, 195, 48);

  // Filigrane mascotte
  if (mascotteData) {
    try {
      const mw = 120;
      const mh = mw / mascotteData.ratio;
      pdf.saveGraphicsState();
      pdf.setGState(new (pdf as any).GState({ opacity: 0.1 }));
      pdf.addImage(mascotteData.img, 'PNG', (210 - mw) / 2, (297 - mh) / 2 + 10, mw, mh);
      pdf.restoreGraphicsState();
    } catch (_) {}
  }

  return 58;
};

// ─────────────────────────────────────────────
// SECTION TEXT HELPER
// ─────────────────────────────────────────────
const addSection = (
  pdf: jsPDF,
  title: string,
  content: string | number | undefined,
  y: number,
  xPos = 15,
  maxWidth = 180
): number => {
  const text = String(content || '').trim() || 'Non renseigné';
  if (y > 270) return y;
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 58, 138);
  pdf.text(title.toUpperCase(), xPos, y);
  pdf.setDrawColor(215, 222, 236);
  pdf.setLineWidth(0.2);
  pdf.line(xPos, y + 1.5, xPos + maxWidth, y + 1.5);
  y += 4.5;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(55, 65, 81);
  const lines = pdf.splitTextToSize(text, maxWidth);
  // Small padding for long texts
  pdf.text(lines, xPos, y + (lines.length > 2 ? 0.5 : 0));
  return y + lines.length * 4.5 + 5; 
};

// ─────────────────────────────────────────────
// HELPER PAGE CHECK + NEW PAGE
// ─────────────────────────────────────────────
const ensureSpace = (
  pdf: jsPDF,
  y: number,
  needed: number,
  logoData: ImgData,
  mascotteData: ImgData,
  store: DossierData,
  title: string
): number => {
  if (y + needed > 272) {
    pdf.addPage();
    return drawPageHeader(pdf, logoData, mascotteData, store, title);
  }
  return y;
};

// ─────────────────────────────────────────────
// BLOC PHOTOS CENTRALISÉ ET EXHAUSTIF (PAGINÉ)
// ─────────────────────────────────────────────
export const renderPaginatedPhotos = async (
  pdf: jsPDF,
  photos: DossierData['photos'],
  logoData: ImgData | null,
  mascotteData: ImgData | null,
  store: DossierData,
  drawPageHeaderFn: (p: jsPDF, l: ImgData | null, m: ImgData | null, s: DossierData, t: string) => number
) => {
  if (!photos || photos.length === 0) return undefined;

  let currentY = 0;

  const chunks = [];
  for (let i = 0; i < photos.length; i += 4) {
    chunks.push(photos.slice(i, i + 4));
  }

  const getLabel = (type: string) => {
    switch (type) {
      case 'Avant':   return 'ÉTAT AVANT INTERVENTION';
      case 'Après':   return 'ÉTAT APRÈS INTERVENTION';
      case 'Pendant': return 'EN COURS D\'INTERVENTION';
      case 'Plan':    return 'PLAN / SCHÉMA / DOCUMENT';
      default:        return 'OBSERVATION TECHNIQUE';
    }
  };

  for (let c = 0; c < chunks.length; c++) {
    const chunk = chunks[c];
    pdf.addPage();
    let y = drawPageHeaderFn(pdf, logoData, mascotteData, store, 'DOCUMENTS & PHOTOS');

    y += 4;
    pdf.setFontSize(9.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(80, 80, 80);
    pdf.text('PHOTOS ET ILLUSTRATIONS :', 15, y);
    pdf.setDrawColor(210, 210, 210);
    pdf.setLineWidth(0.2);
    pdf.line(15, y + 2, 195, y + 2);
    y += 8;

    let colCount = 2;
    let PHOTO_W = 84;
    let CARD_H  = 80;
    let IMG_H   = 54;
    let GAP_X   = 8;
    let GAP_Y   = 8;
    let startX  = 15;

    if (chunk.length === 1) {
      colCount = 1;
      PHOTO_W = 140;
      CARD_H  = 120;
      IMG_H   = 90;
      startX  = 35;
    } else if (chunk.length === 2) {
      colCount = 1;
      PHOTO_W = 120;
      CARD_H  = 90;
      IMG_H   = 64;
      startX  = 45;
      GAP_Y   = 10;
    }

    const totalRows = Math.ceil(chunk.length / colCount);
    const neededForBlock = totalRows * (CARD_H + GAP_Y);

    const remainingSpace = 272 - y;
    if (remainingSpace > neededForBlock + 30) {
      y += (remainingSpace - neededForBlock) / 2;
    }

    for (let row = 0; row < totalRows; row++) {
      const rowPhotos = chunk.slice(row * colCount, row * colCount + colCount);

      for (let col = 0; col < rowPhotos.length; col++) {
        const photo = rowPhotos[col];
        const pd = await loadPhotoBase64(photo.imageBase64);
        if (!pd) continue;
        
        const cx = startX + col * (PHOTO_W + GAP_X);
        const cy = y;

        // Ombre douce
        pdf.setFillColor(200, 208, 228);
        pdf.roundedRect(cx + 1.5, cy + 1.5, PHOTO_W, CARD_H, 3, 3, 'F');

        // Carte
        pdf.setFillColor(252, 253, 255);
        pdf.setDrawColor(195, 210, 240);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(cx, cy, PHOTO_W, CARD_H, 3, 3, 'FD');

        const pad = 3;
        let dw = PHOTO_W - pad * 2;
        let dh = dw / pd.ratio;
        if (dh > IMG_H - pad * 2) { dh = IMG_H - pad * 2; dw = dh * pd.ratio; }
        pdf.addImage(pd.img, 'JPEG', cx + (PHOTO_W - dw) / 2, cy + (IMG_H - dh) / 2, dw, dh);

        pdf.setDrawColor(30, 58, 138);
        pdf.setLineWidth(0.4);
        pdf.line(cx + 3, cy + IMG_H, cx + PHOTO_W - 3, cy + IMG_H);

        const labelText = getLabel(photo.type);
        pdf.setFontSize(6.5);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 58, 138);
        const lblW = Math.min(pdf.getTextWidth(labelText) + 6, PHOTO_W - 8);
        pdf.setFillColor(239, 246, 255);
        pdf.roundedRect(cx + 3, cy + IMG_H + 2.5, lblW, 6.5, 1, 1, 'F');
        pdf.text(labelText, cx + 6, cy + IMG_H + 7.5);

        const desc = (photo.title || '').trim();
        if (desc) {
          pdf.setFontSize(7);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(55, 65, 81);
          const dlines = pdf.splitTextToSize(desc, PHOTO_W - 8).slice(0, 2);
          pdf.text(dlines, cx + 4, cy + IMG_H + 16);
        }
      }
      y += CARD_H + GAP_Y;
    }
    currentY = y;
  }
  return currentY;
};

// ─────────────────────────────────────────────
// BLOC SIGNATURE
// ─────────────────────────────────────────────
const drawSignatureBlock = (
  pdf: jsPDF,
  sig: StepSignature | undefined,
  y: number,
  title: string
): number => {
  if (!sig) return y;
  const hasAnySig = sig.technicienSignature || sig.clientSignature;
  if (!hasAnySig && !sig.technicienNom && !sig.clientNom) return y;

  y += 8;

  // Ombre carte signature
  pdf.setFillColor(200, 208, 228);
  pdf.roundedRect(16.5, y + 1.5, 180, 84, 3, 3, 'F');

  // Carte principale
  pdf.setFillColor(248, 251, 255);
  pdf.setDrawColor(195, 210, 240);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(15, y, 180, 84, 3, 3, 'FD');

  // Bandeau titre
  pdf.setFillColor(30, 58, 138);
  pdf.roundedRect(15, y, 180, 12, 3, 3, 'F');
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text(`VISA — ${title.toUpperCase()}`, 105, y + 8, { align: 'center' });
  y += 20;

  const drawOneSig = (label: string, nom: string, sigB64: string, x: number) => {
    pdf.setFontSize(9.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(60, 75, 100);
    pdf.text(`${label} :`, x, y);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(30, 40, 60);
    pdf.text(nom || 'Non renseigné', x + pdf.getTextWidth(`${label} :`) + 2, y);

    const sigY = y + 8;
    if (sigB64 && sigB64.startsWith('data:image')) {
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(210, 220, 235);
      pdf.setLineWidth(0.2);
      pdf.roundedRect(x, sigY, 84, 30, 2, 2, 'FD');
      pdf.addImage(sigB64, 'PNG', x + 1, sigY + 1, 82, 28);
    } else {
      pdf.setFillColor(250, 250, 255);
      pdf.setDrawColor(210, 220, 235);
      pdf.setLineWidth(0.2);
      pdf.setLineDashPattern([2, 2], 0);
      pdf.roundedRect(x, sigY, 84, 30, 2, 2, 'FD');
      pdf.setLineDashPattern([], 0);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(180, 185, 200);
      pdf.text('Signature électronique', x + 42, sigY + 16, { align: 'center' });
      pdf.text('non renseignée', x + 42, sigY + 22, { align: 'center' });
    }

    if (label === 'Client') {
      pdf.setFillColor(230, 250, 240); // Vert très clair
      pdf.roundedRect(x + 48, y - 4, 36, 5, 1, 1, 'F');
      pdf.setFontSize(5.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(22, 101, 52); // Vert foncé
      pdf.text("LU ET APPROUVÉ", x + 66, y - 0.5, { align: 'center' });
    }
  };

  drawOneSig('Intervenant', sig.technicienNom || '', sig.technicienSignature || '', 22);
  drawOneSig('Client', sig.clientNom || '', sig.clientSignature || '', 108);

  if (sig.dateSignature) {
    const d = new Date(sig.dateSignature);
    if (isValid(d)) {
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Signé le ${format(d, "dd/MM/yyyy 'à' HH:mm", { locale: fr })}`, 190, y + 42, { align: 'right' });
    }
  } else {
    // Generate auto-date with time
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Signé le ${format(new Date(), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}`, 190, y + 42, { align: 'right' });
  }

  return y + 72;
};

// ─────────────────────────────────────────────
// PAGINATION
// ─────────────────────────────────────────────
const addPagination = (pdf: jsPDF): void => {
  const total = pdf.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(180, 180, 180);
    pdf.text(`Page ${i} / ${total}`, 195, 291, { align: 'right' });
    // Trait de pied de page
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.2);
    pdf.line(15, 288, 195, 288);
    // Mention SNIMOP à gauche
    pdf.setTextColor(200, 200, 200);
    pdf.setFontSize(7.5);
    pdf.text('SNIMOP — Document confidentiel', 15, 291);
  }
};

// ─────────────────────────────────────────────
// DOWNLOAD HELPER
// ─────────────────────────────────────────────
export const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// ═══════════════════════════════════════════════
// GÉNÉRATEURS INDIVIDUELS
// ═══════════════════════════════════════════════

// ─────────────────────────────────────────────
// PDF INFORMATIONS GÉNÉRALES
// ─────────────────────────────────────────────
export const generateInfosPdf = async (store: DossierData): Promise<Blob> => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const logo = await loadLogoBase64();
  const masc = await loadMascotteBase64();

  let y = drawPageHeader(pdf, logo, masc, store, 'INFORMATIONS GÉNÉRALES SNIMOP');

  y = addSection(pdf, 'Dossier N°', store.numeroAffaire, y);
  y = addSection(pdf, 'Date', safeDateLong(store.date), y);

  y += 6;
  // ── CARTE CLIENT ──
  pdf.setFillColor(200, 208, 228);
  pdf.roundedRect(16.5, y + 1.5, 180, 42, 3, 3, 'F');
  pdf.setFillColor(248, 251, 255);
  pdf.setDrawColor(195, 210, 240);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(15, y, 180, 42, 3, 3, 'FD');
  pdf.setFillColor(30, 58, 138);
  pdf.roundedRect(15, y, 180, 11, 3, 3, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CLIENT', 25, y + 7.5);
  pdf.setTextColor(40, 48, 65);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10.5);
  const clientContent = `Nom : ${store.client || 'Non renseigné'} · Contact : ${store.contact || '-'} · Tél : ${store.telephone || '-'}`;
  pdf.text(pdf.splitTextToSize(clientContent, 160), 22, y + 17);
  pdf.setFontSize(9.5); pdf.setTextColor(80, 90, 110);
  pdf.text(`Email : ${store.email || '-'}`, 22, y + 28);
  y += 52;

  // ── CARTE CHANTIER ──
  pdf.setFillColor(200, 208, 228);
  pdf.roundedRect(16.5, y + 1.5, 180, 42, 3, 3, 'F');
  pdf.setFillColor(248, 251, 255);
  pdf.setDrawColor(195, 210, 240);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(15, y, 180, 42, 3, 3, 'FD');
  pdf.setFillColor(30, 58, 138);
  pdf.roundedRect(15, y, 180, 11, 3, 3, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CHANTIER', 25, y + 7.5);
  pdf.setTextColor(40, 48, 65);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10.5);
  const siteContent = `Site : ${store.site || 'Non renseigné'} · Adresse : ${store.adresse || '-'}`;
  pdf.text(pdf.splitTextToSize(siteContent, 160), 22, y + 17);
  pdf.setFontSize(9.5); pdf.setTextColor(80, 90, 110);
  pdf.text(`Technicien assigné : ${store.technicien || '-'}`, 22, y + 28);
  y += 50;

  y = addSection(pdf, 'Type d\'intervention', store.interventionType, y);
  y = addSection(pdf, 'Objet / Intitulé', store.objet, y);
  y = addSection(pdf, 'Statut du dossier', store.statutDossier, y);
  y = addSection(pdf, 'Type de document', store.typeDoc, y);

  addPagination(pdf);
  return pdf.output('blob');
};

// ─────────────────────────────────────────────
export const generateVisitePdf = async (store: DossierData): Promise<Blob> => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const logo = await loadLogoBase64();
  const masc = await loadMascotteBase64();

  let y = drawPageHeader(pdf, logo, masc, store, 'VISITE AVANT DEVIS SNIMOP');

  y = addSection(pdf, 'Contexte / Demande client', store.contexte || store.constat, y);
  y = addSection(pdf, 'Constat sur place', store.constat, y);
  y = addSection(pdf, 'Équipement concerné', store.equipement, y);
  y = addSection(pdf, 'ANALYSE & RECOMMANDATIONS', store.observations, y);
  y = addSection(pdf, 'SOLUTION PROPOSÉE', store.travauxPreconises, y);
  y = addSection(pdf, 'MATÉRIEL FOURNI', store.materielEnvisage, y);

  const yL = addSection(pdf, 'Main d\'œuvre estimée', store.moEstimee, y, 14, 85);
  const yR = addSection(pdf, 'Déplacement', store.deplacement, y, 110, 85);
  y = Math.max(yL, yR);

  y = addSection(pdf, 'Option nacelle', store.optionNacelle, y);
  y = addSection(pdf, 'Remarques', store.remarques, y);

  // ── MODALITÉS D'INTERVENTION ──
  const m = store;
  const hasModalites = m.modalitesSite || m.modalitesInstallation || m.modalitesDemontage?.length || m.modalitesElevation?.length || m.modalitesRisques;
  if (hasModalites) {
    let estimH = 24;
    if (m.modalitesSite)           estimH += 14;
    if (m.modalitesInstallation)   estimH += 14;
    if (m.modalitesDemontage?.length) estimH += 14;
    if (m.modalitesElevation?.length) estimH += 14;
    if (m.modalitesEspace?.length)    estimH += 14;
    if (m.modalitesConditions?.length) estimH += 14;
    estimH += 14; // horaires + permis
    if (m.modalitesStationnement?.length) estimH += 14;
    if (m.modalitesRisques)        estimH += Math.ceil((m.modalitesRisques.length || 0) / 45) * 6 + 14;
    if (m.modalitesSignatureCharge) estimH += 36;

    y = ensureSpace(pdf, y, estimH > 200 ? 50 : estimH, logo, masc, store, 'VISITE AVANT DEVIS SNIMOP');
    y += 6;

    const cardX = 14, cardW = 182;
    const safeCardH = Math.min(estimH + 2, 230);
    pdf.setFillColor(200, 208, 228);
    pdf.roundedRect(cardX + 1.5, y + 1.5, cardW, safeCardH, 3, 3, 'F');

    pdf.setFillColor(248, 251, 255);
    pdf.setDrawColor(195, 210, 240);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(cardX, y, cardW, safeCardH, 3, 3, 'FD');

    // Filigrane Mascotte interne (très léger)
    if (masc && masc.img) {
      try {
        const mWidth = 70;
        const mHeight = mWidth / masc.ratio;
        const mX = cardX + (cardW - mWidth) / 2;
        const mY = y + (safeCardH - mHeight) / 2;
        pdf.saveGraphicsState();
        pdf.setGState(new (pdf as any).GState({ opacity: 0.05 }));
        pdf.addImage(masc.img, 'PNG', mX, mY, mWidth, mHeight);
        pdf.restoreGraphicsState();
      } catch(e) {}
    }

    pdf.setFillColor(30, 58, 138);
    pdf.roundedRect(cardX, y, cardW, 10, 3, 3, 'F');
    pdf.setFontSize(9.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text("MODALITÉS D'INTERVENTION", 105, y + 6.5, { align: 'center' });
    y += 15;

    const safeAddGroup = (lbl: string, val: string) => {
      if (y + 14 > 278) {
        y = ensureSpace(pdf, y, 100, logo, masc, store, 'VISITE AVANT DEVIS SNIMOP');
        y += 4;
        pdf.setFillColor(248, 251, 255);
        pdf.setDrawColor(195, 210, 240);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(cardX, y, cardW, 8, 2, 2, 'FD');
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(30, 58, 138);
        pdf.text("MODALITÉS D'INTERVENTION (suite)", cardX + 6, y + 5.5);
        y += 14;
      }
      pdf.setFontSize(8); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(30, 58, 138);
      pdf.text(lbl.toUpperCase() + ' :', cardX + 6, y);
      pdf.setFont('helvetica', 'normal'); pdf.setTextColor(50, 58, 75);
      const valLines = pdf.splitTextToSize(val, cardW - 14);
      pdf.text(valLines.slice(0, 3), cardX + 6, y + 5);
      y += Math.max(14, valLines.slice(0, 3).length * 5 + 8);
    };

    if (m.modalitesSite) safeAddGroup('SITE', m.modalitesSite);
    if (m.modalitesInstallation) safeAddGroup('INSTALLATION', m.modalitesInstallation === 'neuf' ? 'Neuf' : 'Rénovation');
    if (m.modalitesDemontage?.length) safeAddGroup('DÉMONTAGE', m.modalitesDemontage.join(' / '));
    if (m.modalitesElevation?.length) safeAddGroup('ÉLÉVATION', m.modalitesElevation.join(' / '));
    if (m.modalitesEspace?.length) safeAddGroup('ESPACE NÉCESSAIRE', m.modalitesEspace.join(' / '));
    if (m.modalitesConditions?.length) safeAddGroup('CONDITIONS', m.modalitesConditions.join(' / '));

    if (y + 14 > 278) { y = ensureSpace(pdf, y, 100, logo, masc, store, 'VISITE AVANT DEVIS SNIMOP'); y += 4; }
    pdf.setFontSize(8); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(30, 58, 138);
    pdf.text('CONTRAINTES HORAIRES :', cardX + 6, y);
    pdf.text('PERMIS REQUIS :', 105, y);
    pdf.setFont('helvetica', 'normal'); pdf.setTextColor(50, 58, 75);
    const hor = `Ouverture ${m.modalitesHeureOuverture || '-'} — Fermeture ${m.modalitesHeureFermeture || '-'}`;
    const perm = m.modalitesPermis?.length ? m.modalitesPermis.join(' / ') : 'Aucun';
    pdf.text(hor, cardX + 6, y + 5); pdf.text(perm, 105, y + 5);
    y += 14;

    if (m.modalitesStationnement?.length) safeAddGroup('STATIONNEMENT', m.modalitesStationnement.join(' / '));
    if (m.modalitesRisques) safeAddGroup('RISQUES IDENTIFIÉS', m.modalitesRisques);

    if (m.modalitesSignatureCharge) {
      if (y + 36 > 278) { y = ensureSpace(pdf, y, 100, logo, masc, store, 'VISITE AVANT DEVIS SNIMOP'); y += 4; }
      pdf.setFontSize(8); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(80, 90, 110);
      pdf.text("SIGNATURE CHARGÉ D'AFFAIRE :", cardX + 6, y);
      y += 4;
      pdf.addImage(m.modalitesSignatureCharge, 'PNG', cardX + 6, y, 70, 20);
      y += 26;
    }
  }

  // ── PHOTOS DE LA VISITE ──
  const visitePhotos = store.photos || [];
  if (visitePhotos.length > 0) {
    const hw = (p: jsPDF, l: any, m: any, s: any, title: string) => drawPageHeader(p, logo, masc, s, title);
    y = await renderPaginatedPhotos(pdf, visitePhotos, logo, masc, store, hw) || y;
  }

  // Signature step visite
  const sig = store.stepSignatures?.['visite'];
  y = ensureSpace(pdf, y, 50, logo, masc, store, 'VISITE AVANT DEVIS SNIMOP');
  drawSignatureBlock(pdf, sig, y, 'Visite Constat');

  addPagination(pdf);
  return pdf.output('blob');
};

// ─────────────────────────────────────────────
// PDF DEVIS
// ─────────────────────────────────────────────
export const generateDevisPdf = async (store: DossierData): Promise<Blob> => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const logo = await loadLogoBase64();
  const masc = await loadMascotteBase64();

  let y = drawPageHeader(pdf, logo, masc, store, 'DEVIS SNIMOP');

  if (store.resumeIntervention) {
    y = addSection(pdf, "RÉSUMÉ DE L'INTERVENTION", store.resumeIntervention, y);
  }
  y = addSection(pdf, 'SOLUTION PROPOSÉE', store.descriptifTravaux, y);
  y = addSection(pdf, 'MATÉRIEL FOURNI', store.devisMateriel, y);

  const yL = addSection(pdf, 'Main d\'œuvre', store.devisMo, y, 14, 85);
  const yR = addSection(pdf, 'Déplacement', store.devisDeplacement, y, 110, 85);
  y = Math.max(yL, yR);

  y = addSection(pdf, 'Options (Nacelle, etc.)', store.devisOptions, y);
  y = addSection(pdf, 'Réserves / Exclusions', store.reserves, y);
  y = addSection(pdf, 'Conditions de règlement', store.conditionsReglement, y);
  y = addSection(pdf, 'Délai de réalisation', store.delai, y);

  // CARTE VALEUR AJOUTÉE SNIMOP
  y = ensureSpace(pdf, y, 40, logo, masc, store, 'DEVIS SNIMOP');
  pdf.setFillColor(200, 208, 228);
  pdf.roundedRect(16.5, y + 1.5, 180, 36, 3, 3, 'F');
  pdf.setFillColor(248, 251, 255);
  pdf.setDrawColor(195, 210, 240);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(15, y, 180, 36, 3, 3, 'FD');
  pdf.setFontSize(8.5);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 58, 138);
  pdf.text('VALEUR AJOUTÉE SNIMOP', 20, y + 6);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(60, 70, 85);
  pdf.text('•  Réactivité garantie', 20, y + 12);
  pdf.text('•  Expertise technique confirmée', 20, y + 17);
  pdf.text('•  Matériel professionnel', 20, y + 22);
  pdf.text('•  Accompagnement client sur-mesure', 20, y + 27);

  pdf.setFont('helvetica', 'italic');
  pdf.text('Notre priorité : vous assurer une prestation de qualité, claire et durable.', 20, y + 33);
  y += 42;

  // Pagination intelligente : Garantir 100 d'espace (Financier + Signature ensemble)
  y = ensureSpace(pdf, y, 100, logo, masc, store, 'DEVIS SNIMOP');

  // ── BLOC FINANCIER PREMIUM ──
  const tauxHoraire = store.tauxHoraireMO || 65;
  const heures = store.heuresMO || 0;
  const moHT = tauxHoraire * heures;
  const dep = store.coutDeplacementHT || 0;
  const mat = store.coutMaterielHT || 0;
  const nacelle = store.nacelleActive ? (store.coutNacelleHT || 0) : 0;
  const autres = store.autresFraisHT || 0;
  const internalTotal = mat + moHT + dep + nacelle + autres;
  const marge = internalTotal * ((store.margePourcentage || 30) / 100);
  const baseHT = store.prixFinalManuel !== null && store.prixFinalManuel !== undefined
    ? Number(store.prixFinalManuel)
    : internalTotal + marge + (store.ajustementManuel || 0);
  const tva = baseHT * ((store.tvaPourcentage || 20) / 100);
  const ttc = baseHT + tva;

  y = ensureSpace(pdf, y, 70, logo, masc, store, 'DEVIS SNIMOP');
  y += 6;

  // Titre section CONDITIONS
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 58, 138);
  pdf.text('CONDITIONS FINANCIÈRES', 15, y);
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
  pdf.setFontSize(9.5); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(90, 95, 120);
  pdf.text('Montant HT :', 22, y + 13);
  pdf.setFont('helvetica', 'normal'); pdf.setTextColor(40, 45, 60);
  pdf.text(`${baseHT.toFixed(2)} €`, 80, y + 13);

  // TVA
  pdf.setFont('helvetica', 'bold'); pdf.setTextColor(90, 95, 120);
  pdf.text(`TVA (${store.tvaPourcentage || 20}%) :`, 22, y + 24);
  pdf.setFont('helvetica', 'normal'); pdf.setTextColor(40, 45, 60);
  pdf.text(`${tva.toFixed(2)} €`, 80, y + 24);

  // Trait séparateur
  pdf.setDrawColor(195, 210, 240); pdf.setLineWidth(0.4);
  pdf.line(22, y + 30, 192, y + 30);

  // TTC bandeau premium
  pdf.setFillColor(30, 58, 138);
  pdf.roundedRect(15, y + 33, 180, 22, 2, 2, 'F');
  pdf.setFontSize(11); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(255, 255, 255);
  pdf.text('TOTAL TTC :', 24, y + 47);
  pdf.setFontSize(14);
  pdf.text(`${ttc.toFixed(2)} €`, 192, y + 47, { align: 'right' });

  y += 62;

  // Acompte discret
  if (store.acompteDemande) {
    const acompte = ttc * ((store.acomptePourcentage || 30) / 100);
    pdf.setFontSize(8.5); pdf.setTextColor(70, 100, 180); pdf.setFont('helvetica', 'normal');
    pdf.text(`Acompte demandé (${store.acomptePourcentage}%) : ${acompte.toFixed(2)} €`, 22, y);
    y += 8;
  }
  y += 4;


  // Signature devis
  const sig = store.stepSignatures?.['devis'];
  y = ensureSpace(pdf, y, 50, logo, masc, store, 'DEVIS SNIMOP');
  drawSignatureBlock(pdf, sig, y, 'Devis');

  addPagination(pdf);
  return pdf.output('blob');
};

// ─────────────────────────────────────────────
// PDF BON D'INTERVENTION
// ─────────────────────────────────────────────
export const generateBonPdf = async (store: DossierData): Promise<Blob> => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const logo = await loadLogoBase64();
  const masc = await loadMascotteBase64();

  let y = drawPageHeader(pdf, logo, masc, store, "BON D'INTERVENTION SNIMOP");

  const hasHoraires = store.heureDebut || store.heureFin;
  let dateText = store.dateIntervention ? safeDateLong(store.dateIntervention) : 'Non renseignée';
  if (hasHoraires) {
    if (store.heureDebut && store.heureFin) dateText += ` de ${store.heureDebut} à ${store.heureFin}`;
    else if (store.heureDebut) dateText += ` à partir de ${store.heureDebut}`;
    else if (store.heureFin) dateText += ` jusqu'à ${store.heureFin}`;
  }

  y = addSection(pdf, "Date d'intervention prévue", dateText, y);
  y = addSection(pdf, 'SOLUTION PROPOSÉE', store.natureTravaux, y);
  y = addSection(pdf, 'MATÉRIEL FOURNI', store.materielPrevu, y);
  y = addSection(pdf, 'Consignes / Remarques', store.consignes, y);

  const sig = store.stepSignatures?.['intervention'];
  y = ensureSpace(pdf, y, 50, logo, masc, store, "BON D'INTERVENTION SNIMOP");
  drawSignatureBlock(pdf, sig, y, 'Bon Intervention');

  addPagination(pdf);
  return pdf.output('blob');
};

// ─────────────────────────────────────────────
// PDF RAPPORT D'INTERVENTION
// ─────────────────────────────────────────────
export const generateRapportPdf = async (store: DossierData): Promise<Blob> => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const logo = await loadLogoBase64();
  const masc = await loadMascotteBase64();

  let y = drawPageHeader(pdf, logo, masc, store, "COMPTE RENDU D'INTERVENTION");

  y = addSection(pdf, "Nature réelle de l'intervention", store.natureReelle, y);
  y = addSection(pdf, 'Travaux réalisés', store.travauxRealises, y);
  y = addSection(pdf, 'Matériel utilisé', store.materielUtilise, y);

  const tempsPasseStr = store.tempsPasse ? `${store.tempsPasse} heures` : '';
  let horaireStr = '';
  if (store.heureDebut && store.heureFin) horaireStr = `${store.heureDebut} - ${store.heureFin}`;
  else if (store.heureDebut) horaireStr = `À partir de ${store.heureDebut}`;

  const yL = addSection(pdf, 'Horaires et Durée', horaireStr ? `${horaireStr}${tempsPasseStr ? ' (' + tempsPasseStr + ')' : ''}` : tempsPasseStr, y, 14, 85);
  const yR = addSection(pdf, 'Anomalies constatées', store.anomalies, y, 110, 85);
  y = Math.max(yL, yR);

  y = addSection(pdf, 'Réserves', store.rapportReserves, y);
  y = addSection(pdf, 'Observations finales', store.observationsFinales, y);

  // ── PHOTOS DU RAPPORT ──
  const rapportPhotos = store.photos || [];
  if (rapportPhotos.length > 0) {
    const hw = (p: jsPDF, l: any, m: any, s: any, title: string) => drawPageHeader(p, logo, masc, s, title);
    y = await renderPaginatedPhotos(pdf, rapportPhotos, logo, masc, store, hw) || y;
  }

  const sig = store.stepSignatures?.['rapport'];
  y = ensureSpace(pdf, y, 50, logo, masc, store, "COMPTE RENDU D'INTERVENTION");
  drawSignatureBlock(pdf, sig, y, 'Rapport Final');

  addPagination(pdf);
  return pdf.output('blob');
};

// ─────────────────────────────────────────────
// PDF PHOTOS UNIQUEMENT
// ─────────────────────────────────────────────
export const generatePhotosPdf = async (store: DossierData): Promise<Blob> => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const logo = await loadLogoBase64();
  const masc = await loadMascotteBase64();

  if (!store.photos || store.photos.length === 0) {
    let y = drawPageHeader(pdf, logo, masc, store, 'DOCUMENTS & PHOTOS');
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(150, 150, 150);
    pdf.text('Aucune photo dans ce dossier.', 105, y + 20, { align: 'center' });
  } else {
    await renderPaginatedPhotos(pdf, store.photos, logo, masc, store, drawPageHeader);
  }

  addPagination(pdf);
  return pdf.output('blob');
};
