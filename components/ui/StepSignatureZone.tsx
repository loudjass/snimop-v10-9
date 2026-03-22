import React from 'react';
import { useDossierStore, StepSignature } from '@/store/useDossierStore';
import { Input } from '@/components/ui/Input';
import { SignaturePad } from '@/components/SignaturePad';
import { Copy, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
  stepKey: string;
  title: string;
}

export function StepSignatureZone({ stepKey, title }: Props) {
  const store = useDossierStore();
  const currentSig = store.stepSignatures[stepKey] || {
    technicienNom: 'Alexandre Janicot',
    technicienSignature: '',
    clientNom: store.nomSignataireClient || store.contact || store.client || '',
    clientSignature: '',
    dateSignature: ''
  };

  const setSigField = (field: keyof StepSignature, value: string) => {
    store.setField('stepSignatures', {
      ...store.stepSignatures,
      [stepKey]: {
        ...currentSig,
        [field]: value,
        dateSignature: new Date().toISOString()
      }
    });
  };

  const handleCopyPrevious = () => {
    const stepsOrder = ['informations', 'visite', 'devis', 'intervention', 'rapport'];
    const currentIndex = stepsOrder.indexOf(stepKey);
    let previousSig: StepSignature | null = null;
    
    // Find the closest previous signature
    for (let i = currentIndex - 1; i >= 0; i--) {
        const prevKey = stepsOrder[i];
        if (store.stepSignatures[prevKey] && (store.stepSignatures[prevKey].technicienSignature || store.stepSignatures[prevKey].clientSignature)) {
            previousSig = store.stepSignatures[prevKey];
            break;
        }
    }

    if (previousSig) {
        if (window.confirm("Voulez-vous copier la signature de l'étape précédente ?")) {
            store.setField('stepSignatures', {
                ...store.stepSignatures,
                [stepKey]: {
                    technicienNom: previousSig.technicienNom || currentSig.technicienNom,
                    technicienSignature: previousSig.technicienSignature,
                    clientNom: previousSig.clientNom || currentSig.clientNom,
                    clientSignature: previousSig.clientSignature,
                    dateSignature: new Date().toISOString()
                }
            });
        }
    } else {
        alert("Aucune signature précédente trouvée.");
    }
  };

  return (
    <div className="mt-8 bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
        <h3 className="text-xl flex items-center gap-2 font-bold text-slate-100">
          <CheckCircle2 className="text-emerald-400 w-6 h-6" />
          Validation : {title}
        </h3>
        <button 
          onClick={handleCopyPrevious}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 border border-slate-600 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-blue-600/30 hover:border-blue-500/50 transition-all"
        >
          <Copy className="w-4 h-4" />
          Copier précédente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Technicien */}
        <div className="flex flex-col gap-4">
          <Input 
            label="Nom de l'Intervenant"
            value={currentSig.technicienNom}
            onChange={(e: any) => setSigField('technicienNom', e.target.value)}
          />
          <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-700 relative pb-1">
            <span className="absolute top-2 left-3 text-xs font-bold text-slate-500 pointer-events-none z-10">SIGNATURE INTERVENANT</span>
            <div className="pt-2">
              <SignaturePad
                key={currentSig.technicienSignature ? 'tsig-ok' : 'tsig-no'}
                initialDataUrl={currentSig.technicienSignature}
                onSave={(url) => setSigField('technicienSignature', url)}
              />
            </div>
          </div>
        </div>

        {/* Client */}
        <div className="flex flex-col gap-4">
          <Input 
            label="Nom du Client"
            value={currentSig.clientNom}
            onChange={(e: any) => setSigField('clientNom', e.target.value)}
          />
          <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-700 relative pb-1">
            <span className="absolute top-2 left-3 text-xs font-bold text-slate-500 pointer-events-none z-10">SIGNATURE CLIENT</span>
            <div className="pt-2">
              <SignaturePad
                key={currentSig.clientSignature ? 'csig-ok' : 'csig-no'}
                initialDataUrl={currentSig.clientSignature}
                onSave={(url) => setSigField('clientSignature', url)}
              />
            </div>
          </div>
        </div>
      </div>

      {currentSig.dateSignature && (currentSig.technicienSignature || currentSig.clientSignature) && (
        <div className="mt-4 text-xs text-right text-slate-400 italic">
          Dernière signature le {format(new Date(currentSig.dateSignature), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
        </div>
      )}
    </div>
  );
}
