"use client";
import React from 'react';
import { useDossierStore } from '@/store/useDossierStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export function InformationsGenerales() {
  const store = useDossierStore();

  const handleNext = () => store.setField('currentStep', 2);
  const handlePrev = () => store.setField('currentStep', 0);

  return (
    <div className="flex flex-col gap-6 py-2">
      <h2 className="text-3xl md:text-4xl font-black border-b border-white/10 pb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-slate-200 tracking-widest uppercase drop-shadow-lg">
        Informations générales
      </h2>
      
      <div className="bg-[#0f172a]/70 backdrop-blur-2xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-slate-700/50 flex flex-col gap-6">
        <Input label="Numéro d'affaire / Réf dossier" value={store.numeroAffaire} onChange={(e: any) => store.setField('numeroAffaire', e.target.value)} placeholder="Ex: SN-2024-001" />
        <Input label="Date" type="date" value={store.date} onChange={(e: any) => store.setField('date', e.target.value)} />
        <Input label="Client" value={store.client} onChange={(e: any) => store.setField('client', e.target.value)} placeholder="Nom de l'entreprise ou client" />
        <Input label="Site / Chantier" value={store.site} onChange={(e: any) => store.setField('site', e.target.value)} placeholder="Lieu de l'intervention" />
        <Input label="Adresse" value={store.adresse} onChange={(e: any) => store.setField('adresse', e.target.value)} placeholder="Adresse du chantier" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Contact client" value={store.contact} onChange={(e: any) => store.setField('contact', e.target.value)} placeholder="Nom du contact" />
          <Input label="Téléphone" type="tel" value={store.telephone} onChange={(e: any) => store.setField('telephone', e.target.value)} placeholder="06..." />
        </div>
        
        <Input label="Email" type="email" value={store.email} onChange={(e: any) => store.setField('email', e.target.value)} placeholder="contact@email.com" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Technicien" value={store.technicien} onChange={(e: any) => store.setField('technicien', e.target.value)} placeholder="Votre nom" />
          <div className="flex flex-col gap-1.5 mt-2">
            <label className="text-sm font-bold text-slate-300 ml-1">Type d'intervention</label>
            <select 
              className="px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-slate-900/60 backdrop-blur-sm border border-white/10 text-white font-medium w-full shadow-inner"
              value={store.interventionType}
              onChange={(e) => store.setField('interventionType', e.target.value)}
            >
              <option value="" disabled className="bg-slate-800 text-slate-400">Sélectionner...</option>
              <option value="Dépannage" className="bg-slate-800 text-white">Dépannage</option>
              <option value="Maintenance" className="bg-slate-800 text-white">Maintenance</option>
              <option value="Installation" className="bg-slate-800 text-white">Installation</option>
              <option value="Devis" className="bg-slate-800 text-white">Devis / Étude</option>
              <option value="Autre" className="bg-slate-800 text-white">Autre</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Objet / Intitulé intervention" value={store.objet} onChange={(e: any) => store.setField('objet', e.target.value)} placeholder="Titre de la mission" />
          <div className="flex flex-col gap-1.5 mt-2">
            <label className="text-sm font-bold text-slate-300 ml-1">Statut du dossier</label>
            <select 
              className="px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-slate-900/60 backdrop-blur-sm border border-white/10 text-white font-medium w-full shadow-inner"
              value={store.statutDossier}
              onChange={(e) => store.setField('statutDossier', e.target.value)}
            >
              <option value="En cours" className="bg-slate-800 text-white">En cours</option>
              <option value="Terminé" className="bg-slate-800 text-white">Terminé</option>
              <option value="Signé" className="bg-slate-800 text-white">Signé</option>
            </select>
          </div>
        </div>
        
        <div className="flex flex-col gap-1.5 mt-2">
          <label className="text-sm font-bold text-slate-300 ml-1">Type de document principal</label>
          <p className="text-xs text-slate-500 mb-1 ml-1 font-medium">Cochez le document que vous allez principalement utiliser, vous pourrez tout exporter à la fin.</p>
          <select 
            className="px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-slate-900/60 backdrop-blur-sm border border-white/10 text-white font-medium w-full shadow-inner"
            value={store.typeDoc}
            onChange={(e) => store.setField('typeDoc', e.target.value)}
          >
            <option value="VISITE AVANT DEVIS" className="bg-slate-800 text-white">Visite avant devis</option>
            <option value="DEVIS" className="bg-slate-800 text-white">Devis</option>
            <option value="BON D'INTERVENTION" className="bg-slate-800 text-white">Bon d'intervention</option>
            <option value="RAPPORT D'INTERVENTION" className="bg-slate-800 text-white">Rapport d'intervention</option>
          </select>
        </div>
      </div>

      <div className="flex justify-between mt-4">
        <Button variant="outline" onClick={handlePrev} className="px-6"><ArrowLeft className="w-5 h-5 mr-1" /> Quitter</Button>
        <Button onClick={handleNext} className="px-10 text-lg">Suivant <ArrowRight className="w-6 h-6 ml-1" /></Button>
      </div>
    </div>
  );
}
