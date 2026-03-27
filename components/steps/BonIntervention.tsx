"use client";
import React, { useEffect, useState } from 'react';
import { useDossierStore } from '@/store/useDossierStore';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ArrowRight, Download } from 'lucide-react';
import { StepSignatureZone } from '@/components/ui/StepSignatureZone';
import { generateBonPdf, triggerDownload } from '@/utils/pdfGenerators';

export function BonIntervention() {
  const store = useDossierStore();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await generateBonPdf(store);
      triggerDownload(blob, `SNIMOP_BonIntervention_${store.numeroAffaire || 'SansRef'}.pdf`);
    } catch (e: any) {
      alert('Erreur export PDF Bon : ' + (e.message || String(e)));
    } finally { setIsExporting(false); }
  };

  useEffect(() => {
    const state = useDossierStore.getState();
    if (!state.materielPrevu && (state.devisMateriel || state.materielEnvisage)) {
      state.setField('materielPrevu', state.devisMateriel || state.materielEnvisage);
    }
    if (!state.natureTravaux && (state.descriptifTravaux || state.travauxPreconises)) {
      state.setField('natureTravaux', state.descriptifTravaux || state.travauxPreconises);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNext = () => store.setField('currentStep', 5);
  const handlePrev = () => store.setField('currentStep', 3);

  return (
    <div className="flex flex-col gap-6 py-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-slate-200 tracking-widest uppercase drop-shadow-lg">
          Bon d'intervention
        </h2>
        <Button onClick={handleExport} isLoading={isExporting} variant="outline" className="gap-2 text-sm px-4 py-2 border-blue-500/30 text-blue-300 hover:bg-blue-600/10">
          <Download className="w-4 h-4" /> Exporter PDF Bon
        </Button>
      </div>
      <p className="text-sm font-medium text-blue-200 bg-blue-900/30 backdrop-blur-md p-4 rounded-2xl border border-blue-500/20 shadow-inner">
        Les informations ont été récupérées du devis / visite.
      </p>
      
      <div className="bg-[#0f172a]/70 backdrop-blur-2xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-slate-700/50 flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Date d'intervention prévue" type="date" value={store.dateIntervention} onChange={(e: any) => store.setField('dateIntervention', e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Heure d'arrivée" type="time" value={store.heureDebut} onChange={(e: any) => store.setField('heureDebut', e.target.value)} />
            <Input label="Heure de départ" type="time" value={store.heureFin} onChange={(e: any) => store.setField('heureFin', e.target.value)} />
          </div>
        </div>
        <Textarea label="Nature des travaux à réaliser" value={store.natureTravaux} onChange={(e: any) => store.setField('natureTravaux', e.target.value)} />
        <Textarea label="Matériel prévu" value={store.materielPrevu} onChange={(e: any) => store.setField('materielPrevu', e.target.value)} />
        <Textarea label="Consignes / Remarques de préparation" value={store.consignes} onChange={(e: any) => store.setField('consignes', e.target.value)} />
      </div>

      <StepSignatureZone stepKey="intervention" title="Intervention" />

      <div className="flex justify-between mt-4">
        <Button variant="outline" onClick={handlePrev} className="px-6"><ArrowLeft className="w-5 h-5 mr-1" /> Retour</Button>
        <Button onClick={handleNext} className="px-10 text-lg">Suivant <ArrowRight className="w-6 h-6 ml-1" /></Button>
      </div>
    </div>
  );
}
