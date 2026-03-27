"use client";
import React, { useState } from 'react';
import { useDossierStore } from '@/store/useDossierStore';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SignaturePad } from '@/components/SignaturePad';
import { ArrowLeft, ArrowRight, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { PhotoManager } from '@/components/ui/PhotoManager';
import { StepSignatureZone } from '@/components/ui/StepSignatureZone';
import { generateVisitePdf, triggerDownload } from '@/utils/pdfGenerators';

// ─── Composant helpers ───────────────────────────────────────────
const selectCls = "px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-900/60 border border-white/10 text-white font-medium w-full shadow-inner";

interface CheckGroupProps {
  options: { key: string; label: string }[];
  selected: string[];
  onChange: (val: string[]) => void;
}
const CheckGroup = ({ options, selected, onChange }: CheckGroupProps) => {
  const toggle = (key: string) => {
    const next = selected.includes(key) ? selected.filter(k => k !== key) : [...selected, key];
    onChange(next);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(({ key, label }) => (
        <label
          key={key}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer transition-all text-sm font-medium select-none ${
            selected.includes(key)
              ? 'bg-blue-600/30 border-blue-500/60 text-blue-200'
              : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-700/50'
          }`}
        >
          <input
            type="checkbox"
            className="hidden"
            checked={selected.includes(key)}
            onChange={() => toggle(key)}
          />
          <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${selected.includes(key) ? 'bg-blue-500 border-blue-400' : 'border-slate-600'}`}>
            {selected.includes(key) && <span className="text-white text-[9px] font-black">✓</span>}
          </span>
          {label}
        </label>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────
export function VisiteAvantDevis() {
  const store = useDossierStore();
  const [isModalitesOpen, setIsModalitesOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleNext = () => store.setField('currentStep', 3);
  const handlePrev = () => store.setField('currentStep', 1);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await generateVisitePdf(store);
      triggerDownload(blob, `SNIMOP_Visite_${store.numeroAffaire || 'SansRef'}.pdf`);
    } catch (e: any) {
      alert('Erreur export PDF Visite : ' + (e.message || String(e)));
    } finally {
      setIsExporting(false);
    }
  };

  // Helpers toggle arrays
  const toggleArray = (field: string, val: string) => {
    const current: string[] = ((store as any)[field] as string[]) || [];
    const next = current.includes(val) ? current.filter((v: string) => v !== val) : [...current, val];
    store.setField(field as any, next);
  };

  return (
    <div className="flex flex-col gap-6 py-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-slate-200 tracking-widest uppercase drop-shadow-lg">
          Visite avant devis
        </h2>
        <Button
          onClick={handleExport}
          isLoading={isExporting}
          variant="outline"
          className="gap-2 text-sm px-4 py-2 border-blue-500/30 text-blue-300 hover:bg-blue-600/10"
        >
          <Download className="w-4 h-4" />
          Exporter PDF Visite
        </Button>
      </div>

      {/* ── Champs existants ─────────────────────────────── */}
      <div className="bg-[#0f172a]/70 backdrop-blur-2xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-slate-700/50 flex flex-col gap-6">
        <Textarea label="Contexte / Demande client" value={store.contexte} onChange={(e: any) => store.setField('contexte', e.target.value)} placeholder="Ex: Panne signalée..." />
        <Textarea label="Constat sur place" value={store.constat} onChange={(e: any) => store.setField('constat', e.target.value)} placeholder="Ce qui a été observé" />
        <Input label="Équipement concerné" value={store.equipement} onChange={(e: any) => store.setField('equipement', e.target.value)} placeholder="Machine, modèle, réf" />
        <Textarea label="Observations" value={store.observations} onChange={(e: any) => store.setField('observations', e.target.value)} />
        <Textarea label="Travaux à réaliser" value={store.travauxPreconises} onChange={(e: any) => store.setField('travauxPreconises', e.target.value)} placeholder="Actions à mener" />
        <Textarea label="Matériel nécessaire" value={store.materielEnvisage} onChange={(e: any) => store.setField('materielEnvisage', e.target.value)} placeholder="Liste du matériel nécessaire" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Main d'œuvre estimée" value={store.moEstimee} onChange={(e: any) => store.setField('moEstimee', e.target.value)} placeholder="Ex: 4 heures" />
          <Input label="Déplacement" value={store.deplacement} onChange={(e: any) => store.setField('deplacement', e.target.value)} placeholder="Ex: Forfait Zone 1" />
        </div>

        <div className="flex flex-col gap-1.5 mt-2">
          <label className="text-sm font-bold text-slate-300 ml-1">Option nacelle</label>
          <select className={selectCls} value={store.optionNacelle} onChange={(e) => store.setField('optionNacelle', e.target.value)}>
            <option value="" className="bg-slate-800 text-white">Non préconisé</option>
            <option value="Oui" className="bg-slate-800 text-white">Oui</option>
            <option value="À charge du client" className="bg-slate-800 text-white">À charge du client</option>
            <option value="Fournie par SNIMOP" className="bg-slate-800 text-white">Fournie par SNIMOP</option>
          </select>
        </div>

        <Textarea label="Remarques complémentaires" value={store.remarques} onChange={(e: any) => store.setField('remarques', e.target.value)} />
        <PhotoManager />
      </div>

      {/* ── MODALITÉS D'INTERVENTION ─────────────────────── */}
      <div className="bg-[#0f172a]/70 backdrop-blur-2xl rounded-3xl border border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.4)] overflow-hidden">
        {/* Accordéon header */}
        <button
          onClick={() => setIsModalitesOpen(!isModalitesOpen)}
          className="w-full flex items-center justify-between p-6 text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
            <h3 className="text-xl font-black text-blue-300 tracking-widest uppercase">
              Modalités d'Intervention
            </h3>
          </div>
          <div className="text-slate-400 group-hover:text-white transition-colors">
            {isModalitesOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </button>

        {isModalitesOpen && (
          <div className="px-6 pb-6 flex flex-col gap-5 border-t border-slate-700/50 pt-5">

            {/* Site */}
            <Input
              label="Site"
              value={store.modalitesSite}
              onChange={(e: any) => store.setField('modalitesSite', e.target.value)}
              placeholder="Nom du site / lieu"
            />

            {/* Installation */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-300 ml-1">Installation</label>
              <div className="flex gap-3">
                {[{ k: 'neuf', l: 'Neuf' }, { k: 'renovation', l: 'Rénovation' }].map(({ k, l }) => (
                  <label key={k} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-all font-medium ${store.modalitesInstallation === k ? 'bg-blue-600/30 border-blue-500/60 text-blue-200' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>
                    <input type="radio" name="installation" className="hidden" checked={store.modalitesInstallation === k} onChange={() => store.setField('modalitesInstallation', k)} />
                    <span className={`w-3.5 h-3.5 rounded-full border flex-shrink-0 ${store.modalitesInstallation === k ? 'bg-blue-500 border-blue-400' : 'border-slate-600'}`} />
                    {l}
                  </label>
                ))}
              </div>
            </div>

            {/* Démontage */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-300 ml-1">Démontage</label>
              <CheckGroup
                options={[{ key: 'Enlèvement', label: 'Enlèvement' }, { key: 'Mise en décharge', label: 'Mise en décharge' }]}
                selected={store.modalitesDemontage || []}
                onChange={(v) => store.setField('modalitesDemontage', v)}
              />
            </div>

            {/* Élévation */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-300 ml-1">Élévation / Manutention</label>
              <CheckGroup
                options={[
                  { key: 'Manutention personnes', label: 'Manutention personnes' },
                  { key: 'Chariot (loc)', label: 'Chariot (loc)' },
                  { key: 'Échafaudage (loc)', label: 'Échafaudage (loc)' },
                  { key: 'Échafaudage (Snimop)', label: 'Échafaudage (Snimop)' },
                  { key: 'Nacelle (loc)', label: 'Nacelle (loc)' },
                  { key: 'Nacelle (Snimop)', label: 'Nacelle (Snimop)' },
                ]}
                selected={store.modalitesElevation || []}
                onChange={(v) => store.setField('modalitesElevation', v)}
              />
            </div>

            {/* Espace */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-300 ml-1">Espace</label>
              <CheckGroup
                options={[{ key: 'Mise en place totale', label: 'Mise en place totale' }, { key: 'Possibilité allégée', label: 'Possibilité allégée' }]}
                selected={store.modalitesEspace || []}
                onChange={(v) => store.setField('modalitesEspace', v)}
              />
            </div>

            {/* Conditions */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-300 ml-1">Conditions chantier</label>
              <CheckGroup
                options={[
                  { key: 'Boutique', label: 'Boutique' },
                  { key: 'Centre commercial', label: 'Centre commercial' },
                  { key: 'Dépôt / Entreprise', label: 'Dépôt / Entreprise' },
                ]}
                selected={store.modalitesConditions || []}
                onChange={(v) => store.setField('modalitesConditions', v)}
              />
            </div>

            {/* Contraintes horaires */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-300 ml-1">Contraintes horaires</label>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Heure d'ouverture" type="time" value={store.modalitesHeureOuverture} onChange={(e: any) => store.setField('modalitesHeureOuverture', e.target.value)} />
                <Input label="Heure de fermeture" type="time" value={store.modalitesHeureFermeture} onChange={(e: any) => store.setField('modalitesHeureFermeture', e.target.value)} />
              </div>
            </div>

            {/* Permis */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-300 ml-1">Permis requis</label>
              <CheckGroup
                options={[{ key: 'Permis Travail', label: 'Permis Travail' }, { key: 'Permis Feu', label: 'Permis Feu' }]}
                selected={store.modalitesPermis || []}
                onChange={(v) => store.setField('modalitesPermis', v)}
              />
            </div>

            {/* Stationnement */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-300 ml-1">Stationnement</label>
              <CheckGroup
                options={[
                  { key: 'Payant', label: 'Payant' },
                  { key: 'Voie livraison', label: 'Voie livraison' },
                  { key: 'Non prévu', label: 'Non prévu' },
                ]}
                selected={store.modalitesStationnement || []}
                onChange={(v) => store.setField('modalitesStationnement', v)}
              />
            </div>

            {/* Risques */}
            <Textarea
              label="Risques identifiés"
              value={store.modalitesRisques}
              onChange={(e: any) => store.setField('modalitesRisques', e.target.value)}
              placeholder="Décrire les risques spécifiques au chantier..."
            />

            {/* Signature chargé d'affaire */}
            <div className="flex flex-col gap-2 mt-2">
              <label className="text-sm font-bold text-slate-300 ml-1">Signature chargé d'affaire</label>
              <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 p-2">
                <SignaturePad
                  key={store.modalitesSignatureCharge ? 'sig-ok' : 'sig-no'}
                  initialDataUrl={store.modalitesSignatureCharge}
                  onSave={(url) => store.setField('modalitesSignatureCharge', url)}
                />
              </div>
            </div>

          </div>
        )}
      </div>

      <StepSignatureZone stepKey="visite" title="Visite Constat" />

      <div className="flex justify-between mt-4">
        <Button variant="outline" onClick={handlePrev} className="px-6"><ArrowLeft className="w-5 h-5 mr-1" /> Retour</Button>
        <Button onClick={handleNext} className="px-10 text-lg">Suivant <ArrowRight className="w-6 h-6 ml-1" /></Button>
      </div>
    </div>
  );
}
