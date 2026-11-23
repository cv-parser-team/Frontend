import {
  getCountries,
  getCountryCallingCode,
} from "libphonenumber-js";

const countryNames = new Intl.DisplayNames(["en"], {
  type: "region",
});

export const countries = getCountries()
  .map((isoCode) => ({
    isoCode,
    name: countryNames.of(isoCode),
    code: `+${getCountryCallingCode(isoCode)}`,
  }))
  .sort((a, b) => {
    const arabicPriority = [
      "PS", "JO", "SA", "AE", "KW", "QA", "BH", "OM", "YE",
      "EG", "IQ", "SY", "LB", "LY", "TN", "DZ", "MA", "SD",
      "MR", "DJ", "SO", "KM",
    ];
    const aPriority = arabicPriority.indexOf(a.isoCode);
    const bPriority = arabicPriority.indexOf(b.isoCode);

    if (aPriority !== -1 || bPriority !== -1) {
      if (aPriority === -1) return 1;
      if (bPriority === -1) return -1;
      return aPriority - bPriority;
    }

    return a.name.localeCompare(b.name);
  });