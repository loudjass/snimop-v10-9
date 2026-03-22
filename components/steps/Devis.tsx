"use client";
import React, { useEffect } from 'react';
import { useDossierStore } from '@/store/useDossierStore';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ArrowRight, Calculator, Euro } from 'lucide-react';
import { StepSignatureZone } from '@/components/ui/StepSignatureZone';

export function Devis() {
  const store = useDossierStore();

  useEffect(() => {
    const state = useDossierStore.getState();
    if (!state.descriptifTravaux && (state.travauxPreconises || state.constat)) {
      state.setField('descriptifTravaux', state.travauxPreconises || state.constat);
    }
    if (!state.devisMateriel && state.materielEnvisage) state.setField('devisMateriel', state.materielEnvisage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNext = () => store.setField('currentStep', 4);
  const handlePrev = () => store.setField('currentStep', 2);

  // --- CALCULS DU MOTEUR ---
  const totalMoHT = (store.tauxHoraireMO || 0) * (store.heuresMO || 0);
  const totalNacelleHT = store.nacelleActive ? (store.coutNacelleHT || 0) : 0;
  
  const coutTotalHT = 
    (store.coutMaterielHT || 0) + 
    totalMoHT + 
    (store.coutDeplacementHT || 0) + 
    totalNacelleHT + 
    (store.autresFraisHT || 0);

  const margeEuros = coutTotalHT * ((store.margePourcentage || 0) / 100);
  const prixConseilleHT = coutTotalHT + margeEuros;

  // Résolution du prix final
  const isEcrasementTotal = store.prixFinalManuel !== null && store.prixFinalManuel !== undefined && String(store.prixFinalManuel) !== '';
  const prixRetenuHT = isEcrasementTotal 
    ? Number(store.prixFinalManuel) 
    : prixConseilleHT + (store.ajustementManuel || 0);

  const tva = prixRetenuHT * ((store.tvaPourcentage || 0) / 100);
  const totalTTC = prixRetenuHT + tva;
  
  const acompteCalcule = store.acompteDemande ? totalTTC * ((store.acomptePourcentage || 0) / 100) : 0;

  return (
    <div className="flex flex-col gap-6 py-2">
      <h2 className="text-3xl md:text-4xl font-black border-b border-white/10 pb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-slate-200 tracking-widest uppercase drop-shadow-lg flex items-center gap-3">
        <Calculator className="w-8 h-8 md:w-10 md:h-10 text-blue-400" />
        Chiffrage & Devis
      </h2>
      
      {/* STRUCTURE DU DEVIS */}
      <div className="bg-[#0f172a]/70 backdrop-blur-2xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-slate-700/50 flex flex-col gap-6">
        <h3 className="text-xl font-bold text-blue-400 border-b border-slate-700 pb-2">1. Paramètres de la prestation</h3>
        
        <div className="flex flex-wrap gap-4">
          {['fourniture_pose', 'fourniture', 'pose'].map((type) => (
            <label key={type} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${store.prestationType === type ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>
              <input type="radio" name="prestation" value={type} checked={store.prestationType === type} onChange={(e) => store.setField('prestationType', e.target.value)} className="hidden" />
              <span className="font-semibold capitalize">{type.replace('_', ' + ')}</span>
            </label>
          ))}
        </div>

        <Textarea label="Descriptif des travaux" value={store.descriptifTravaux} onChange={(e: any) => store.setField('descriptifTravaux', e.target.value)} />
        <Textarea label="Détail du matériel prévu" value={store.devisMateriel} onChange={(e: any) => store.setField('devisMateriel', e.target.value)} />
      </div>

      {/* MOTEUR DE CHIFFRAGE */}
      <div className="bg-slate-900/80 backdrop-blur-2xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.6)] border border-indigo-500/30 flex flex-col gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        
        <h3 className="text-2xl font-black text-indigo-400 border-b border-slate-700 pb-2 flex items-center gap-2">
          <Euro className="w-6 h-6" /> 2. Calcul des coûts HT
        </h3>

        {/* Ligne 1: Matériel & MO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-3 p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50">
            <h4 className="font-bold text-slate-300 text-sm tracking-wider uppercase">Matériel</h4>
            <Input type="number" step="0.01" label="Coût global HT (€)" value={store.coutMaterielHT || ''} onChange={(e: any) => store.setField('coutMaterielHT', parseFloat(e.target.value) || 0)} />
          </div>

          <div className="flex flex-col gap-3 p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50">
            <h4 className="font-bold text-slate-300 text-sm tracking-wider uppercase flex justify-between">
              <span>Main d'œuvre</span>
              <span className="text-indigo-400">{totalMoHT.toFixed(2)} € HT</span>
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" step="1" label="Taux horaire (€)" value={store.tauxHoraireMO || ''} onChange={(e: any) => store.setField('tauxHoraireMO', parseFloat(e.target.value) || 0)} />
              <Input type="number" step="0.5" label="Heures" value={store.heuresMO || ''} onChange={(e: any) => store.setField('heuresMO', parseFloat(e.target.value) || 0)} />
            </div>
          </div>
        </div>

        {/* Ligne 2: Déplacement, Nacelle, Autres */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Input type="number" step="1" label="Déplacement HT (€)" value={store.coutDeplacementHT || ''} onChange={(e: any) => store.setField('coutDeplacementHT', parseFloat(e.target.value) || 0)} />
          
          <div className="flex flex-col gap-2 relative">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-1 cursor-pointer">
              <input type="checkbox" checked={store.nacelleActive} onChange={(e) => store.setField('nacelleActive', e.target.checked)} className="rounded bg-slate-800 border-slate-600 text-indigo-500" />
              Inclure Nacelle
            </label>
            <Input type="number" step="1" label="Coût Nacelle HT (€)" value={store.coutNacelleHT || ''} onChange={(e: any) => store.setField('coutNacelleHT', parseFloat(e.target.value) || 0)} disabled={!store.nacelleActive} />
          </div>

          <Input type="number" step="1" label="Autres frais HT (€)" value={store.autresFraisHT || ''} onChange={(e: any) => store.setField('autresFraisHT', parseFloat(e.target.value) || 0)} />
        </div>

        {/* SOUS-TOTAL COÛT DE REVIENT */}
        <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-xl border border-slate-800">
          <span className="text-lg font-medium text-slate-400">Coût total de revient HT :</span>
          <span className="text-2xl font-mono font-bold text-slate-200">{coutTotalHT.toFixed(2)} €</span>
        </div>

        {/* CONSTRUCTION DU PRIX DE VENTE */}
        <h3 className="text-xl font-bold text-indigo-400 border-b border-slate-700 pb-2 mt-4 flex items-center gap-2">
          3. Prix de Vente & Marge
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="flex flex-col gap-4 p-5 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-indigo-500/20 shadow-inner">
            <h4 className="font-bold text-slate-300">Mode A - Automatique</h4>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Input type="number" step="1" label="Marge cible (%)" value={store.margePourcentage || ''} onChange={(e: any) => store.setField('margePourcentage', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="mb-2 text-emerald-400 font-mono text-sm">+{margeEuros.toFixed(2)} €</div>
            </div>
            <div className="pt-3 mt-1 border-t border-slate-700 flex justify-between items-center text-slate-300">
              <span>Prix conseillé HT :</span>
              <span className="font-mono text-xl text-slate-100">{prixConseilleHT.toFixed(2)} €</span>
            </div>
          </div>

          <div className="flex flex-col gap-4 p-5 bg-slate-800/40 rounded-2xl border border-slate-700/50">
            <h4 className="font-bold text-slate-300 mb-1">Ajustements Manuels</h4>
            <Input type="number" step="1" label="Mode B : Ajustement (+ ou - en €)" value={store.ajustementManuel || ''} onChange={(e: any) => store.setField('ajustementManuel', parseFloat(e.target.value) || 0)} disabled={isEcrasementTotal} />
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-2 bg-[#0f172a] text-xs text-slate-500 uppercase font-bold tracking-widest">OU</span>
              </div>
            </div>

            <Input type="number" step="1" label="Mode C : Forcer prix final HT" value={store.prixFinalManuel !== null ? store.prixFinalManuel : ''} onChange={(e: any) => {
              const val = e.target.value === '' ? null : parseFloat(e.target.value);
              store.setField('prixFinalManuel', val);
            }} placeholder="Laisse vide pour l'auto" />
          </div>
        </div>

        {/* BLOC RÉSUMÉ FINAL */}
        <div className="mt-4 p-6 bg-indigo-950/40 border-2 border-indigo-500/50 rounded-3xl shadow-lg flex flex-col gap-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-indigo-500/30 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-xl text-indigo-200">Total retenu HT</span>
              {isEcrasementTotal ? (
                <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-xs font-bold uppercase border border-red-500/30">Mode Manuel</span>
              ) : store.ajustementManuel !== 0 ? (
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-bold uppercase border border-amber-500/30">Ajusté</span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase border border-emerald-500/30">Automatique</span>
              )}
            </div>
            <span className="text-3xl font-black font-mono text-white">{prixRetenuHT.toFixed(2)} €</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-2">
            <div className="flex items-center gap-4">
              <div className="flex-1 w-full">
                <Input type="number" step="0.1" label="TVA (%)" value={store.tvaPourcentage || ''} onChange={(e: any) => store.setField('tvaPourcentage', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="text-indigo-300/80 font-mono mt-4">+{tva.toFixed(2)} €</div>
            </div>
            <div className="flex justify-between items-center bg-indigo-600/20 p-4 rounded-xl border border-indigo-500/40">
              <span className="text-xl font-bold text-indigo-100">TOTAL TTC</span>
              <span className="text-3xl font-black font-mono text-indigo-400">{totalTTC.toFixed(2)} €</span>
            </div>
          </div>
        </div>
      </div>

      {/* OPTIONS ADDITIONNELLES */}
      <div className="bg-[#0f172a]/70 backdrop-blur-2xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-slate-700/50 flex flex-col gap-6">
        <h3 className="text-xl font-bold text-blue-400 border-b border-slate-700 pb-2">4. Conditions & Acompte</h3>
        
        <div className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl flex flex-col md:flex-row gap-6 items-center">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={store.acompteDemande} onChange={(e) => store.setField('acompteDemande', e.target.checked)} className="w-5 h-5 rounded text-blue-500 bg-slate-900 border-slate-600" />
            <span className="font-semibold text-slate-200">Demander un acompte</span>
          </label>
          {store.acompteDemande && (
            <div className="flex items-center gap-4 flex-1 w-full md:w-auto">
              <div className="w-32">
                <Input type="number" step="1" label="Préciser %" value={store.acomptePourcentage || ''} onChange={(e: any) => store.setField('acomptePourcentage', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="text-lg font-mono font-bold text-blue-300 mt-4">= {acompteCalcule.toFixed(2)} € TTC</div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Conditions de règlement" value={store.conditionsReglement} onChange={(e: any) => store.setField('conditionsReglement', e.target.value)} />
          <Input label="Délai de réalisation" value={store.delai} onChange={(e: any) => store.setField('delai', e.target.value)} placeholder="Ex: 2 semaines après accord" />
        </div>
        
        <Textarea label="Réserves / Exclusions" value={store.reserves} onChange={(e: any) => store.setField('reserves', e.target.value)} />
        
        <label className="flex items-center gap-3 mt-2 p-4 border border-white/10 rounded-2xl bg-slate-800/40 cursor-pointer hover:bg-slate-700/50 transition-all shadow-inner">
          <input type="checkbox" checked={store.bonPourAccord} onChange={(e) => store.setField('bonPourAccord', e.target.checked)} className="w-5 h-5 text-blue-500 rounded border-slate-600 focus:ring-blue-500 bg-slate-900" />
          <span className="font-bold text-slate-200">Inclure la mention "Bon pour accord"</span>
        </label>
      </div>

      <StepSignatureZone stepKey="devis" title="Devis" />

      <div className="flex justify-between mt-4">
        <Button variant="outline" onClick={handlePrev} className="px-6"><ArrowLeft className="w-5 h-5 mr-1" /> Retour</Button>
        <Button onClick={handleNext} className="px-10 text-lg">Suivant <ArrowRight className="w-6 h-6 ml-1" /></Button>
      </div>
    </div>
  );
}
