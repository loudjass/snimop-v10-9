"use client";
import React, { useState } from 'react';
import { useDossierStore } from '@/store/useDossierStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SignaturePad } from '@/components/SignaturePad';
import { ArrowLeft, Download, Share2, CheckCircle, MessageCircle, Mail } from 'lucide-react';

export function ExportFinal() {
  const store = useDossierStore();
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleDownload = async () => {
    (window as any).triggerGlobalPDF?.();
  };

  const handleWhatsApp = async () => {
    (window as any).triggerGlobalPDF?.();
    // WhatsApp logic could be added here if needed, but triggerGlobalPDF handles download.
    // The user usually wants the PDF downloaded first.
    const cleanPhone = (store.telephone || '').replace(/\s+/g, '').replace(/^0/, '33');
    if (cleanPhone) {
      const msg = encodeURIComponent("Bonjour, voici votre dossier SNIMOP.");
      setTimeout(() => window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank'), 1000);
    }
  };

  const handleEmail = async () => {
    (window as any).triggerGlobalPDF?.();
    const mail = store.email || '';
    if (mail) {
      const sub = encodeURIComponent("Dossier SNIMOP");
      setTimeout(() => window.location.href = `mailto:${mail}?subject=${sub}`, 1000);
    }
  };

  return (
    <div className="flex flex-col gap-6 py-2">
      <h2 className="text-3xl md:text-4xl font-black border-b border-white/10 pb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-slate-200 tracking-widest uppercase drop-shadow-lg">
        Export du dossier
      </h2>
      <div className="bg-[#0f172a]/70 backdrop-blur-2xl p-6 rounded-3xl shadow-[0_8px_30_rgb(0,0,0,0.4)] border border-slate-700/50 flex flex-col gap-8 mt-2">
        <div className="border border-slate-300 rounded-3xl p-6 bg-slate-50 shadow-inner flex flex-col gap-5 relative overflow-hidden">
          <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-blue-500 to-green-500 left-0" />
          <h3 className="font-black flex items-center gap-2 text-xl text-slate-800 uppercase tracking-wide">
            <CheckCircle className="w-6 h-6 text-green-500" />
            Validation Finale
          </h3>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <Input 
              label="Nom du signataire" 
              className="!bg-transparent child-input-light border-0 px-2 text-slate-800"
              value={store.nomSignataireClient || store.contact || store.client || ''} 
              onChange={(e: any) => store.setField('nomSignataireClient', e.target.value)} 
            />
          </div>
          <SignaturePad 
            initialDataUrl={store.signatureClient} 
            onSave={(url) => store.setField('signatureClient', url)} 
          />
        </div>
        <div className="flex flex-col gap-4 mt-2">
          <Button onClick={handleDownload} className="py-5 text-xl tracking-wide">
            <Download className="w-6 h-6 mr-2" />
            Télécharger le Dossier PDF
          </Button>
          <Button onClick={handleWhatsApp} variant="secondary" className="py-4 text-lg text-green-400 hover:bg-green-500/10">
            <MessageCircle className="w-5 h-5 mr-2" />
            Envoyer via WhatsApp
          </Button>
          <Button onClick={handleEmail} variant="secondary" className="py-4 text-lg text-blue-300 hover:bg-blue-800/20">
            <Mail className="w-5 h-5 mr-2" />
            Envoyer via E-mail
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
