import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Photo {
  id: string;
  type: string;
  title: string;
  timestamp: string;
  imageBase64: string;
}

export interface StepSignature {
  technicienNom: string;
  technicienSignature: string;
  clientNom: string;
  clientSignature: string;
  dateSignature: string;
}

export interface DossierData {
  id: string;
  updatedAt: string;
  status: string; // 'Brouillon' | 'En cours' | 'Terminé' | 'Exporté'
  
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
  interventionType: string;
  statutDossier: string; // This is the old visual field, we keep it for backward compat or merge it? Let's keep it to not break UI.

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

  // --- NOUVEAUX CHAMPS CHIFFRAGE DEVIS ---
  prestationType: string; // 'fourniture_pose' | 'fourniture' | 'pose'
  coutMaterielHT: number;
  tauxHoraireMO: number;
  heuresMO: number;
  coutDeplacementHT: number;
  nacelleActive: boolean;
  coutNacelleHT: number;
  autresFraisHT: number;
  margePourcentage: number;
  tvaPourcentage: number;
  prixFinalManuel: number | null; 
  ajustementManuel: number;
  acompteDemande: boolean;
  acomptePourcentage: number;
  // ---------------------------------------

  dateIntervention: string;
  materielPrevu: string;
  natureTravaux: string;
  consignes: string;
  heureDebut: string;
  heureFin: string;
  dureeReelle: string;

  natureReelle: string;
  travauxRealises: string;
  materielUtilise: string;
  tempsPasse: string;
  anomalies: string;
  rapportReserves: string;
  observationsFinales: string;
  nomSignataireClient: string;
  fonctionSignataire: string;
  signatureClient: string;
  photos: Photo[];
  stepSignatures: Record<string, StepSignature>;
  currentStep: number;
}

export interface StoreState extends DossierData {
  dossierCounter: number;
  dossiers: Record<string, DossierData>;
  
  setField: (field: keyof DossierData, value: any) => void;
  saveCurrentDossier: () => void;
  loadDossier: (id: string) => void;
  deleteDossier: (id: string) => void;
  duplicateDossier: (id: string) => void;
  startNewDossier: () => void;
}

const initialDossierData: Omit<DossierData, 'id' | 'updatedAt' | 'numeroAffaire'> = {
  status: 'Brouillon',
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
  interventionType: '',
  statutDossier: 'en cours',

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

  prestationType: 'fourniture_pose',
  coutMaterielHT: 0,
  tauxHoraireMO: 65, // Standard rate
  heuresMO: 0,
  coutDeplacementHT: 0,
  nacelleActive: false,
  coutNacelleHT: 0,
  autresFraisHT: 0,
  margePourcentage: 30, // 30% default margin
  tvaPourcentage: 20, // 20% default TVA
  prixFinalManuel: null,
  ajustementManuel: 0,
  acompteDemande: false,
  acomptePourcentage: 30, // 30% default acompte

  dateIntervention: '',
  materielPrevu: '',
  natureTravaux: '',
  consignes: '',
  heureDebut: '',
  heureFin: '',
  dureeReelle: '',

  natureReelle: '',
  travauxRealises: '',
  materielUtilise: '',
  tempsPasse: '',
  anomalies: '',
  rapportReserves: '',
  observationsFinales: '',
  nomSignataireClient: '',
  fonctionSignataire: 'Client',
  signatureClient: '',
  photos: [],
  stepSignatures: {},
  currentStep: 0,
};

// Extrait uniquement les champs d'un dossier depuis le root state
const extractDossierData = (state: StoreState): DossierData => {
  const { dossiers, dossierCounter, setField, saveCurrentDossier, loadDossier, deleteDossier, duplicateDossier, startNewDossier, ...data } = state;
  return data as DossierData;
};

export const useDossierStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...initialDossierData,
      id: Date.now().toString(),
      numeroAffaire: '',
      updatedAt: new Date().toISOString(),
      
      dossiers: {},
      dossierCounter: 0,

      setField: (field, value) => set((state) => {
        // Auto-update status from Brouillon to En cours on first field change (if not just changing tabs)
        let newStatus = state.status;
        if (state.status === 'Brouillon' && field !== 'currentStep') {
            newStatus = 'En cours';
        }
        
        return { 
            ...state, 
            [field]: value, 
            status: newStatus,
            updatedAt: new Date().toISOString() 
        };
      }),

      saveCurrentDossier: () => set((state) => {
        const currentData = extractDossierData(state);
        // Ensure it doesn't save empty phantom dossiers at startup
        if (!currentData.numeroAffaire && !currentData.client) return state;
        
        return {
          dossiers: {
            ...state.dossiers,
            [currentData.id]: currentData
          }
        };
      }),

      loadDossier: (id) => set((state) => {
        const target = state.dossiers[id];
        if (!target) return state;
        return { ...state, ...target };
      }),

      deleteDossier: (id) => set((state) => {
        const newDossiers = { ...state.dossiers };
        delete newDossiers[id];
        return { dossiers: newDossiers };
      }),

      duplicateDossier: (id) => set((state) => {
        const target = state.dossiers[id];
        if (!target) return state;
        
        const nextCounter = (state.dossierCounter || 0) + 1;
        const year = new Date().getFullYear();
        const nextNum = `SN-${year}-${String(nextCounter).padStart(3, '0')}`;
        
        const duplicated: DossierData = {
          ...target,
          id: Date.now().toString(),
          numeroAffaire: nextNum,
          status: 'Brouillon',
          updatedAt: new Date().toISOString(),
          // Clear signatures
          signatureClient: '',
          stepSignatures: {}
        };
        
        return {
          ...state,
          dossiers: {
            ...state.dossiers,
            [duplicated.id]: duplicated
          },
          dossierCounter: nextCounter
        };
      }),

      startNewDossier: () => set((state) => {
        // Automatically save current one before starting new if it has data
        const currentData = extractDossierData(state);
        const newDossiers = { ...state.dossiers };
        
        if (currentData.numeroAffaire || currentData.client) {
            newDossiers[currentData.id] = currentData;
        }

        const nextCounter = (state.dossierCounter || 0) + 1;
        const year = new Date().getFullYear();
        const nextNum = `SN-${year}-${String(nextCounter).padStart(3, '0')}`;
        
        return {
          ...initialDossierData,
          id: Date.now().toString(),
          numeroAffaire: nextNum,
          updatedAt: new Date().toISOString(),
          status: 'Brouillon',
          currentStep: 1, // Skip direct to Infos
          dossierCounter: nextCounter,
          dossiers: newDossiers
        };
      }),
    }),
    {
      name: 'snimop-praxedo-storage',
    }
  )
);
