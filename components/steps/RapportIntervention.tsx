"use client";
import React, { useEffect } from 'react';
import { useDossierStore } from '@/store/useDossierStore';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export function RapportIntervention() {
  const store = useDossierStore();

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

  const handleNext = () => store.setField('currentStep', 6);
  const handlePrev = () => store.setField('currentStep', 4);

  return (
    <div className="flex flex-col gap-6 py-2">
      <h2 className="text-3xl md:text-4xl font-black border-b border-white/10 pb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-slate-200 tracking-widest uppercase drop-shadow-lg">
        Rapport d'intervention
      </h2>
      <p className="text-sm font-medium text-emerald-200 bg-emerald-900/30 backdrop-blur-md p-4 rounded-2xl border border-emerald-500/20 shadow-inner">
        Rapport final à faire signer au client en fin de mission.
      </p>
      
      <div className="bg-[#0f172a]/70 backdrop-blur-2xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-slate-700/50 flex flex-col gap-6">
        <Input label="Nature réelle de l'intervention" value={store.natureReelle} onChange={(e: any) => store.setField('natureReelle', e.target.value)} />
        <Textarea label="Travaux réalisés" value={store.travauxRealises} onChange={(e: any) => store.setField('travauxRealises', e.target.value)} placeholder="Décrire ce qui a été fait exactement" />
        <Textarea label="Matériel utilisé" value={store.materielUtilise} onChange={(e: any) => store.setField('materielUtilise', e.target.value)} />
        <Input label="Temps passé (heures)" type="number" step="0.5" value={store.tempsPasse} onChange={(e: any) => store.setField('tempsPasse', e.target.value)} placeholder="Ex: 4.5" />
        <Textarea label="Anomalies constatées" value={store.anomalies} onChange={(e: any) => store.setField('anomalies', e.target.value)} />
        <Textarea label="Réserves" value={store.rapportReserves} onChange={(e: any) => store.setField('rapportReserves', e.target.value)} />
        <Textarea label="Observations finales" value={store.observationsFinales} onChange={(e: any) => store.setField('observationsFinales', e.target.value)} />
      </div>

      <div className="flex justify-between mt-4">
        <Button variant="outline" onClick={handlePrev} className="px-6"><ArrowLeft className="w-5 h-5 mr-1" /> Retour</Button>
        <Button onClick={handleNext} className="px-10 text-lg">Finir <ArrowRight className="w-6 h-6 ml-1" /></Button>
      </div>
    </div>
  );
}
