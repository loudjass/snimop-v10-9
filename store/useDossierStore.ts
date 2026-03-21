import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DossierState {
  dossierCounter: number;
  numeroAffaire: string;
  date: string;
  client: string;
  site: string;
  adresse: string;
  contact: string;
  telephone: string;
  email: string;
  technicien: string;
  objet: string;
  typeDoc: string;

  contexte: string;
  constat: string;
  equipement: string;
  observations: string;
  travauxPreconises: string;
  materielEnvisage: string;
  moEstimee: string;
  deplacement: string;
  optionNacelle: string;
  remarques: string;

  descriptifTravaux: string;
  devisMateriel: string;
  devisMo: string;
  devisDeplacement: string;
  devisOptions: string;
  reserves: string;
  conditionsReglement: string;
  delai: string;
  bonPourAccord: boolean;

  dateIntervention: string;
  materielPrevu: string;
  natureTravaux: string;
  consignes: string;

  natureReelle: string;
  travauxRealises: string;
  materielUtilise: string;
  tempsPasse: string;
  anomalies: string;
  rapportReserves: string;
  observationsFinales: string;
  nomSignataireClient: string;
  signatureClient: string;
  currentStep: number;

  setField: (field: keyof DossierState, value: any) => void;
  resetDossier: () => void;
  startNewDossier: () => void;
}

const initialState = {
  numeroAffaire: '',
  date: new Date().toISOString().split('T')[0],
  client: '',
  site: '',
  adresse: '',
  contact: '',
  telephone: '',
  email: '',
  technicien: '',
  objet: '',
  typeDoc: 'VISITE AVANT DEVIS',

  contexte: '',
  constat: '',
  equipement: '',
  observations: '',
  travauxPreconises: '',
  materielEnvisage: '',
  moEstimee: '',
  deplacement: '',
  optionNacelle: '',
  remarques: '',

  descriptifTravaux: '',
  devisMateriel: '',
  devisMo: '',
  devisDeplacement: '',
  devisOptions: '',
  reserves: '',
  conditionsReglement: 'Règlement à réception de facture',
  delai: '',
  bonPourAccord: false,

  dateIntervention: '',
  materielPrevu: '',
  natureTravaux: '',
  consignes: '',

  natureReelle: '',
  travauxRealises: '',
  materielUtilise: '',
  tempsPasse: '',
  anomalies: '',
  rapportReserves: '',
  observationsFinales: '',
  nomSignataireClient: '',
  signatureClient: '',
  currentStep: 0,
};

export const useDossierStore = create<DossierState>()(
  persist(
    (set) => ({
      ...initialState,
      dossierCounter: 0,
      setField: (field, value) => set((state) => ({ ...state, [field]: value })),
      resetDossier: () => set((state) => ({ ...initialState, dossierCounter: state.dossierCounter })),
      startNewDossier: () => set((state) => {
        const nextCounter = (state.dossierCounter || 0) + 1;
        const year = new Date().getFullYear();
        const nextNum = `SN-${year}-${String(nextCounter).padStart(3, '0')}`;
        return {
          ...initialState,
          dossierCounter: nextCounter,
          numeroAffaire: nextNum,
          currentStep: 1
        };
      }),
    }),
    {
      name: 'snimop-dossier-storage',
    }
  )
);
