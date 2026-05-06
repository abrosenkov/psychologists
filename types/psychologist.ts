export interface Review {
  userName?: string;
  reviewer?: string;
  rating: number;
  text?: string;
  comment?: string;
  status: "pending" | "approved" | "rejected";
  createdAt?: number;
}

export interface Psychologist {
  id: string;
  name: string;
  specialization: string;
  avatar_url: string;
  experience: string;
  license: string;
  rating: number;
  price_per_hour: number;
  initial_consultation: string;
  about: string;
  reviews?: Record<string, Review>;
}