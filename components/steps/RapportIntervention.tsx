"use client";
import React, { useEffect, useState } from 'react';
import { useDossierStore } from '@/store/useDossierStore';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ArrowRight, Download } from 'lucide-react';
import { PhotoManager } from '@/components/ui/PhotoManager';
import { StepSignatureZone } from '@/components/ui/StepSignatureZone';
import { generateRapportPdf, triggerDownload } from '@/utils/pdfGenerators';

export function RapportIntervention() {
  const store = useDossierStore();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await generateRapportPdf(store);
      triggerDownload(blob, `SNIMOP_Rapport_${store.numeroAffaire || 'SansRef'}.pdf`);
    } catch (e: any) {
      alert('Erreur export PDF Rapport : ' + (e.message || String(e)));
    } finally { setIsExporting(false); }
  };

  useEffect(() => {
    const state = useDossierStore.getState();
    if (!state.natureReelle && state.natureTravaux) {
      state.setField('natureReelle', state.natureTravaux);
    }
    if (!state.materielUtilise && state.materielPrevu) {
      state.setField('materielUtilise', state.materielPrevu);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-calcul de la durée
  useEffect(() => {
    if (store.heureDebut && store.heureFin) {
      const [sh, sm] = store.heureDebut.split(':').map(Number);
      const [eh, em] = store.heureFin.split(':').map(Number);
      if (!isNaN(sh) && !isNaN(sm) && !isNaN(eh) && !isNaN(em)) {
        let diffMinutes = (eh * 60 + em) - (sh * 60 + sm);
        if (diffMinutes < 0) diffMinutes += 24 * 60;
        const hoursFloat = diffMinutes / 60;
        const formatted = hoursFloat % 1 === 0 ? hoursFloat.toString() : hoursFloat.toFixed(2);
        store.setField('dureeReelle', formatted);
        store.setField('tempsPasse', formatted);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.heureDebut, store.heureFin]);

  const handleNext = () => store.setField('currentStep', 6);
  const handlePrev = () => store.setField('currentStep', 4);

  return (
    <div className="flex flex-col gap-6 py-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-slate-200 tracking-widest uppercase drop-shadow-lg">
          Rapport d'intervention
        </h2>
        <Button onClick={handleExport} isLoading={isExporting} variant="outline" className="gap-2 text-sm px-4 py-2 border-blue-500/30 text-blue-300 hover:bg-blue-600/10">
          <Download className="w-4 h-4" /> Exporter PDF Rapport
        </Button>
      </div>
      <p className="text-sm font-medium text-emerald-200 bg-emerald-900/30 backdrop-blur-md p-4 rounded-2xl border border-emerald-500/20 shadow-inner">
        Rapport final à faire signer au client en fin de mission.
      </p>
      
      <div className="bg-[#0f172a]/70 backdrop-blur-2xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-slate-700/50 flex flex-col gap-6">
        <Input label="Nature réelle de l'intervention" value={store.natureReelle} onChange={(e: any) => store.setField('natureReelle', e.target.value)} />
        <Textarea label="Travaux réalisés" value={store.travauxRealises} onChange={(e: any) => store.setField('travauxRealises', e.target.value)} placeholder="Décrire ce qui a été fait exactement" />
        <Textarea label="Matériel utilisé" value={store.materielUtilise} onChange={(e: any) => store.setField('materielUtilise', e.target.value)} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Heure d'arrivée" type="time" value={store.heureDebut} onChange={(e: any) => store.setField('heureDebut', e.target.value)} />
          <Input label="Heure de départ" type="time" value={store.heureFin} onChange={(e: any) => store.setField('heureFin', e.target.value)} />
          <Input label="Durée réelle (h)" type="number" step="0.25" value={store.dureeReelle || store.tempsPasse} onChange={(e: any) => { store.setField('dureeReelle', e.target.value); store.setField('tempsPasse', e.target.value); }} placeholder="Auto calcul ou manuel" />
        </div>
        <Textarea label="Anomalies constatées" value={store.anomalies} onChange={(e: any) => store.setField('anomalies', e.target.value)} />
        <Textarea label="Réserves" value={store.rapportReserves} onChange={(e: any) => store.setField('rapportReserves', e.target.value)} />
        <Textarea label="Observations finales" value={store.observationsFinales} onChange={(e: any) => store.setField('observationsFinales', e.target.value)} />
        
        <PhotoManager />
      </div>

      <StepSignatureZone stepKey="rapport" title="Rapport Final" />

      <div className="flex justify-between mt-4">
        <Button variant="outline" onClick={handlePrev} className="px-6"><ArrowLeft className="w-5 h-5 mr-1" /> Retour</Button>
        <Button onClick={handleNext} className="px-10 text-lg">Finir <ArrowRight className="w-6 h-6 ml-1" /></Button>
      </div>
    </div>
  );
}
