"use client";

import { useEffect, useState } from 'react';
import { useDossierStore } from '@/store/useDossierStore';
import { SnimopLogo } from '@/components/ui/SnimopLogo';
import { Accueil } from '@/components/steps/Accueil';
import { InformationsGenerales } from '@/components/steps/InformationsGenerales';
import { VisiteAvantDevis } from '@/components/steps/VisiteAvantDevis';
import { Devis } from '@/components/steps/Devis';
import { BonIntervention } from '@/components/steps/BonIntervention';
import { RapportIntervention } from '@/components/steps/RapportIntervention';
import { ExportFinal } from '@/components/steps/ExportFinal';
import { ClipboardList, ClipboardSignature, Wrench, HardHat, FileText, CheckCircle2, Home as HomeIcon } from 'lucide-react';

const steps = [
  { id: 1, title: 'Infos', icon: <ClipboardList className="w-5 h-5" /> },
  { id: 2, title: 'Visite', icon: <HardHat className="w-5 h-5" /> },
  { id: 3, title: 'Devis', icon: <FileText className="w-5 h-5" /> },
  { id: 4, title: 'Inter.', icon: <Wrench className="w-5 h-5" /> },
  { id: 5, title: 'Rapport', icon: <ClipboardSignature className="w-5 h-5" /> },
  { id: 6, title: 'Export', icon: <CheckCircle2 className="w-5 h-5" /> },
];

export default function Home() {
  const currentStep = useDossierStore((state) => state.currentStep);
  const setField = useDossierStore((state) => state.setField);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Chargement...</div>;

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <Accueil />;
      case 1: return <InformationsGenerales />;
      case 2: return <VisiteAvantDevis />;
      case 3: return <Devis />;
      case 4: return <BonIntervention />;
      case 5: return <RapportIntervention />;
      case 6: return <ExportFinal />;
      default: return <Accueil />;
    }
  };

  return (
    <div className="min-h-screen text-slate-100 pb-20 relative font-sans">
      
      {/* Background global industriel profond avec overlay */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat bg-slate-950"
        style={{ backgroundImage: "url('/snimop-bg.jpg')" }}
      />
      {/* Overlay plus prononcé pour contraster avec le verre dépoli blanc/gris des cartes */}
      <div className="fixed inset-0 z-0 bg-[#070b14]/80 backdrop-blur-sm" />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header premium avec logo SNIMOP principal */}
        <header className="bg-slate-900/60 backdrop-blur-xl border-b border-white/5 p-4 sticky top-0 z-50 flex items-center min-h-[76px] px-6">
          <div className="flex-1 flex justify-start">
            {currentStep > 0 && (
              <button 
                onClick={() => setField('currentStep', 0)}
                className="flex items-center justify-center p-2.5 rounded-full bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors shadow-sm border border-white/5"
                title="Retour à l'accueil"
              >
                <HomeIcon className="w-5 h-5" />
              </button>
            )}
          </div>
          <SnimopLogo useGradient className="w-[160px] md:w-[200px] h-[35px] md:h-[45px] mx-auto flex-shrink-0" />
          <div className="flex-1 flex justify-end">
            <img 
              src="/snimop-mascote.png" 
              alt="" 
              className="h-10 w-auto object-contain opacity-90 transition-all hover:scale-105 hover:opacity-100" 
            />
          </div>
        </header>

        {/* Stepper Premium */}
        {currentStep > 0 && currentStep <= 6 && (
          <div className="bg-slate-900/50 backdrop-blur-lg border-b border-white/5 py-4 px-2 mb-6 overflow-x-auto shadow-xl sticky top-[76px] z-40">
            <div className="flex items-center min-w-max px-2 justify-between max-w-3xl mx-auto">
              {steps.map((step, idx) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div
                    className={`flex flex-col items-center justify-center cursor-pointer transition-all duration-300 w-full ${
                      currentStep === step.id ? 'text-blue-400 scale-110' : currentStep > step.id ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-400'
                    }`}
                    onClick={() => setField('currentStep', step.id)}
                  >
                    <div className={`p-2.5 rounded-full mb-1 flex items-center justify-center shadow-inner transition-colors ${
                      currentStep === step.id ? 'bg-blue-500/20 ring-1 ring-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : currentStep > step.id ? 'bg-emerald-500/10' : 'bg-slate-800/40'
                    }`}>
                      {step.icon}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">{step.title}</span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`w-full h-[2px] mx-1 flex-1 rounded-full transition-colors ${currentStep > step.id ? 'bg-emerald-500/40 shadow-[0_0_5px_rgba(16,185,129,0.3)]' : 'bg-slate-700/30'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="max-w-3xl mx-auto px-4 w-full flex-1">
          {renderStep()}
        </main>
      </div>
    </div>
  );
}
