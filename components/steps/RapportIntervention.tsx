"use client";
import React, { useEffect } from 'react';
import { useDossierStore } from '@/store/useDossierStore';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ArrowRight, Camera, X } from 'lucide-react';

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

  // Auto-calcul de la durée
  useEffect(() => {
    if (store.heureDebut && store.heureFin) {
      const [sh, sm] = store.heureDebut.split(':').map(Number);
      const [eh, em] = store.heureFin.split(':').map(Number);
      if (!isNaN(sh) && !isNaN(sm) && !isNaN(eh) && !isNaN(em)) {
        let diffMinutes = (eh * 60 + em) - (sh * 60 + sm);
        if (diffMinutes < 0) diffMinutes += 24 * 60;
        const hoursFloat = diffMinutes / 60;
        const formatted = hoursFloat % 1 === 0 ? hoursFloat.toString() : hoursFloat.toFixed(2);
        store.setField('dureeReelle', formatted);
        store.setField('tempsPasse', formatted);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.heureDebut, store.heureFin]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            store.setField('photos', [...store.photos, event.target.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...store.photos];
    newPhotos.splice(index, 1);
    store.setField('photos', newPhotos);
  };

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Heure d'arrivée" type="time" value={store.heureDebut} onChange={(e: any) => store.setField('heureDebut', e.target.value)} />
          <Input label="Heure de départ" type="time" value={store.heureFin} onChange={(e: any) => store.setField('heureFin', e.target.value)} />
          <Input label="Durée réelle (h)" type="number" step="0.25" value={store.dureeReelle || store.tempsPasse} onChange={(e: any) => { store.setField('dureeReelle', e.target.value); store.setField('tempsPasse', e.target.value); }} placeholder="Auto calcul ou manuel" />
        </div>
        <Textarea label="Anomalies constatées" value={store.anomalies} onChange={(e: any) => store.setField('anomalies', e.target.value)} />
        <Textarea label="Réserves" value={store.rapportReserves} onChange={(e: any) => store.setField('rapportReserves', e.target.value)} />
        <Textarea label="Observations finales" value={store.observationsFinales} onChange={(e: any) => store.setField('observationsFinales', e.target.value)} />
        
        {/* Section Photos */}
        <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-700/50">
          <label className="text-sm font-bold text-slate-300 ml-1">Photos du chantier</label>
          <div className="flex flex-wrap gap-4 mt-2">
            {store.photos.map((photo, idx) => (
              <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-600">
                <img src={photo} alt="" className="w-full h-full object-cover" />
                <button 
                  onClick={() => removePhoto(idx)} 
                  className="absolute top-1 right-1 bg-red-500 rounded-full p-1 text-white shadow-md hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <label className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-600 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800/50 transition-colors bg-slate-900/40 text-slate-400 hover:text-white">
              <Camera className="w-8 h-8 mb-1" />
              <span className="text-[10px] font-semibold text-center leading-tight">Ajouter<br />Photo</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-4">
        <Button variant="outline" onClick={handlePrev} className="px-6"><ArrowLeft className="w-5 h-5 mr-1" /> Retour</Button>
        <Button onClick={handleNext} className="px-10 text-lg">Finir <ArrowRight className="w-6 h-6 ml-1" /></Button>
      </div>
    </div>
  );
}
