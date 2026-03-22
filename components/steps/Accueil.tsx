"use client";

import { useDossierStore } from '@/store/useDossierStore';
import { Button } from '@/components/ui/Button';
import { FilePlus, FileClock, FolderOpen, ArrowLeft, Trash2, Copy, Edit, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function Accueil() {
  const store = useDossierStore();
  const [mounted, setMounted] = useState(false);
  const [viewingDossiers, setViewingDossiers] = useState(false);

  useEffect(() => setMounted(true), []);
  
  if (!mounted) return null;

  const { dossiers, numeroAffaire, client, objet } = store;
  const hasDraft = Boolean(numeroAffaire || client || objet);
  
  const savedDossiers = Object.values(dossiers || {}).sort((a, b) => {
    return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
  });

  if (viewingDossiers) {
    return (
      <div className="flex flex-col pt-8 pb-20 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setViewingDossiers(false)}
              className="p-2 rounded-full bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors border border-slate-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-slate-200 tracking-widest uppercase">
              Mes Dossiers
            </h2>
          </div>
          <Button 
            onClick={() => {
              store.startNewDossier();
              setViewingDossiers(false);
            }} 
            className="hidden md:flex shadow-none bg-blue-600 hover:bg-blue-500 text-sm"
          >
            <FilePlus className="w-4 h-4 mr-2" />
            Nouveau
          </Button>
        </div>

        {savedDossiers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-slate-800/30 rounded-3xl border border-dashed border-slate-600/50 text-slate-400">
            <FolderOpen className="w-16 h-16 mb-4 opacity-50" />
            <p className="font-semibold text-lg text-slate-300">Aucun dossier enregistré.</p>
            <p className="text-sm">Les dossiers sauvegardés apparaîtront ici.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {savedDossiers.map(d => {
              let mainTitle = '';
              let secondaryTitle = '';

              if (d.client && d.client.trim() !== '') {
                mainTitle = d.client;
                secondaryTitle = (d.site && d.site.trim() !== '') ? d.site : (d.numeroAffaire || '');
              } else if (d.site && d.site.trim() !== '') {
                mainTitle = d.site;
                secondaryTitle = d.numeroAffaire || '';
              } else {
                mainTitle = d.numeroAffaire || 'Sans Numéro';
                secondaryTitle = ''; 
              }

              return (
              <div key={d.id} className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-5 border border-slate-700/70 shadow-lg flex flex-col md:flex-row gap-6 justify-between items-start md:items-center hover:bg-slate-800 transition-colors group overflow-hidden">
                
                <div className="flex flex-col gap-1.5 min-w-0 flex-1 w-full">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${d.status === 'Exporté' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : d.status === 'En cours' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : d.status === 'Terminé' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                      {d.status || 'Brouillon'}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-100 truncate pr-4" title={mainTitle}>
                    {mainTitle}
                  </h3>
                  
                  {secondaryTitle && (
                    <p className="text-[15px] font-medium text-slate-400/80 truncate pr-4" title={secondaryTitle}>
                      {secondaryTitle}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs md:text-sm text-slate-500 mt-1">
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Modifié le {format(new Date(d.updatedAt || new Date()), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}</span>
                    {d.interventionType && <span className="text-blue-400/70 font-semibold">• {d.interventionType}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0 pt-4 md:pt-0 border-t border-slate-700/50 md:border-0 opacity-100 sm:opacity-70 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => {
                       store.loadDossier(d.id);
                       store.setField('currentStep', 1);
                    }}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-xl font-semibold transition-colors border border-blue-500/30"
                  >
                    <Edit className="w-4 h-4" />
                    Reprendre
                  </button>
                  <button 
                    onClick={() => store.duplicateDossier(d.id)}
                    className="p-2.5 bg-slate-700/50 text-slate-300 hover:bg-slate-600 rounded-xl transition-colors border border-slate-600/50"
                    title="Dupliquer"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                        if (window.confirm("Supprimer ce dossier définitivement ?")) {
                            store.deleteDossier(d.id);
                        }
                    }}
                    className="p-2.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-colors border border-red-500/30"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })}
          </div>
        )}
      </div>
    );
  }

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
          <span className="block text-sm text-emerald-400 mt-2 font-bold font-mono">v1.3 - Mode Praxedo Local (Actif)</span>
        </p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-sm px-4">
        
        <div className="grid grid-cols-2 gap-3 w-full">
            <Button 
                className="py-6 shadow-xl shadow-blue-900/40 border border-blue-400/30 rounded-2xl flex flex-col items-center justify-center gap-2"
                onClick={() => {
                    store.startNewDossier();
                }}
            >
                <FilePlus className="w-6 h-6" />
                <span className="font-bold sm:inline hidden">Nouveau Dossier</span>
                <span className="font-bold sm:hidden">Nouveau</span>
            </Button>

            <Button 
                variant="secondary"
                className="py-6 shadow-xl bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-600 rounded-2xl flex flex-col items-center justify-center gap-2"
                onClick={() => setViewingDossiers(true)}
            >
                <FolderOpen className="w-6 h-6 text-slate-300" />
                <span className="font-bold text-slate-100">Mes Dossiers</span>
            </Button>
        </div>

        {hasDraft && (
          <Button 
            variant="outline"
            className="py-4 mt-2 rounded-xl border-slate-700 bg-slate-800/40 hover:bg-slate-800"
            onClick={() => store.setField('currentStep', 1)}
          >
            <FileClock className="w-5 h-5 text-slate-400 mr-2" />
            <span className="font-semibold text-slate-300">Reprendre le brouillon actif</span>
          </Button>
        )}
      </div>
    </div>
  );
}
