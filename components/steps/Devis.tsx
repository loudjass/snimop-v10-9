"use client";
import React, { useEffect } from 'react';
import { useDossierStore } from '@/store/useDossierStore';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ArrowRight, Calculator, Euro, Hammer, HardHat, Truck, Receipt, Zap, Eye, Settings2 } from 'lucide-react';
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

  const toggleModeRapide = () => store.setField('devisModeRapide', !store.devisModeRapide);

  // --- CALCULS DU MOTEUR ---
  const totalMoHT = (store.tauxHoraireMO || 0) * (store.heuresMO || 0);
  const totalNacelleHT = (!store.devisModeRapide && store.nacelleActive) ? (store.coutNacelleHT || 0) : 0;
  const depHT = !store.devisModeRapide ? (store.coutDeplacementHT || 0) : 0;
  const autresHT = !store.devisModeRapide ? (store.autresFraisHT || 0) : 0;
  
  const coutTotalHT = (store.coutMaterielHT || 0) + totalMoHT + depHT + totalNacelleHT + autresHT;

  const margeEuros = coutTotalHT * ((store.margePourcentage || 0) / 100);
  const prixConseilleHT = coutTotalHT + margeEuros;

  const margeColor = store.margePourcentage >= 30 ? 'text-emerald-400' : store.margePourcentage >= 15 ? 'text-blue-400' : 'text-orange-400';
  const margeBg = store.margePourcentage >= 30 ? 'bg-emerald-500/10 border-emerald-500/30' : store.margePourcentage >= 15 ? 'bg-blue-500/10 border-blue-500/30' : 'bg-orange-500/10 border-orange-500/30';

  // Résolution du prix final
  const isEcrasementTotal = store.prixFinalManuel !== null && store.prixFinalManuel !== undefined && String(store.prixFinalManuel) !== '';
  const prixRetenuHT = isEcrasementTotal 
    ? Number(store.prixFinalManuel) 
    : prixConseilleHT + (store.ajustementManuel || 0);

  const tva = prixRetenuHT * ((store.tvaPourcentage || 0) / 100);
  const totalTTC = prixRetenuHT + tva;
  
  const acompteCalcule = store.acompteDemande ? totalTTC * ((store.acomptePourcentage || 0) / 100) : 0;

  return (
    <div className="flex flex-col gap-8 py-4">
      
      {/* HEADER & TOGGLE */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b border-white/10 pb-4">
        <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-slate-200 tracking-widest uppercase drop-shadow-lg flex items-center gap-3">
          <Calculator className="w-8 h-8 md:w-10 md:h-10 text-blue-400" />
          Chiffrage
        </h2>
        <Button 
          variant={store.devisModeRapide ? "default" : "outline"} 
          onClick={toggleModeRapide}
          className={`gap-2 font-bold px-6 py-5 rounded-xl shadow-lg transition-all ${store.devisModeRapide ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white border-none scale-105' : 'hover:bg-slate-800 text-slate-300'}`}
        >
          <Zap className={`w-5 h-5 ${store.devisModeRapide ? 'animate-pulse text-yellow-200' : 'text-slate-400'}`} />
          {store.devisModeRapide ? "MODE RAPIDE CHANTIER" : "Activer le Mode Rapide"}
        </Button>
      </div>

      {/* RÉSUMÉ RAPIDE TERRAIN */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-600/50 p-6 shadow-xl flex flex-col gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
        <h3 className="text-lg font-black text-slate-200 flex items-center gap-2 border-b border-slate-700 pb-3 uppercase tracking-wider">
          <Eye className="w-5 h-5 text-blue-400" /> Résumé du chiffrage
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mt-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Type</span>
            <span className="font-black text-blue-300 capitalize text-lg leading-tight truncate">{store.prestationType?.replace('_', ' + ') || 'Non défini'}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Temps estimé</span>
            <span className="font-black text-slate-200 text-lg leading-tight">{store.heuresMO || 0} h</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Matériel</span>
            <span className="font-black text-slate-200 text-lg leading-tight">{(store.coutMaterielHT || 0).toFixed(2)} €</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total TTC Calculé</span>
            <span className="font-black text-slate-200 text-lg leading-tight">{totalTTC.toFixed(2)} €</span>
          </div>
          <div className="flex flex-col gap-1 p-2 -my-2 bg-blue-500/10 rounded-xl border border-blue-500/20 justify-center">
            <span className="text-xs font-black text-blue-300 uppercase tracking-wider text-center">Prix Retenu HT</span>
            <span className="font-black text-white text-2xl text-center drop-shadow-md">{prixRetenuHT.toFixed(2)} €</span>
          </div>
        </div>
      </div>
      
      {/* PARAMÈTRES PRESTATION */}
      {!store.devisModeRapide && (
        <div className="bg-[#0f172a]/70 backdrop-blur-2xl p-6 md:p-8 rounded-3xl shadow-xl border border-slate-700/50 flex flex-col gap-6">
          <h3 className="text-xl font-bold text-indigo-300 border-b border-slate-700 pb-2 flex items-center gap-2">
            <Settings2 className="w-5 h-5" /> 1. Détails du Projet
          </h3>
          
          <div className="flex flex-wrap gap-4">
            {['fourniture_pose', 'fourniture', 'pose'].map((type) => (
              <label key={type} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${store.prestationType === type ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-inner' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>
                <input type="radio" name="prestation" value={type} checked={store.prestationType === type} onChange={(e) => store.setField('prestationType', e.target.value)} className="hidden" />
                <span className="font-black uppercase tracking-wide text-sm">{type.replace('_', ' + ')}</span>
              </label>
            ))}
          </div>

          <Textarea label="Descriptif des travaux" value={store.descriptifTravaux} onChange={(e: any) => store.setField('descriptifTravaux', e.target.value)} />
          <Textarea label="Détail du matériel prévu" value={store.devisMateriel} onChange={(e: any) => store.setField('devisMateriel', e.target.value)} />
        </div>
      )}

      {/* MOTEUR DE CHIFFRAGE */}
      <div className="bg-slate-900/80 backdrop-blur-2xl p-6 md:p-8 rounded-3xl shadow-[0_10px_40px_rgb(0,0,0,0.5)] border border-blue-500/30 flex flex-col gap-8 relative overflow-hidden">
        
        <h3 className="text-2xl font-black text-blue-400 border-b border-slate-700 pb-2 flex items-center gap-3">
          <Euro className="w-6 h-6" /> 2. Calcul des Coûts HT
        </h3>

        {/* Ligne 1: Matériel & MO */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col gap-4 p-5 bg-slate-800/40 rounded-2xl border border-slate-700/50 hover:border-slate-500 transition-colors shadow-inner">
            <h4 className="font-black text-slate-200 text-sm tracking-widest uppercase flex items-center gap-2">
              <Hammer className="w-5 h-5 text-blue-400 drop-shadow-md" /> Coût Matériel
            </h4>
            <Input type="number" step="0.01" label="Montant global HT (€)" value={store.coutMaterielHT || ''} onChange={(e: any) => store.setField('coutMaterielHT', parseFloat(e.target.value) || 0)} />
          </div>

          <div className="flex flex-col gap-4 p-5 bg-slate-800/40 rounded-2xl border border-slate-700/50 hover:border-slate-500 transition-colors shadow-inner">
            <h4 className="font-black text-slate-200 text-sm tracking-widest uppercase flex items-center justify-between">
              <div className="flex items-center gap-2"><HardHat className="w-5 h-5 text-blue-400 drop-shadow-md" /> Main d'œuvre</div>
              <span className="text-blue-300 bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20 shadow-inner">{totalMoHT.toFixed(2)} € HT</span>
            </h4>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <Input type="number" step="1" label="Taux horaire (€)" value={store.tauxHoraireMO || ''} onChange={(e: any) => store.setField('tauxHoraireMO', parseFloat(e.target.value) || 0)} />
              <Input type="number" step="0.5" label="Heures" value={store.heuresMO || ''} onChange={(e: any) => store.setField('heuresMO', parseFloat(e.target.value) || 0)} />
            </div>
          </div>
        </div>

        {/* Ligne 2: Déplacement, Nacelle, Autres (Caché en Mode Rapide) */}
        {!store.devisModeRapide && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-700/50">
            <div className="flex gap-2 items-center">
              <Truck className="w-8 h-8 text-slate-500 mb-2" />
              <div className="flex-1 w-full">
                <Input type="number" step="1" label="Déplacement HT (€)" value={store.coutDeplacementHT || ''} onChange={(e: any) => store.setField('coutDeplacementHT', parseFloat(e.target.value) || 0)} />
              </div>
            </div>
            
            <div className="flex flex-col gap-2 p-3 bg-slate-800/30 rounded-xl border border-slate-700/50">
              <label className="flex items-center gap-2 text-sm font-bold tracking-wide text-slate-300 mb-1 cursor-pointer">
                <input type="checkbox" checked={store.nacelleActive} onChange={(e) => store.setField('nacelleActive', e.target.checked)} className="w-5 h-5 rounded bg-slate-800 border-slate-500 text-blue-500" />
                Inclure Option Nacelle
              </label>
              <Input type="number" step="1" label="Coût Nacelle HT (€)" value={store.coutNacelleHT || ''} onChange={(e: any) => store.setField('coutNacelleHT', parseFloat(e.target.value) || 0)} disabled={!store.nacelleActive} />
            </div>

            <div className="flex flex-col justify-end">
              <Input type="number" step="1" label="Autres frais HT (€)" value={store.autresFraisHT || ''} onChange={(e: any) => store.setField('autresFraisHT', parseFloat(e.target.value) || 0)} />
            </div>
          </div>
        )}

        {/* SOUS-TOTAL COÛT DE REVIENT */}
        <div className="flex items-center justify-between p-5 bg-slate-950/60 rounded-2xl border-2 border-slate-700 shadow-inner mt-4">
          <span className="text-xl font-bold tracking-wider text-slate-400">Coût total HT calculé :</span>
          <span className="text-3xl font-mono font-black text-slate-200">{coutTotalHT.toFixed(2)} €</span>
        </div>

        {/* CONSTRUCTION DU PRIX DE VENTE */}
        <h3 className="text-2xl font-black text-blue-400 border-b border-slate-700 pb-2 mt-8 flex items-center gap-3">
          <Euro className="w-6 h-6" /> 3. Marge Business
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          
          <div className="flex flex-col gap-5 p-6 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-blue-500/20 shadow-lg relative">
            <h4 className="font-black text-slate-200 uppercase tracking-widest text-sm text-center">Mode A : Auto</h4>
            <div className="w-full">
              <Input type="number" step="1" label="Marge cible (%)" value={store.margePourcentage || ''} onChange={(e: any) => store.setField('margePourcentage', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="flex justify-between items-center text-slate-400 mt-auto pt-4 border-t border-slate-700/50">
               <span className="text-sm font-bold uppercase">Prix Conseillé :</span>
               <span className="font-mono text-xl text-slate-200 font-bold">{prixConseilleHT.toFixed(2)} €</span>
            </div>
          </div>

          <div className="flex flex-col p-2 space-y-4 justify-center items-center">
            {/* MARGE INDICATOR */}
            <div className={`p-6 rounded-2xl border-2 flex flex-col justify-center items-center w-full min-h-[160px] shadow-inner ${margeBg} transition-colors duration-300`}>
               <span className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2">MARGE CIBLE :</span>
               <span className={`text-5xl font-black font-mono drop-shadow-lg ${margeColor}`}>+{margeEuros.toFixed(2)} €</span>
               <span className={`text-xl font-black mt-3 bg-black/30 px-5 py-2 rounded-full border border-white/10 ${margeColor}`}>({store.margePourcentage || 0} %)</span>
            </div>
          </div>

          <div className="flex flex-col gap-5 p-6 bg-[#0f172a]/90 rounded-2xl border border-slate-700 shadow-lg">
            <h4 className="font-black text-slate-200 uppercase tracking-widest text-sm text-center">Modes B & C : Manuels</h4>
            <div className="flex-1 space-y-5 mt-2">
              <Input type="number" step="1" label="Ajuster le prix (+/- €)" value={store.ajustementManuel || ''} onChange={(e: any) => store.setField('ajustementManuel', parseFloat(e.target.value) || 0)} disabled={isEcrasementTotal} placeholder="ex: 50" className="border-blue-500/30" />
              <Input type="number" step="1" label="Forcer le Prix HT (€)" value={store.prixFinalManuel !== null ? store.prixFinalManuel : ''} onChange={(e: any) => {
                const val = e.target.value === '' ? null : parseFloat(e.target.value);
                store.setField('prixFinalManuel', val);
              }} placeholder="Écrasement total" className="border-amber-500/50 bg-amber-500/5 text-amber-100 placeholder-amber-500/30" />
            </div>
          </div>

        </div>
      </div>

      {/* OPTIONS ADDITIONNELLES */}
      {!store.devisModeRapide && (
        <div className="bg-[#0f172a]/70 backdrop-blur-2xl p-6 md:p-8 rounded-3xl shadow-xl border border-slate-700/50 flex flex-col gap-6">
          <h3 className="text-xl font-bold text-indigo-300 border-b border-slate-700 pb-2 flex items-center gap-2">
            4. Extras du document
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Conditions de règlement" value={store.conditionsReglement} onChange={(e: any) => store.setField('conditionsReglement', e.target.value)} />
            <Input label="Délai de réalisation" value={store.delai} onChange={(e: any) => store.setField('delai', e.target.value)} placeholder="Ex: 2 semaines après accord" />
          </div>
          <Textarea label="Réserves / Exclusions" value={store.reserves} onChange={(e: any) => store.setField('reserves', e.target.value)} />
          <label className="flex items-center gap-3 mt-2 p-4 border border-white/10 rounded-2xl bg-slate-800/40 cursor-pointer hover:bg-slate-700/50 transition-all shadow-inner">
            <input type="checkbox" checked={store.bonPourAccord} onChange={(e) => store.setField('bonPourAccord', e.target.checked)} className="w-5 h-5 text-blue-500 rounded border-slate-600 focus:ring-blue-500" />
            <span className="font-bold text-slate-200">Inclure la mention "Bon pour accord"</span>
          </label>
        </div>
      )}

      {/* BLOC FINAL ULTRA VISIBLE */}
      <div className="mt-8 bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        
        {/* LIGNE 1: PRIX FINAL HT */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-slate-700/50 pb-5 gap-2">
           <span className="text-xl md:text-2xl text-slate-300 font-bold uppercase tracking-widest flex items-center gap-3">
             <Receipt className="w-6 h-6 text-slate-400" /> PRIX FINAL HT :
           </span>
           <span className="text-3xl md:text-4xl font-black text-white font-mono text-right">{prixRetenuHT.toFixed(2)} €</span>
        </div>
        
        {/* LIGNE 2: TVA */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-slate-700/50 py-5 gap-2">
           <div className="flex items-center gap-4">
             <span className="text-xl md:text-2xl text-slate-400 font-bold uppercase tracking-widest">TVA :</span>
             <div className="w-24">
               <Input type="number" step="0.1" value={store.tvaPourcentage || ''} onChange={(e: any) => store.setField('tvaPourcentage', parseFloat(e.target.value) || 0)} className="text-center font-bold bg-slate-800/80 border-slate-600 focus:border-blue-500 transition-colors" />
             </div>
             <span className="text-lg text-slate-500">%</span>
           </div>
           <span className="text-2xl md:text-3xl font-black text-slate-400 font-mono text-right">+{tva.toFixed(2)} €</span>
        </div>
        
        {/* LIGNE 3: TOTAL TTC */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center py-6 mt-2 gap-2 bg-blue-500/10 p-6 rounded-2xl border border-blue-500/30">
           <span className="text-3xl md:text-4xl font-black text-blue-400 uppercase tracking-widest drop-shadow-sm">TOTAL TTC :</span>
           <span className="text-5xl md:text-6xl font-black text-white font-mono drop-shadow-[0_2px_10px_rgba(59,130,246,0.3)] text-right">{totalTTC.toFixed(2)} €</span>
        </div>
        
        {/* LIGNE 4: ACOMPTE INTEGRÉE DANS LE BLOC FINAL */}
        <div className="mt-6 pt-6 border-t border-slate-700/50 flex flex-col md:flex-row justify-between items-center gap-6">
          <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-slate-800 rounded-xl transition-all w-full md:w-auto">
            <input type="checkbox" checked={store.acompteDemande} onChange={(e) => store.setField('acompteDemande', e.target.checked)} className="w-6 h-6 rounded text-blue-500 bg-slate-800 border-slate-600 focus:ring-blue-500" />
            <span className="font-bold text-lg text-slate-300 uppercase tracking-wide">Acompte demandé</span>
          </label>
          
          {store.acompteDemande && (
            <div className="flex flex-col md:flex-row items-center gap-4 bg-slate-800/80 p-4 rounded-xl border border-slate-600 shadow-inner w-full md:w-auto">
               <div className="w-24">
                 <Input type="number" step="1" value={store.acomptePourcentage || ''} onChange={(e: any) => store.setField('acomptePourcentage', parseFloat(e.target.value) || 0)} className="text-center font-bold text-lg" />
               </div>
               <span className="text-xl text-slate-400">%</span>
               <span className="hidden md:inline text-2xl text-slate-500 px-2">=</span>
               <span className="text-3xl md:text-4xl font-black text-blue-300 font-mono text-right">{acompteCalcule.toFixed(2)} €</span>
            </div>
          )}
        </div>
      </div>

      <StepSignatureZone stepKey="devis" title="Devis" />

      <div className="flex justify-between mt-8 mb-4">
        <Button variant="outline" onClick={handlePrev} className="px-8 py-6 text-xl rounded-2xl hover:bg-slate-800"><ArrowLeft className="w-6 h-6 mr-2" /> Retour</Button>
        <Button onClick={handleNext} className="px-12 py-6 text-xl rounded-2xl font-black shadow-[0_0_20px_rgba(59,130,246,0.3)]">Continuer <ArrowRight className="w-7 h-7 ml-2" /></Button>
      </div>
    </div>
  );
}
