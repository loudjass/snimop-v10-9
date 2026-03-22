"use client";
import React from 'react';
import { useDossierStore } from '@/store/useDossierStore';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ArrowRight, Download } from 'lucide-react';
import { PhotoManager } from '@/components/ui/PhotoManager';
import { StepSignatureZone } from '@/components/ui/StepSignatureZone';

export function VisiteAvantDevis() {
  const store = useDossierStore();

  const handleNext = () => store.setField('currentStep', 3);
  const handlePrev = () => store.setField('currentStep', 1);

  return (
    <div className="flex flex-col gap-6 py-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-slate-200 tracking-widest uppercase drop-shadow-lg">
          Visite avant devis
        </h2>
      </div>
      
      <div className="bg-[#0f172a]/70 backdrop-blur-2xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-slate-700/50 flex flex-col gap-6">
        <Textarea label="Contexte / Demande client" value={store.contexte} onChange={(e: any) => store.setField('contexte', e.target.value)} placeholder="Ex: Panne signalée..." />
        <Textarea label="Constat sur place" value={store.constat} onChange={(e: any) => store.setField('constat', e.target.value)} placeholder="Ce qui a été observé" />
        <Input label="Équipement concerné" value={store.equipement} onChange={(e: any) => store.setField('equipement', e.target.value)} placeholder="Machine, modèle, réf" />
        <Textarea label="Observations" value={store.observations} onChange={(e: any) => store.setField('observations', e.target.value)} />
        <Textarea label="Travaux à réaliser" value={store.travauxPreconises} onChange={(e: any) => store.setField('travauxPreconises', e.target.value)} placeholder="Actions à mener" />
        <Textarea label="Matériel nécessaire" value={store.materielEnvisage} onChange={(e: any) => store.setField('materielEnvisage', e.target.value)} placeholder="Liste du matériel nécessaire" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Main d'œuvre estimée" value={store.moEstimee} onChange={(e: any) => store.setField('moEstimee', e.target.value)} placeholder="Ex: 4 heures" />
          <Input label="Déplacement" value={store.deplacement} onChange={(e: any) => store.setField('deplacement', e.target.value)} placeholder="Ex: Forfait Zone 1" />
        </div>
        
        <div className="flex flex-col gap-1.5 mt-2">
          <label className="text-sm font-bold text-slate-300 ml-1">Option nacelle</label>
          <select 
            className="px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-slate-900/60 backdrop-blur-sm border border-white/10 text-white font-medium w-full shadow-inner"
            value={store.optionNacelle}
            onChange={(e) => store.setField('optionNacelle', e.target.value)}
          >
            <option value="" className="bg-slate-800 text-white">Non préconisé</option>
            <option value="Oui" className="bg-slate-800 text-white">Oui</option>
            <option value="À charge du client" className="bg-slate-800 text-white">À charge du client</option>
            <option value="Fournie par SNIMOP" className="bg-slate-800 text-white">Fournie par SNIMOP</option>
          </select>
        </div>

        <Textarea label="Remarques complémentaires" value={store.remarques} onChange={(e: any) => store.setField('remarques', e.target.value)} />

        <PhotoManager />
      </div>

      <StepSignatureZone stepKey="visite" title="Visite Constat" />

      <div className="flex justify-between mt-4">
        <Button variant="outline" onClick={handlePrev} className="px-6"><ArrowLeft className="w-5 h-5 mr-1" /> Retour</Button>
        <Button onClick={handleNext} className="px-10 text-lg">Suivant <ArrowRight className="w-6 h-6 ml-1" /></Button>
      </div>
    </div>
  );
}
