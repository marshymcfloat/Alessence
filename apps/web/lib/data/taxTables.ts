
export const INCOME_TAX_TABLE_2023 = [
  { limit: 250000, rate: 0, distinct: 0 },
  { limit: 400000, rate: 0.15, distinct: 0 },
  { limit: 800000, rate: 0.20, distinct: 22500 },
  { limit: 2000000, rate: 0.25, distinct: 102500 },
  { limit: 8000000, rate: 0.30, distinct: 402500 },
  { limit: Infinity, rate: 0.35, distinct: 2202500 },
];

export const CORP_TAX_RATES = {
  CREATE: {
    domestic: {
      regular: 0.25,
      msme: 0.20 // Net taxable income <= 5M & Total Assets <= 100M
    },
    foreign: {
      resident: 0.25,
      nonResident: 0.25
    }
  },
  PRE_CREATE: {
    domestic: 0.30,
    foreign: 0.30
  }
};

export const VAT_THRESHOLD = 3000000;
export const VAT_RATE = 0.12;
