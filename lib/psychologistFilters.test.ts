import { describe, expect, it } from "vitest";
import {
  filterPsychologists,
  getPsychologistRating,
  parseNumber,
  sortKeyForListing,
  sortPsychologists,
} from "./psychologistFilters";
import type { Psychologist } from "@/types/psychologist";

const base: Psychologist = {
  id: "1",
  name: "B",
  specialization: "x",
  avatar_url: "",
  experience: "1",
  license: "y",
  rating: 4.0,
  price_per_hour: 15,
  initial_consultation: "",
  about: "",
  reviews: [],
};

const a: Psychologist = { ...base, id: "a", name: "Anna", rating: 4.8, price_per_hour: 5 };
const b: Psychologist = { ...base, id: "b", name: "Zoe", rating: 4.0, price_per_hour: 12 };

describe("parseNumber", () => {
  it("parses comma decimals", () => {
    expect(parseNumber("4,5")).toBe(4.5);
  });
});

describe("getPsychologistRating", () => {
  it("uses reviews average when top-level rating is missing", () => {
    const p = {
      ...base,
      id: "c",
      name: "Carl",
      rating: undefined as unknown as number,
      reviews: [
        { reviewer: "x", comment: "", rating: 5 },
        { reviewer: "y", comment: "", rating: 4 },
      ],
    } as Psychologist;
    expect(getPsychologistRating(p)).toBe(4.5);
  });
});

describe("filterPsychologists", () => {
  it("filters by price lt10", () => {
    expect(filterPsychologists([a, b], { price: "lt10" })).toEqual([a]);
  });

  it("filters by rating popular", () => {
    expect(filterPsychologists([a, b], { rating: "popular" })).toEqual([a]);
  });

  it("not-popular includes below 4.5 and unknown rating", () => {
    const noRating = {
      ...base,
      id: "n",
      name: "N",
      rating: undefined as unknown as number,
      reviews: [],
    } as Psychologist;
    expect(filterPsychologists([a, b, noRating], { rating: "not-popular" })).toEqual([
      b,
      noRating,
    ]);
  });
});

describe("sortKeyForListing", () => {
  it("maps popular to rating-desc", () => {
    expect(sortKeyForListing("name-asc", "popular")).toBe("rating-desc");
  });

  it("maps not-popular to rating-asc", () => {
    expect(sortKeyForListing("name-asc", "not-popular")).toBe("rating-asc");
  });

  it("uses URL sort when no rating filter", () => {
    expect(sortKeyForListing("name-desc", undefined)).toBe("name-desc");
  });
});

describe("sortPsychologists", () => {
  it("sorts A–Z", () => {
    expect(sortPsychologists([b, a], "name-asc").map((p) => p.name)).toEqual([
      "Anna",
      "Zoe",
    ]);
  });

  it("sorts Z–A", () => {
    expect(sortPsychologists([a, b], "name-desc").map((p) => p.name)).toEqual([
      "Zoe",
      "Anna",
    ]);
  });

  it("sorts by rating high to low", () => {
    expect(sortPsychologists([b, a], "rating-desc").map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("sorts by rating low to high", () => {
    expect(sortPsychologists([a, b], "rating-asc").map((p) => p.id)).toEqual(["b", "a"]);
  });
});
