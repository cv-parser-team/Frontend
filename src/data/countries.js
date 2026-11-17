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
  .sort((a, b) => a.name.localeCompare(b.name));