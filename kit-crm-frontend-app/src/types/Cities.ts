export interface CityFormData {
    name: string;
    id?: number | null;
}

export interface CityData {
    id: number;
    name: string;
    createdAt: string;
    stateId: number;
    stateName?: string;
}

export interface CityProps {
    stateId: number;
    stateName?: string | null;
}