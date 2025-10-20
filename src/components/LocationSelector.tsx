'use client';

import { useState, useEffect } from 'react';
import { Country, State, City, ICountry, IState, ICity } from 'country-state-city';

interface LocationData {
  country: string;
  countryCode: string;
  state: string;
  stateCode: string;
  city: string;
}

interface Props {
  value?: LocationData;
  onChange: (location: LocationData) => void;
  required?: boolean;
}

export default function LocationSelector({ value, onChange, required = false }: Props) {
  const [countries, setCountries] = useState<ICountry[]>([]);
  const [states, setStates] = useState<IState[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);
  
  const [selectedCountry, setSelectedCountry] = useState(value?.countryCode || '');
  const [selectedState, setSelectedState] = useState(value?.stateCode || '');
  const [selectedCity, setSelectedCity] = useState(value?.city || '');

  // Load countries on mount
  useEffect(() => {
    const allCountries = Country.getAllCountries();
    setCountries(allCountries);
  }, []);

  // Load states when country changes
  useEffect(() => {
    if (selectedCountry) {
      const countryStates = State.getStatesOfCountry(selectedCountry);
      setStates(countryStates);
      
      // If the current state is not in the new list, reset it
      if (selectedState && !countryStates.find(s => s.isoCode === selectedState)) {
        setSelectedState('');
        setSelectedCity('');
        setCities([]);
      }
    } else {
      setStates([]);
      setSelectedState('');
      setSelectedCity('');
      setCities([]);
    }
  }, [selectedCountry]);

  // Load cities when state changes
  useEffect(() => {
    if (selectedCountry && selectedState) {
      const stateCities = City.getCitiesOfState(selectedCountry, selectedState);
      setCities(stateCities);
      
      // If the current city is not in the new list, reset it
      if (selectedCity && !stateCities.find(c => c.name === selectedCity)) {
        setSelectedCity('');
      }
    } else {
      setCities([]);
      setSelectedCity('');
    }
  }, [selectedState, selectedCountry]);

  // Notify parent of location changes
  useEffect(() => {
    if (selectedCountry && selectedState && selectedCity) {
      const country = countries.find(c => c.isoCode === selectedCountry);
      const state = states.find(s => s.isoCode === selectedState);
      
      if (country && state) {
        onChange({
          country: country.name,
          countryCode: country.isoCode,
          state: state.name,
          stateCode: state.isoCode,
          city: selectedCity,
        });
      }
    }
  }, [selectedCountry, selectedState, selectedCity]);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCountry(e.target.value);
    setSelectedState('');
    setSelectedCity('');
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedState(e.target.value);
    setSelectedCity('');
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCity(e.target.value);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Country</label>
        <select
          value={selectedCountry}
          onChange={handleCountryChange}
          required={required}
          className="w-full glass-light px-4 py-3 rounded-xl border-0 focus:ring-2 focus:ring-foreground/20 outline-none"
        >
          <option value="">Select a country</option>
          {countries.map((country) => (
            <option key={country.isoCode} value={country.isoCode}>
              {country.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">State/Province</label>
        <select
          value={selectedState}
          onChange={handleStateChange}
          disabled={!selectedCountry}
          required={required}
          className="w-full glass-light px-4 py-3 rounded-xl border-0 focus:ring-2 focus:ring-foreground/20 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Select a state/province</option>
          {states.map((state) => (
            <option key={state.isoCode} value={state.isoCode}>
              {state.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">City</label>
        <select
          value={selectedCity}
          onChange={handleCityChange}
          disabled={!selectedState}
          required={required}
          className="w-full glass-light px-4 py-3 rounded-xl border-0 focus:ring-2 focus:ring-foreground/20 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Select a city</option>
          {cities.map((city) => (
            <option key={city.name} value={city.name}>
              {city.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export { type LocationData };

