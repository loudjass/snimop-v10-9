"use client";
import React, { useEffect } from 'react';
import { useDossierStore } from '@/store/useDossierStore';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export function Devis() {
  const store = useDossierStore();

  useEffect(() => {
    const state = useDossierStore.getState();
    if (!state.descriptifTravaux && (state.travauxPreconises || state.constat)) {
      state.setField('descriptifTravaux', state.travauxPreconises || state.constat);
    }
    if (!state.devisMateriel && state.materielEnvisage) state.setField('devisMateriel', state.materielEnvisage);
    if (!state.devisMo && state.moEstimee) state.setField('devisMo', state.moEstimee);
    if (!state.devisDeplacement && state.deplacement) state.setField('devisDeplacement', state.deplacement);
    if (!state.devisOptions && state.optionNacelle) state.setField('devisOptions', state.optionNacelle);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNext = () => store.setField('currentStep', 4);
  const handlePrev = () => store.setField('currentStep', 2);

  return (
    <div className="flex flex-col gap-6 py-2">
      <h2 className="text-3xl md:text-4xl font-black border-b border-white/10 pb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-slate-200 tracking-widest uppercase drop-shadow-lg">
        Devis
      </h2>
      
      <p className="text-sm font-medium text-blue-200 bg-blue-900/30 backdrop-blur-md p-4 rounded-2xl border border-blue-500/20 shadow-inner">
        Les champs ont été préremplis avec les données de la visite. Vous pouvez les modifier.
      </p>
      
      <div className="bg-[#0f172a]/70 backdrop-blur-2xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-slate-700/50 flex flex-col gap-6">
        <Textarea label="Descriptif des travaux" value={store.descriptifTravaux} onChange={(e: any) => store.setField('descriptifTravaux', e.target.value)} />
        <Textarea label="Matériel" value={store.devisMateriel} onChange={(e: any) => store.setField('devisMateriel', e.target.value)} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Main d'œuvre" value={store.devisMo} onChange={(e: any) => store.setField('devisMo', e.target.value)} />
          <Input label="Déplacement" value={store.devisDeplacement} onChange={(e: any) => store.setField('devisDeplacement', e.target.value)} />
        </div>
        
        <Input label="Options (ex: Nacelle)" value={store.devisOptions} onChange={(e: any) => store.setField('devisOptions', e.target.value)} />
        <Textarea label="Réserves / Exclusions" value={store.reserves} onChange={(e: any) => store.setField('reserves', e.target.value)} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Conditions de règlement" value={store.conditionsReglement} onChange={(e: any) => store.setField('conditionsReglement', e.target.value)} />
          <Input label="Délai de réalisation" value={store.delai} onChange={(e: any) => store.setField('delai', e.target.value)} placeholder="Ex: 2 semaines après accord" />
        </div>
        
        <label className="flex items-center gap-3 mt-4 p-4 border border-white/10 rounded-2xl bg-slate-800/40 cursor-pointer hover:bg-slate-700/50 transition-all shadow-inner backdrop-blur-sm">
          <input 
            type="checkbox" 
            checked={store.bonPourAccord} 
            onChange={(e) => store.setField('bonPourAccord', e.target.checked)}
            className="w-5 h-5 text-blue-500 rounded border-slate-600 focus:ring-blue-500 bg-slate-900"
          />
          <span className="font-bold text-slate-200">Inclure la mention "Bon pour accord"</span>
        </label>
      </div>

      <div className="flex justify-between mt-4">
        <Button variant="outline" onClick={handlePrev} className="px-6"><ArrowLeft className="w-5 h-5 mr-1" /> Retour</Button>
        <Button onClick={handleNext} className="px-10 text-lg">Suivant <ArrowRight className="w-6 h-6 ml-1" /></Button>
      </div>
    </div>
  );
}
