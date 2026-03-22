"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { useDossierStore } from '@/store/useDossierStore';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ArrowRight, Calculator, Euro, HardHat, Truck, Zap, Eye, Settings2, Users, ChevronUp, X } from 'lucide-react';
import { StepSignatureZone } from '@/components/ui/StepSignatureZone';

export function Devis() {
  const store = useDossierStore();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isPricePulsing, setIsPricePulsing] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const state = useDossierStore.getState();
    if (!state.descriptifTravaux && (state.travauxPreconises || state.constat)) {
      state.setField('descriptifTravaux', state.travauxPreconises || state.constat);
    }
    if (!state.devisMateriel && state.materielEnvisage) state.setField('devisMateriel', state.materielEnvisage);

    // Dynamic Visibility on Scroll
    const handleScroll = () => {
      const shouldShow = window.scrollY > 120;
      if (shouldShow !== isVisible) setIsVisible(shouldShow);
    };

    // Keyboard focus detection (Mobile)
    const handleFocus = () => {
      if (window.innerWidth < 768) setIsKeyboardOpen(true);
    };
    const handleBlur = () => {
      setIsKeyboardOpen(false);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  const handleNext = () => store.setField('currentStep', 4);
  const handlePrev = () => store.setField('currentStep', 2);

  const toggleModeRapide = () => store.setField('devisModeRapide', !store.devisModeRapide);
  const toggleModeClient = () => store.setField('devisModeClient', !store.devisModeClient);

  // --- CALCULS DU MOTEUR ---
  // --- SELECTORS FOR REACTIVITY ---
  const coutMaterielHT = useDossierStore(s => s.coutMaterielHT) || 0;
  const tauxHoraireMO = useDossierStore(s => s.tauxHoraireMO) || 0;
  const heuresMO = useDossierStore(s => s.heuresMO) || 0;
  const coutDeplacementHT = useDossierStore(s => s.coutDeplacementHT) || 0;
  const coutNacelleHT = useDossierStore(s => s.coutNacelleHT) || 0;
  const nacelleActive = useDossierStore(s => s.nacelleActive);
  const autresFraisHT = useDossierStore(s => s.autresFraisHT) || 0;
  const margePourcentage = useDossierStore(s => s.margePourcentage) || 0;
  const tvaPourcentage = useDossierStore(s => s.tvaPourcentage) || 0;
  const prixFinalManuel = useDossierStore(s => s.prixFinalManuel);
  const ajustementManuel = useDossierStore(s => s.ajustementManuel) || 0;
  const devisModeRapide = useDossierStore(s => s.devisModeRapide);
  const devisModeClient = useDossierStore(s => s.devisModeClient);
  const acompteDemande = useDossierStore(s => s.acompteDemande);
  const acomptePourcentage = useDossierStore(s => s.acomptePourcentage) || 0;
  const prestationType = useDossierStore(s => s.prestationType);
  const descriptifTravaux = useDossierStore(s => s.descriptifTravaux);
  const devisMateriel = useDossierStore(s => s.devisMateriel);


  // --- CALCULATION LOGIC (MEMOIZED) ---
  const chiffrage = useMemo(() => {
    const mo = Number(tauxHoraireMO) * Number(heuresMO);
    const nacelle = (!devisModeRapide && nacelleActive) ? Number(coutNacelleHT) : 0;
    const dep = !devisModeRapide ? Number(coutDeplacementHT) : 0;
    const items = !devisModeRapide ? Number(autresFraisHT) : 0;

    const safeMargePct = Math.min(Math.max(Number(margePourcentage) || 0, -100), 1000);
    const safeTvaPct = Math.min(Math.max(Number(tvaPourcentage) || 0, 0), 100);
    
    const internalTotal = (Number(coutMaterielHT) || 0) + mo + dep + nacelle + items;
    const marge = internalTotal * (safeMargePct / 100);
    const baseHT = internalTotal + marge;
    
    const isOverride = prixFinalManuel !== null && prixFinalManuel !== undefined && String(prixFinalManuel) !== '';
    const finalHT = isOverride ? Number(prixFinalManuel) : baseHT + (Number(ajustementManuel) || 0);
    
    // SECURE TVA CALCULATION
    const tvaVal = finalHT * (safeTvaPct / 100);
    const ttc = finalHT + tvaVal;
    
    const acompte = acompteDemande ? ttc * (Number(acomptePourcentage) / 100) : 0;

    // Visual Marge logic
    let mColor = 'text-green-400';
    let mBg = 'bg-green-500/10 border-green-500/30';
    let mIcon = '🟢';
    let mText = 'Rentable';
    
    if (safeMargePct < 10) {
      mColor = 'text-red-400'; mBg = 'bg-red-500/10 border-red-500/30'; mIcon = '🔴'; mText = 'Marge trop faible';
    } else if (safeMargePct <= 25) {
      mColor = 'text-yellow-400'; mBg = 'bg-yellow-500/10 border-yellow-500/30'; mIcon = '🟡'; mText = 'Marge correcte';
    } else if (safeMargePct > 40) {
      mColor = 'text-emerald-400'; mBg = 'bg-emerald-500/10 border-emerald-500/30'; mIcon = '🟢🟢'; mText = 'Très rentable';
    }

    return {
      totalMoHT: mo,
      depHT: dep,
      totalNacelleHT: nacelle,
      othersHT: items,
      coutTotalHT: internalTotal,
      margeEuros: marge,
      prixConseilleHT: baseHT,
      prixRetenuHT: finalHT,
      tva: tvaVal,
      totalTTC: ttc,
      acompteCalcule: acompte,
      isEcrasementTotal: isOverride,
      margeColor: mColor,
      margeBg: mBg,
      margeIcon: mIcon,
      margeText: mText
    };
  }, [
    coutMaterielHT, tauxHoraireMO, heuresMO, coutDeplacementHT, coutNacelleHT, 
    nacelleActive, autresFraisHT, margePourcentage, tvaPourcentage, 
    prixFinalManuel, ajustementManuel, devisModeRapide, acompteDemande, acomptePourcentage
  ]);

  // Destructure for easier use in JSX
  const { 
    totalMoHT, depHT, totalNacelleHT, othersHT, coutTotalHT, 
    margeEuros, prixConseilleHT, prixRetenuHT, tva, totalTTC, 
    acompteCalcule, isEcrasementTotal, margeColor, margeBg, margeIcon, margeText 
  } = chiffrage;


  // Visual Pulse on Price Change
  // moved here to avoid "used before declaration" error
  useEffect(() => {
    if (totalTTC > 0) {
      setIsPricePulsing(true);
      const timer = setTimeout(() => setIsPricePulsing(false), 600);
      return () => clearTimeout(timer);
    }
  }, [totalTTC]);

  return (
    <div className="flex flex-col gap-5 py-3 pb-52 relative">
      
      {/* HEADER & TOGGLES */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 border-b border-white/10 pb-4">
        <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-slate-200 tracking-widest uppercase drop-shadow-lg flex items-center gap-3">
          <Calculator className="w-8 h-8 md:w-10 md:h-10 text-blue-400" />
          Chiffrage
        </h2>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button 
            variant={store.devisModeRapide ? "default" : "outline"} 
            onClick={toggleModeRapide}
            className={`gap-2 font-bold px-4 py-4 rounded-xl shadow-lg transition-all ${store.devisModeRapide ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-none' : 'hover:bg-slate-800 text-slate-300 border-slate-600'}`}
          >
            <Zap className={`w-4 h-4 ${store.devisModeRapide ? 'animate-pulse text-yellow-200' : 'text-slate-400'}`} />
            {store.devisModeRapide ? "MODE RAPIDE" : "Activer Mode Rapide"}
          </Button>

          <Button 
            variant={store.devisModeClient ? "default" : "outline"} 
            onClick={toggleModeClient}
            className={`gap-2 font-bold px-4 py-4 rounded-xl shadow-lg transition-all ${store.devisModeClient ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-none' : 'hover:bg-slate-800 text-slate-300 border-slate-600'}`}
          >
            <Users className={`w-4 h-4 ${store.devisModeClient ? 'text-white' : 'text-slate-400'}`} />
            {store.devisModeClient ? "VUE CLIENT ACTIVE" : "Afficher Version Client"}
          </Button>
        </div>
      </div>

      {/* RÉSUMÉ RAPIDE TERRAIN (Seulement si Mode Client est inactif) */}
      {!store.devisModeClient && (
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-600/50 p-5 shadow-xl flex flex-col gap-3">
          <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
            <h3 className="text-base font-black text-slate-300 flex items-center gap-2 uppercase tracking-wider">
              <Eye className="w-4 h-4 text-blue-400" /> Résumé Rapide
            </h3>
            {/* INDICATEUR DE MARGE RAPIDE */}
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-tighter shadow-sm transition-all ${margeBg} ${margeColor}`}>
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              {margeText} ({store.margePourcentage || 0}%)
            </div>
          </div>
          <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-1 transition-all`}>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prestation</span>
              <span className="font-black text-blue-300 capitalize text-sm md:text-base leading-tight truncate">{store.prestationType?.replace('_', ' + ') || 'Non défini'}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Heures MO</span>
              <span className="font-black text-slate-200 text-sm md:text-base leading-tight">{store.heuresMO || 0} h</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Matériel HT</span>
              <span className="font-black text-slate-200 text-sm md:text-base leading-tight">{(store.coutMaterielHT || 0).toFixed(2)} €</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bénéfice</span>
              <span className={`font-black text-sm md:text-base leading-tight ${margeColor}`}>{margeEuros.toFixed(2)} €</span>
            </div>
            <div className="flex flex-col gap-0.5 col-span-2 md:col-span-4 lg:col-span-1 bg-blue-600/20 rounded-xl border border-blue-400/50 px-3 py-2 items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.2)]">
              <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Prix Vente TTC</span>
              <span className={`font-black text-white text-3xl md:text-4xl drop-shadow-md leading-none transition-transform duration-300 ${isPricePulsing ? 'scale-110' : ''}`}>{totalTTC.toFixed(2)} €</span>
            </div>
          </div>
        </div>
      )}
      
      {/* PARAMÈTRES PRESTATION */}
      <div className="bg-[#0f172a]/70 p-5 md:p-6 rounded-2xl shadow-sm border border-slate-700/50 flex flex-col gap-5">
        <h3 className="text-lg font-bold text-indigo-300 border-b border-slate-700/50 pb-2 flex items-center gap-2">
          <Settings2 className="w-5 h-5" /> 1. Détails du Projet
        </h3>
        
        {!store.devisModeRapide && (
          <div className="flex flex-wrap gap-3 mb-2">
            {['fourniture_pose', 'fourniture', 'pose'].map((type) => (
              <label key={type} className={`flex-1 flex items-center justify-center gap-2 p-2 md:p-3 rounded-xl border-2 cursor-pointer transition-all ${store.prestationType === type ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-inner' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>
                <input type="radio" name="prestation" value={type} checked={store.prestationType === type} onChange={(e) => store.setField('prestationType', e.target.value)} className="hidden" />
                <span className="font-black uppercase tracking-wide text-xs md:text-sm text-center">{type.replace('_', ' + ')}</span>
              </label>
            ))}
          </div>
        )}

        <Textarea label="Descriptif des travaux" value={store.descriptifTravaux} onChange={(e: any) => store.setField('descriptifTravaux', e.target.value)} />
        {!store.devisModeClient && !store.devisModeRapide && (
          <Textarea label="Détail interne du matériel prévu" value={store.devisMateriel} onChange={(e: any) => store.setField('devisMateriel', e.target.value)} />
        )}
      </div>

      {/* MOTEUR DE CHIFFRAGE (Masqué en Vue Client) */}
      {!store.devisModeClient && (
        <div className="bg-slate-900/80 p-5 md:p-6 rounded-2xl shadow-sm border border-slate-700/70 flex flex-col gap-6">
          <h3 className="text-xl font-black text-blue-400 border-b border-slate-700/50 pb-2 flex items-center gap-2">
            <Euro className="w-5 h-5" /> 2. Calcul des Coûts Internes HT
          </h3>

          {/* Ligne 1: Matériel & MO */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex flex-col gap-3 p-4 bg-slate-800/40 rounded-xl border border-slate-700/50 hover:border-slate-500 transition-colors">
              <h4 className="font-black text-slate-300 text-xs tracking-widest uppercase flex items-center gap-2">
                <span>🛠</span> Fournitures
              </h4>
              <Input type="number" step="0.01" label="Coût d'achat global HT (€)" value={store.coutMaterielHT || ''} onChange={(e: any) => store.setField('coutMaterielHT', parseFloat(e.target.value) || 0)} />
            </div>

            <div className="flex flex-col gap-3 p-4 bg-slate-800/40 rounded-xl border border-slate-700/50 hover:border-slate-500 transition-colors relative">
              <h4 className="font-black text-slate-300 text-xs tracking-widest uppercase flex items-center justify-between">
                <div className="flex items-center gap-2"><span>👷</span> Main d'œuvre</div>
                <span className="text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">{totalMoHT.toFixed(2)} € HT</span>
              </h4>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <Input type="number" step="1" label="TauxHoraire(€)" value={store.tauxHoraireMO || ''} onChange={(e: any) => store.setField('tauxHoraireMO', parseFloat(e.target.value) || 0)} />
                <Input type="number" step="0.5" label="Heures" value={store.heuresMO || ''} onChange={(e: any) => store.setField('heuresMO', parseFloat(e.target.value) || 0)} />
              </div>
              
              {/* BOUTON CALCUL RAPIDE */}
              {store.devisModeRapide && (
                <div className="mt-2">
                  <Button 
                    onClick={() => {
                      store.setField('margePourcentage', 30);
                      store.setField('prixFinalManuel', null);
                      store.setField('ajustementManuel', 0);
                    }}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black py-2 rounded-lg gap-2 shadow-lg active:scale-95 transition-all text-xs"
                  >
                    <Zap className="w-4 h-4 text-yellow-200 animate-pulse" />
                    ⚡ CALCUL RAPIDE (30% MARGE)
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Ligne 2: Déplacement, Nacelle, Autres (Caché en Mode Rapide) */}
          {!store.devisModeRapide && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 border-t border-slate-700/50">
              <div className="flex gap-2 items-center">
                <Truck className="w-6 h-6 text-slate-500 mb-1" />
                <div className="flex-1 w-full">
                  <Input type="number" step="1" label="Déplacement HT (€)" value={store.coutDeplacementHT || ''} onChange={(e: any) => store.setField('coutDeplacementHT', parseFloat(e.target.value) || 0)} />
                </div>
              </div>
              
              <div className="flex flex-col gap-2 p-2 bg-slate-800/30 rounded-xl border border-slate-700/50">
                <label className="flex items-center gap-2 text-xs font-bold tracking-wide text-slate-300 mb-1 cursor-pointer">
                  <input type="checkbox" checked={store.nacelleActive} onChange={(e) => store.setField('nacelleActive', e.target.checked)} className="w-4 h-4 rounded bg-slate-800 border-slate-500 text-blue-500" />
                  Option Nacelle
                </label>
                <Input type="number" step="1" label="Coût Nacelle HT(€)" value={store.coutNacelleHT || ''} onChange={(e: any) => store.setField('coutNacelleHT', parseFloat(e.target.value) || 0)} disabled={!store.nacelleActive} />
              </div>

              <div className="flex flex-col justify-end">
                <Input type="number" step="1" label="Autres frais HT (€)" value={store.autresFraisHT || ''} onChange={(e: any) => store.setField('autresFraisHT', parseFloat(e.target.value) || 0)} />
              </div>
            </div>
          )}

          {/* SOUS-TOTAL COÛT DE REVIENT */}
          <div className="flex items-center justify-between p-4 bg-slate-950/60 rounded-xl border border-slate-700 shadow-inner mt-2">
            <span className="font-bold tracking-wider text-slate-400 uppercase text-xs md:text-sm">Coût total interne HT :</span>
            <span className="text-xl md:text-2xl font-mono font-black text-slate-200">{coutTotalHT.toFixed(2)} €</span>
          </div>

          {/* CONSTRUCTION DU PRIX DE VENTE */}
          <h3 className="text-xl font-black text-blue-400 border-b border-slate-700/50 pb-2 mt-4 flex items-center gap-2">
            <span>💰</span> 3. Marge & Ajustements
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
            
            <div className="flex flex-col gap-4 p-5 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border border-blue-500/20 shadow-sm relative">
              <h4 className="font-black text-slate-300 uppercase tracking-widest text-xs text-center border-b border-white/5 pb-2">Calcul Auto</h4>
              <div className="w-full">
                <Input type="number" step="1" label="Marge cible (%)" value={store.margePourcentage || ''} onChange={(e: any) => store.setField('margePourcentage', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="flex justify-between items-center text-slate-400 mt-auto pt-3 border-t border-slate-700/50">
                 <span className="text-xs font-bold uppercase">Prix HT Calculé :</span>
                 <span className="font-mono text-lg text-slate-200 font-bold">{prixConseilleHT.toFixed(2)} €</span>
              </div>
            </div>

            <div className="flex flex-col p-1 space-y-4 justify-center items-center">
              {/* MARGE INDICATOR */}
              <div className={`px-4 py-5 rounded-xl border flex flex-col justify-center items-center w-full shadow-inner ${margeBg} transition-colors duration-300 h-full`}>
                 <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                   {margeIcon} Bénéfice
                 </span>
                 <span className={`text-4xl font-black font-mono drop-shadow-md lg:whitespace-nowrap ${margeColor}`}>+{margeEuros.toFixed(2)} €</span>
                 <div className="flex flex-wrap justify-center items-center gap-2 mt-3 block w-full text-center">
                   <span className={`text-sm font-black bg-black/30 px-3 py-1 rounded-full border border-white/10 ${margeColor}`}>
                     {store.margePourcentage || 0}%
                   </span>
                   <span className={`text-xs font-bold ${margeColor} bg-black/20 px-2 py-1 rounded capitalize border border-black/30`}>
                     {margeText}
                   </span>
                 </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 p-5 bg-[#0f172a]/90 rounded-xl border border-slate-700 shadow-sm relative">
              <div className="absolute top-0 right-0 p-2">
                 <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded ${isEcrasementTotal ? 'bg-amber-500/20 text-amber-400 font-mono ring-2 ring-amber-500/50' : 'bg-blue-500/20 text-blue-400'}`}>
                   {isEcrasementTotal ? 'MANUEL' : 'AUTO'}
                 </span>
              </div>
              <h4 className="font-black text-slate-300 uppercase tracking-widest text-xs text-center border-b border-white/5 pb-2 w-full pr-8">Correction</h4>
              <div className="flex-1 space-y-4">
                <Input type="number" step="1" label="Ajuster (+/- €)" value={store.ajustementManuel || ''} onChange={(e: any) => store.setField('ajustementManuel', parseFloat(e.target.value) || 0)} disabled={isEcrasementTotal} placeholder="ex: 50" className="border-blue-500/30" />
                <Input type="number" step="1" label="Prix fixé manuellement (le calcul automatique est ignoré)" value={store.prixFinalManuel !== null ? store.prixFinalManuel : ''} onChange={(e: any) => {
                  const val = e.target.value === '' ? null : parseFloat(e.target.value);
                  store.setField('prixFinalManuel', val);
                }} placeholder="Prix Forfaitaire" className={`placeholder-opacity-50 ${isEcrasementTotal ? 'border-amber-500/50 bg-amber-500/10 text-amber-100' : 'border-slate-600 bg-slate-800'}`} />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* OPTIONS ADDITIONNELLES */}
      {!store.devisModeRapide && (
        <div className="bg-[#0f172a]/70 p-5 md:p-6 rounded-2xl shadow-sm border border-slate-700/50 flex flex-col gap-5">
          <h3 className="text-lg font-bold text-indigo-300 border-b border-slate-700/50 pb-2 flex items-center gap-2">
            4. Conditions du Devis
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Conditions de règlement" value={store.conditionsReglement} onChange={(e: any) => store.setField('conditionsReglement', e.target.value)} />
            <Input label="Délai de réalisation" value={store.delai} onChange={(e: any) => store.setField('delai', e.target.value)} placeholder="Ex: 2 semaines après accord" />
          </div>
          <Textarea label="Réserves / Exclusions" value={store.reserves} onChange={(e: any) => store.setField('reserves', e.target.value)} />
          <label className="flex items-center gap-3 mt-2 p-3 border border-white/10 rounded-xl bg-slate-800/40 cursor-pointer hover:bg-slate-700/50 transition-all shadow-inner">
            <input type="checkbox" checked={store.bonPourAccord} onChange={(e) => store.setField('bonPourAccord', e.target.checked)} className="w-5 h-5 text-blue-500 rounded border-slate-600 focus:ring-blue-500" />
            <span className="font-bold text-slate-300">Inclure la mention "Bon pour accord" au bas du devis</span>
          </label>
        </div>
      )}

      {store.bonPourAccord && (
        <StepSignatureZone stepKey="devis" title="Devis" />
      )}

      {/* NAVIGATION BOTTOM */}
      <div className="flex justify-between mt-4">
        <Button variant="outline" onClick={handlePrev} className="px-5 py-5 rounded-xl hover:bg-slate-800"><ArrowLeft className="w-5 h-5 mr-2 hidden sm:inline" /> Retour</Button>
        <Button onClick={handleNext} className="px-8 py-5 rounded-xl font-black shadow-lg">Continuer <ArrowRight className="w-5 h-5 ml-2 hidden sm:inline" /></Button>
      </div>

      {/* ========================================================== */}
      {/* BLOC FINAL STICKY BOTTOM (Responsive & Intelligent) */}
      {/* ========================================================== */}
      <div className={`fixed bottom-0 left-0 w-full z-50 pointer-events-none flex justify-center pb-safe px-2 md:px-0 transition-all duration-500 ease-in-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'} ${isKeyboardOpen ? 'scale-95 opacity-40 translate-y-4' : ''}`}>
        
        {/* MOBILE: PANNEAU SLIDE-UP DÉTAILS */}
        <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${isPanelOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsPanelOpen(false)}>
          <div 
            className={`absolute bottom-0 left-0 w-full bg-slate-900 border-t-2 border-blue-500/50 rounded-t-[2.5rem] p-6 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-out flex flex-col gap-6 ${isPanelOpen ? 'translate-y-0' : 'translate-y-full'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h4 className="text-xl font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                <Settings2 className="w-5 h-5" /> Détails Chiffrage
              </h4>
              <button onClick={() => setIsPanelOpen(false)} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* ACOMPTE & TVA (Directement modifiables) */}
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                  <input type="checkbox" checked={store.acompteDemande} onChange={(e) => store.setField('acompteDemande', e.target.checked)} className="w-6 h-6 rounded text-blue-500" />
                  <span className="font-bold text-slate-200">Demander un acompte</span>
                </label>
                {store.acompteDemande && (
                  <div className="flex items-center gap-3 bg-indigo-900/30 p-3 rounded-xl border border-indigo-500/30">
                    <span className="text-sm font-bold text-indigo-200 uppercase flex-1">Acompte ({store.acomptePourcentage}%):</span>
                    <span className="text-lg font-black font-mono text-white">{acompteCalcule.toFixed(2)} €</span>
                    <div className="w-16">
                      <Input type="number" step="1" value={store.acomptePourcentage || ''} onChange={(e: any) => store.setField('acomptePourcentage', parseFloat(e.target.value) || 0)} className="text-center font-bold h-9 bg-slate-800 border-indigo-500/50" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">TVA Appliquée (%) :</span>
                <div className="w-20">
                  <Input type="number" step="0.1" value={store.tvaPourcentage || ''} onChange={(e: any) => store.setField('tvaPourcentage', parseFloat(e.target.value) || 0)} className="text-center font-bold bg-slate-800 border-slate-600 h-9" />
                </div>
              </div>

              <div className="flex justify-between items-center p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                <span className="text-sm text-slate-400 font-bold uppercase tracking-widest">Prix Final HT</span>
                <span className="text-xl font-black text-white font-mono">{prixRetenuHT.toFixed(2)} €</span>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                <span className="text-sm text-slate-400 font-bold uppercase tracking-widest">Montant TVA</span>
                <span className="text-xl font-black text-slate-300 font-mono">+{tva.toFixed(2)} €</span>
              </div>
            </div>

            <Button onClick={() => setIsPanelOpen(false)} className="w-full py-6 rounded-2xl font-black text-xl shadow-xl mt-2">
              RETOUR AU CHIFFRAGE
            </Button>
          </div>
        </div>

        {/* PIED DE PAGE : VERSION DESKTOP */}
        <div className="hidden md:flex w-full max-w-5xl bg-slate-900/95 border border-slate-700/50 rounded-3xl py-2.5 px-8 shadow-[0_-8px_25px_rgba(0,0,0,0.6)] relative overflow-hidden pointer-events-auto backdrop-blur-2xl">
          <div className="w-full flex items-center justify-between gap-10">
            
            {/* GAUCHE: RÉGLAGES & SECONDAIRES */}
            <div className="flex items-center gap-8 flex-1">
              {/* HT */}
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Prix HT</span>
                <span className="text-xl font-bold text-slate-200 font-mono">{prixRetenuHT.toFixed(2)}€</span>
              </div>
              
              {/* TVA DISPLAY & INPUT */}
              <div className="flex flex-col group">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">TVA</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-lg font-bold text-slate-400 font-mono">+{tva.toFixed(2)}€</span>
                  <div className="w-12 opacity-40 group-hover:opacity-100 transition-opacity">
                    <Input type="number" step="0.1" value={store.tvaPourcentage || ''} onChange={(e: any) => store.setField('tvaPourcentage', parseFloat(e.target.value) || 0)} className="text-center font-bold bg-slate-800/50 border-slate-700 h-6 px-1 text-[10px] rounded" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-600">%</span>
                </div>
              </div>

              {/* ACOMPTE (Si activé) */}
              <div className="flex items-center gap-4 border-l border-slate-800 pl-8 ml-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={store.acompteDemande} onChange={(e) => store.setField('acompteDemande', e.target.checked)} className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Acompte</span>
                </label>
                
                {store.acompteDemande && (
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-indigo-400 font-mono">{acompteCalcule.toFixed(2)}€</span>
                    <div className="w-12">
                      <Input type="number" step="1" value={store.acomptePourcentage || ''} onChange={(e: any) => store.setField('acomptePourcentage', parseFloat(e.target.value) || 0)} className="text-center font-bold text-[10px] h-6 px-1 bg-slate-800/80 border-indigo-900/50" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* DROITE: TOTAL TTC (DOMINANT) */}
            <div className={`flex items-center gap-4 bg-blue-500/5 px-6 py-2 rounded-2xl border transition-all duration-300 ${isPricePulsing ? 'border-blue-400 scale-105 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.4)]' : 'border-blue-500/20 shadow-inner'}`}>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-0.5">TOTAL TTC</span>
                <span className={`text-4xl lg:text-5xl font-black text-white font-mono drop-shadow-[0_2px_10px_rgba(59,130,246,0.5)] leading-none transition-transform duration-300 ${isPricePulsing ? 'scale-110' : 'scale-100'}`}>{totalTTC.toFixed(2)} €</span>
              </div>
            </div>

          </div>
        </div>

        {/* PIED DE PAGE : VERSION MOBILE COMPACTE (Max 60px) */}
        <div 
          onClick={() => setIsPanelOpen(true)}
          className={`md:hidden w-full h-[60px] max-w-sm bg-slate-900 border-2 border-blue-500/40 rounded-full flex items-center justify-between px-6 shadow-[0_0_30px_rgba(59,130,246,0.3)] pointer-events-auto active:scale-95 transition-all duration-300 cursor-pointer backdrop-blur-3xl bg-opacity-95 ${isPricePulsing ? 'scale-105 border-blue-400 shadow-[0_0_40px_rgba(59,130,246,0.5)]' : ''}`}
        >
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] leading-tight">TOTAL TTC</span>
            <span className={`text-xl font-black text-white font-mono leading-none tracking-tight transition-transform duration-300 ${isPricePulsing ? 'scale-110' : ''}`}>{totalTTC.toFixed(2)} €</span>
          </div>
          <div className="bg-blue-500/20 p-1.5 rounded-full border border-blue-500/30">
            <ChevronUp className="w-5 h-5 text-blue-400 animate-bounce group-hover:animate-none" />
          </div>
        </div>

      </div>
      
    </div>
  );
}
