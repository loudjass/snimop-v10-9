import React from 'react';
import { useDossierStore, Photo } from '@/store/useDossierStore';
import { Camera, X } from 'lucide-react';
import { format } from 'date-fns';

export function PhotoManager() {
  const store = useDossierStore();

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const newPhoto: Photo = {
                id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
                type: 'Avant',
                title: '',
                timestamp: new Date().toISOString(),
                imageBase64: event.target.result as string
            };
            store.setField('photos', [...store.photos, newPhoto]);
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

  const updatePhoto = (index: number, field: keyof Photo, value: string) => {
    const newPhotos = [...store.photos];
    // @ts-ignore
    newPhotos[index] = { ...newPhotos[index], [field]: value };
    store.setField('photos', newPhotos);
  };

  return (
    <div className="flex flex-col gap-4 mt-6 pt-6 border-t border-slate-700">
      <label className="text-sm font-bold text-slate-300 ml-1">Photos du dossier</label>
      
      <div className="flex flex-col gap-4">
        {store.photos.map((photo, idx) => (
          <div key={photo.id || idx} className="relative w-full rounded-2xl border border-slate-600/50 p-3 bg-slate-800/40 flex flex-col sm:flex-row gap-4 items-start shadow-inner focus-within:ring-2 focus-within:ring-blue-500/30 transition-all">
            <div className="w-full sm:w-32 h-40 sm:h-32 flex-shrink-0 relative rounded-xl overflow-hidden border border-slate-700 bg-slate-900 group">
              <img src={photo.imageBase64 || (photo as unknown as string)} alt="" className="w-full h-full object-cover" />
              <button 
                onClick={() => removePhoto(idx)} 
                className="absolute top-2 right-2 bg-red-500/90 rounded-full p-2 text-white shadow-lg hover:bg-red-600 transition-colors opacity-100 sm:opacity-0 group-hover:opacity-100"
                title="Supprimer la photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 flex flex-col gap-3 w-full">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-1 rounded bg-slate-700/80 text-blue-300 drop-shadow-sm border border-slate-600">Image {idx + 1}</span>
                {photo.timestamp && (
                   <span className="text-[11px] text-slate-400 italic font-medium">Capture le {format(new Date(photo.timestamp), 'dd/MM/yyyy à HH:mm')}</span>
                )}
              </div>
              
              <div className="flex flex-col gap-3">
                <select
                  className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-600 focus:border-blue-500 text-sm font-semibold text-white outline-none transition-colors shadow-inner"
                  value={photo.type || 'Avant'}
                  onChange={(e) => updatePhoto(idx, 'type', e.target.value)}
                >
                  <option value="Avant" className="bg-slate-800 text-white">📸 Etat Avant Intervention</option>
                  <option value="Pendant" className="bg-slate-800 text-white">👷 En cours d'Intervention</option>
                  <option value="Après" className="bg-slate-800 text-white">✨ Etat Après Intervention</option>
                  <option value="Plan" className="bg-slate-800 text-white">📄 Plan / Schéma / Doc</option>
                  <option value="Autre" className="bg-slate-800 text-white">📌 Autre illustration</option>
                </select>
                
                <input
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-600 focus:border-blue-500 text-sm text-white outline-none w-full transition-colors shadow-inner placeholder:text-slate-500"
                  placeholder="Titre ou description (apparaîtra sur le PDF)"
                  value={photo.title || ''}
                  onChange={(e) => updatePhoto(idx, 'title', e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <label className="w-full sm:w-auto px-6 h-14 rounded-xl border-2 border-dashed border-emerald-500/50 flex md:inline-flex items-center justify-center gap-3 cursor-pointer hover:bg-emerald-500/10 hover:border-emerald-400 transition-all bg-slate-900/60 text-emerald-400 hover:text-emerald-300 mt-2 shadow-sm self-start">
        <Camera className="w-6 h-6" />
        <span className="text-sm font-bold uppercase tracking-wide">Prendre / Ajouter une photo</span>
        <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
      </label>
    </div>
  );
}
