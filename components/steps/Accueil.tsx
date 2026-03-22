"use client";

import { useDossierStore } from '@/store/useDossierStore';
import { Button } from '@/components/ui/Button';
import { FilePlus, FileClock } from 'lucide-react';
import { useEffect, useState } from 'react';

export function Accueil() {
  const setField = useDossierStore(state => state.setField);
  const resetDossier = useDossierStore(state => state.resetDossier);
  
  const { numeroAffaire, client, objet } = useDossierStore();
  const hasDraft = Boolean(numeroAffaire || client || objet);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  
  if (!mounted) return null;

  return (
    <div className="flex flex-col items-center justify-center pt-8 pb-20 gap-10">
      <div className="text-center flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Mascotte SNIMOP - Intégration Premium dans un badge */}
        <div className="relative mb-8 group">
          {/* Outer glow subtil */}
          <div className="absolute inset-[-20px] bg-blue-500/20 blur-3xl rounded-full transition-all duration-700 group-hover:bg-blue-400/30" />
          
          {/* Badge de contenant pour fondre le beige */}
          <div className="relative z-10 w-56 h-56 rounded-full bg-gradient-to-br from-[#FAFAF8] to-[#EFECE5] shadow-[0_0_40px_rgba(0,0,0,0.5)] ring-4 ring-white/10 flex items-center justify-center overflow-hidden">
            <img 
              src="/snimop-mascote.png" 
              alt="" 
              className="w-full h-full object-cover mix-blend-multiply scale-105"
            />
          </div>
        </div>


        <p className="text-slate-300 max-w-sm text-lg font-medium leading-relaxed px-4 mt-2">
          Génération et gestion des documents d&apos;intervention sur chantier.
        </p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-sm px-4">
        <Button 
          className="py-5 text-lg shadow-xl shadow-blue-900/40 border border-blue-400/30 rounded-2xl"
          onClick={() => {
            useDossierStore.getState().startNewDossier();
          }}
        >
          <FilePlus className="w-6 h-6 mr-2" />
          Nouveau Dossier
        </Button>

        {hasDraft && (
          <Button 
            variant="secondary"
            className="py-5 text-lg rounded-2xl"
            onClick={() => {
              setField('currentStep', 1); 
            }}
          >
            <FileClock className="w-6 h-6 text-slate-300 mr-2" />
            <span className="font-semibold text-slate-100">Reprendre l&apos;existant</span>
          </Button>
        )}
      </div>
    </div>
  );
}
