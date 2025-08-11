import React, { useState } from 'react';
import { createTiltak } from '../../api/endpoints';
import { getThemeClasses } from '../../hooks/useTheme';

export default function TiltakForm({ onSuccess }) {
  const [tittel, setTittel] = useState('');
  const [beskrivelse, setBeskrivelse] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createTiltak({ tittel, beskrivelse, generell: true });
    setTittel('');
    setBeskrivelse('');
    if (onSuccess) onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="my-4 space-y-2">
      <h2 className="text-xl font-semibold">Nytt tiltak</h2>
      <input
        type="text"
        placeholder="Tittel"
        className="border p-2 w-full"
        value={tittel}
        onChange={(e) => setTittel(e.target.value)}
        required
      />
      <textarea
        placeholder="Beskrivelse"
        className="border p-2 w-full"
        value={beskrivelse}
        onChange={(e) => setBeskrivelse(e.target.value)}
      />
      <button className={`${getThemeClasses.button.primary} px-4 py-2`}>Opprett</button>
    </form>
  );
}