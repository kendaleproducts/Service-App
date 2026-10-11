/**
 * Daniel & Partners LLP — brand facts used across the app.
 *
 * Colours and type live in `src/app/globals.css` as CSS variables so they can
 * be swapped for the firm's official hex values in one place.
 */
export const firm = {
  name: "Daniel & Partners LLP",
  shortName: "Daniel & Partners",
  productName: "Daniel & Partners Online",
  tagline: "Committed to Your Success Since 1922",
  headline: "Building Trust Through Proven Results.",
  subheadline: "Dedicated Legal Expertise, Tailored To You.",
  foundedYear: 1922,
  values: ["Experience", "Dedication", "Integrity"],
  address: {
    line1: "300B Fourth Avenue, First Floor",
    city: "St. Catharines",
    province: "ON",
    postalCode: "L2S 0E6",
  },
  phone: "905-688-9411",
  tollFree: "1-800-263-3650",
  siteUrl: process.env.NEXT_PUBLIC_FIRM_SITE_URL ?? "https://niagaralaw.ca",
  siteLabel: "niagaralaw.ca",
  regulator: "Law Society of Ontario",
  timeZone: "America/Toronto",
} as const;

export const practiceAreas = [
  "Wills & Estates",
  "Real Estate",
  "Corporate & Commercial",
  "Employment Law",
  "Everyday Legal",
] as const;

export type PracticeArea = (typeof practiceAreas)[number];
