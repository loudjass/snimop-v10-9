"use client";
import React from 'react';
import { useDossierStore } from '@/store/useDossierStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { SnimopLogo } from '@/components/ui/SnimopLogo';

export function DocumentTemplate() {
  const store = useDossierStore();
  
  // Choose what to render based on store.typeDoc
  return (
    <div className="bg-white p-8 font-sans text-gray-900 w-[800px] min-h-[1100px] shadow-sm mb-4 relative overflow-hidden" id="pdf-content">
      {/* Watermark in preview */}
      <div className="absolute inset-x-0 bottom-20 z-0 pointer-events-none flex justify-center opacity-[0.04]">
        <img src="/snimop-mascote.png" alt="" className="w-96 object-contain" />
      </div>

      <div className="relative z-10">
        {/* Header SNIMOP */}
        <div className="flex justify-between items-end border-b-2 border-blue-900 pb-4 mb-6">
          <div className="flex items-center gap-6 bg-transparent">
            <SnimopLogo className="w-40" />
            <img src="/snimop-mascote.png" alt="" className="h-10 w-auto object-contain opacity-80" />
          </div>
          <div className="text-right text-sm">
            <p className="font-bold">Dossier N° {store.numeroAffaire}</p>
            <p>Le {store.date ? format(new Date(store.date), 'dd MMMM yyyy', { locale: fr }) : ''}</p>
          </div>
        </div>

      {/* Document Title */}
      <div className="text-center mb-8 bg-blue-50 py-3 rounded-sm border border-blue-100 flex flex-col gap-1">
        <h2 className="text-2xl font-bold uppercase tracking-wider text-blue-900">{store.typeDoc}</h2>
        <div className="flex justify-center gap-4 text-sm font-medium mt-1 text-gray-700">
          <p>Intervention : {store.objet}</p>
          {store.interventionType && <p>• Type : <span className="font-bold">{store.interventionType}</span></p>}
          {store.statutDossier && <p>• Statut : <span className="font-bold text-blue-800 uppercase">{store.statutDossier}</span></p>}
        </div>
      </div>

      {/* Client Info Grid */}
      <div className="grid grid-cols-2 gap-6 mb-8 text-sm border-b pb-6">
        <div>
          <h3 className="font-bold text-gray-500 uppercase text-xs mb-2">Informations Client</h3>
          <p><span className="font-semibold">Client :</span> {store.client}</p>
          <p><span className="font-semibold">Contact :</span> {store.contact} ({store.telephone})</p>
          <p><span className="font-semibold">Email :</span> {store.email}</p>
        </div>
        <div>
          <h3 className="font-bold text-gray-500 uppercase text-xs mb-2">Informations Chantier</h3>
          <p><span className="font-semibold">Site :</span> {store.site}</p>
          <p><span className="font-semibold">Adresse :</span> {store.adresse}</p>
          <p><span className="font-semibold">Technicien :</span> {store.technicien}</p>
        </div>
      </div>

      {/* Dynamic Content based on typeDoc */}
      <div className="mb-10 text-sm flex flex-col gap-6">
        {store.typeDoc === 'VISITE AVANT DEVIS' && (
          <>
            <Section title="Contexte et Constat" content={store.constat || store.contexte} />
            <Section title="Équipement concerné" content={store.equipement} />
            <Section title="Observations techniques" content={store.observations} />
            <Section title="Travaux préconisés" content={store.travauxPreconises} />
            <Section title="Matériel envisagé" content={store.materielEnvisage} />
            <div className="grid grid-cols-2 gap-4">
              <Section title="Main d'œuvre estimée" content={store.moEstimee} />
              <Section title="Déplacement" content={store.deplacement} />
            </div>
            <Section title="Option nacelle" content={store.optionNacelle} />
            <Section title="Remarques" content={store.remarques} />
          </>
        )}

        {store.typeDoc === 'DEVIS' && (
          <>
            <Section title="Descriptif des travaux" content={store.descriptifTravaux} />
            <Section title="Matériel prévu" content={store.devisMateriel} />
            <div className="grid grid-cols-3 gap-4">
              <Section title="Main d'œuvre" content={store.devisMo} />
              <Section title="Déplacement" content={store.devisDeplacement} />
              <Section title="Options" content={store.devisOptions} />
            </div>
            <Section title="Réserves / Exclusions" content={store.reserves} />
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md">
              <Section title="Conditions de règlement" content={store.conditionsReglement} />
              <Section title="Délai de réalisation" content={store.delai} />
            </div>
            {store.bonPourAccord && (
              <div className="text-center font-bold text-lg mt-4 text-blue-800">
                BON POUR ACCORD
              </div>
            )}
          </>
        )}

        {store.typeDoc === "BON D'INTERVENTION" && (
          <>
            <Section title="Date prévue" content={store.dateIntervention} />
            <div className="grid grid-cols-2 gap-4">
              <Section title="Horaires prévus" content={store.heureDebut && store.heureFin ? `De ${store.heureDebut} à ${store.heureFin}` : ''} />
            </div>
            <Section title="Nature des travaux" content={store.natureTravaux} />
            <Section title="Matériel prévu" content={store.materielPrevu} />
            <Section title="Consignes / Remarques" content={store.consignes} />
          </>
        )}

        {store.typeDoc === "RAPPORT D'INTERVENTION" && (
          <>
            <Section title="Nature réelle de l'intervention" content={store.natureReelle} />
            <Section title="Travaux réalisés" content={store.travauxRealises} />
            <Section title="Matériel utilisé" content={store.materielUtilise} />
            <div className="grid grid-cols-2 gap-4">
              <Section title="Horaires" content={store.heureDebut && store.heureFin ? `De ${store.heureDebut} à ${store.heureFin}` : ''} />
              <Section title="Durée (Heures)" content={store.dureeReelle || store.tempsPasse} />
              <Section title="Anomalies constatées" content={store.anomalies} />
            </div>
            <Section title="Réserves" content={store.rapportReserves} />
            <Section title="Observations finales" content={store.observationsFinales} />
          </>
        )}
      </div>

      {/* Signature Section */}
      <div className="mt-8 flex justify-end">
        <div className="w-1/2 border p-4 rounded-md min-h-[200px] flex flex-col relative bg-gray-50">
          <p className="font-bold text-sm mb-1 text-gray-700">Signature Client</p>
          <p className="text-xs text-gray-500 mb-2">
            Nom : {store.nomSignataireClient || store.contact || store.client} {store.fonctionSignataire && `(${store.fonctionSignataire})`}
          </p>
          {store.signatureClient ? (
            <img src={store.signatureClient} alt="" className="max-h-32 object-contain mix-blend-multiply" />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-300 italic">Signature absente</div>
          )}
        </div>
      </div>
      
      {/* Photos Annexes */}
      {store.photos && store.photos.length > 0 && (
        <div className="mt-12" style={{ pageBreakBefore: 'always' }}>
          <div className="flex justify-between items-end border-b-2 border-blue-900 pb-4 mb-6">
            <h2 className="text-2xl font-bold uppercase tracking-wider text-blue-900">ANNEXE PHOTOS</h2>
            <p className="text-sm font-bold text-gray-500">Dossier N° {store.numeroAffaire}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {store.photos.map((photo, idx) => (
              <div key={idx} className="border border-gray-300 rounded-md overflow-hidden aspect-video flex items-center justify-center bg-gray-50 p-2">
                <img src={photo} alt={`Annexe ${idx + 1}`} className="max-w-full max-h-full object-contain" />
              </div>
            ))}
          </div>
        </div>
      )}

      </div>
    </div>
  );
}

function Section({ title, content }: { title: string, content?: string }) {
  if (!content) return null;
  return (
    <div className="mb-2">
      <h3 className="font-bold text-gray-800 mb-1">{title}</h3>
      <p className="whitespace-pre-wrap text-gray-600 border-l-2 border-slate-200 pl-3 py-1">{content}</p>
    </div>
  );
}
