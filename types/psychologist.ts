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
  reviews: {
    reviewer: string;
    comment: string;
    rating: number;
  }[];
}