"use client";
import React, { useState, useEffect } from 'react';
import { useDossierStore } from '@/store/useDossierStore';
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

// Helper functions for loading assets
const loadLogoBase64 = async (): Promise<{img: HTMLImageElement, ratio: number} | null> => {
  try {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ img, ratio: img.width / img.height });
      img.onerror = () => {
         console.error("ERREUR LOGO: Impossible de lire les dimensions.");
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

  const generatePdfBlob = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const logoData = await loadLogoBase64();
    const mascotteData = await loadMascotteBase64();
    
    const photoPromises = (store.photos || []).map(p => loadPhotoBase64(p.imageBase64, p.type, p.title, p.timestamp));
    const loadedPhotosResult = await Promise.all(photoPromises);
    const validPhotos = loadedPhotosResult.filter(p => p !== null) as any[];

    // --- PAGE DE GARDE ---
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, 210, 297, 'F');
    let coverY = 25;
    if (logoData && logoData.img) {
      const targetWidth = 125;
      const targetHeight = targetWidth / logoData.ratio; 
      pdf.addImage(logoData.img, 'PNG', (210 - targetWidth) / 2, coverY, targetWidth, targetHeight);
      coverY += targetHeight + 15;
    }
    pdf.setTextColor(30, 58, 138);
    pdf.setFontSize(30); pdf.setFont("helvetica", "bold");
    pdf.text("DOSSIER D'INTERVENTION", 105, coverY, { align: 'center' });
    coverY += 8; pdf.line(60, coverY, 150, coverY);
    coverY += 15; pdf.setTextColor(100, 100, 100); pdf.setFontSize(16);
    pdf.text(`Dossier N° ${store.numeroAffaire || 'Non renseigné'}`, 105, coverY, { align: 'center' });
    coverY += 10; pdf.setFont("helvetica", "normal");
    pdf.text(`Édité le ${getSafeDateFormatted(store.date)}`, 105, coverY, { align: 'center' });

    // Client/Site Blocks (Simplified for consistency here, using logic from ExportFinal)
    const drawBlock = (title: string, content: string, y: number) => {
      pdf.setFillColor(250, 251, 255); pdf.setDrawColor(30, 58, 138); pdf.setLineWidth(0.3);
      pdf.roundedRect(25, y, 160, 40, 3, 3, 'FD'); 
      pdf.setTextColor(30, 58, 138); pdf.setFontSize(14); pdf.setFont("helvetica", "bold");
      pdf.text(title, 35, y + 10);
      pdf.setTextColor(40, 40, 40); pdf.setFont("helvetica", "normal"); pdf.setFontSize(12);
      pdf.text(pdf.splitTextToSize(content, 140), 40, y + 18);
    };

    drawBlock("CLIENT", `Nom : ${store.client || '-'}\nContact : ${store.contact || '-'}\nTél : ${store.telephone || '-'}\nEmail : ${store.email || '-'}`, coverY + 25);
    drawBlock("CHANTIER", `Site : ${store.site || '-'}\nAdresse : ${store.adresse || '-'}\nTechnicien : ${store.technicien || '-'}`, coverY + 75);

    // --- REUSE HELPERS FROM ExportFinal ---
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
      const cy = (pdf as any).getY ? (pdf as any).getY() : 60;
      pdf.setFontSize(11); pdf.setFont("helvetica", "bold"); pdf.setTextColor(30, 58, 138);
      pdf.text(title.toUpperCase(), 14, cy);
      pdf.setFont("helvetica", "normal"); pdf.setTextColor(60, 60, 60);
      const lines = pdf.splitTextToSize(String(content || 'Non renseigné'), 182);
      pdf.text(lines, 14, cy + 7);
      const fy = cy + 7 + (lines.length * 6) + 10;
      if ((pdf as any).setY) (pdf as any).setY(fy);
      return fy;
    };
    
    const addSectionAt = (title: string, content: any, x: number, y: number, half: boolean) => {
      pdf.setFontSize(11); pdf.setFont("helvetica", "bold"); pdf.setTextColor(30, 58, 138);
      pdf.text(title.toUpperCase(), x, y);
      pdf.setFont("helvetica", "normal"); pdf.setTextColor(60, 60, 60);
      const lines = pdf.splitTextToSize(String(content || 'Non renseigné'), half ? 85 : 182);
      pdf.text(lines, x, y + 7);
      return y + 7 + (lines.length * 6) + 10;
    };

    const addStepSignature = (step: string, title: string) => {
      const sig = store.stepSignatures?.[step];
      if (!sig) return;
      const sy = (pdf as any).getY ? (pdf as any).getY() : 240;
      pdf.setFontSize(9); pdf.setTextColor(150, 150, 150);
      pdf.text(`Validé par ${sig.technicienNom || '-'} le ${new Date(sig.dateSignature).toLocaleDateString()}`, 14, sy);
      if (sig.technicienSignature) pdf.addImage(sig.technicienSignature, 'PNG', 14, sy + 2, 35, 12);
      pdf.text(`Client : ${sig.clientNom || '-'}`, 110, sy);
      if (sig.clientSignature) pdf.addImage(sig.clientSignature, 'PNG', 110, sy + 2, 35, 12);
    };

    // Draw all sections for global export
    drawInformationsSection(pdf, store, drawHeader, addSection, addSectionAt, addStepSignature);
    drawVisiteSection(pdf, store, drawHeader, addSection, addSectionAt, addStepSignature);
    drawDevisSection(pdf, store, drawHeader, addSection, addStepSignature);
    drawInterventionSection(pdf, store, drawHeader, addSection, addStepSignature);
    drawRapportSection(pdf, store, drawHeader, addSection, addSectionAt, addStepSignature);

    return pdf.output('blob');
  };

  const generateSpecificPdfBlob = async (type: string) => {
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
        const cy = (pdf as any).getY ? (pdf as any).getY() : 60;
        pdf.setFontSize(11); pdf.setFont("helvetica", "bold"); pdf.setTextColor(30, 58, 138);
        pdf.text(title.toUpperCase(), 14, cy);
        pdf.setFont("helvetica", "normal"); pdf.setTextColor(60, 60, 60);
        const lines = pdf.splitTextToSize(String(content || 'Non renseigné'), 182);
        pdf.text(lines, 14, cy + 7);
        const fy = cy + 7 + (lines.length * 6) + 10;
        if ((pdf as any).setY) (pdf as any).setY(fy);
        return fy;
    };

    const addSectionAt = (title: string, content: any, x: number, y: number, half: boolean) => {
        pdf.setFontSize(11); pdf.setFont("helvetica", "bold"); pdf.setTextColor(30, 58, 138);
        pdf.text(title.toUpperCase(), x, y);
        pdf.setFont("helvetica", "normal"); pdf.setTextColor(60, 60, 60);
        const lines = pdf.splitTextToSize(String(content || 'Non renseigné'), half ? 85 : 182);
        pdf.text(lines, x, y + 7);
        return y + 7 + (lines.length * 6) + 10;
    };

    const addStepSignature = (step: string, title: string) => {
        const sig = store.stepSignatures?.[step];
        if (!sig) return;
        const sy = (pdf as any).getY ? (pdf as any).getY() : 240;
        pdf.setFontSize(9); pdf.setTextColor(150, 150, 150);
        pdf.text(`Validé par ${sig.technicienNom || '-'} le ${new Date(sig.dateSignature).toLocaleDateString()}`, 14, sy);
        if (sig.technicienSignature) pdf.addImage(sig.technicienSignature, 'PNG', 14, sy + 2, 35, 12);
        pdf.text(`Client : ${sig.clientNom || '-'}`, 110, sy);
        if (sig.clientSignature) pdf.addImage(sig.clientSignature, 'PNG', 110, sy + 2, 35, 12);
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
  };

  useEffect(() => {
    (window as any).triggerSpecificPDF = async (type: string) => {
      try {
        setIsGenerating(true);
        const blob = await generateSpecificPdfBlob(type);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `SNIMOP_${type.toUpperCase()}_${store.numeroAffaire || 'REF'}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
      } catch (e) {
        alert("Erreur lors de l'export individuel.");
      } finally {
        setIsGenerating(false);
      }
    };

    (window as any).triggerGlobalPDF = async () => {
        try {
          setIsGenerating(true);
          const blob = await generatePdfBlob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `SNIMOP_Dossier_Complet_${store.numeroAffaire || 'REF'}.pdf`;
          link.click();
          URL.revokeObjectURL(url);
        } catch (e) {
          alert("Erreur lors de l'export global.");
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
        <p className="text-white font-black uppercase tracking-widest animate-pulse">Génération du PDF en cours...</p>
      </div>
    );
  }

  return null;
};
