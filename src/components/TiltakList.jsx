import React, { useEffect, useState } from 'react';
import React from 'react';
import { getTiltak, deleteTiltak } from '../api/endpoints';

export default function TiltakList() {
  const [tiltak, setTiltak] = useState([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const res = await getTiltak();
    setTiltak(res.data);
  };

  const handleDelete = async (id) => {
    await deleteTiltak(id);
    load();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold my-2">Generelle tiltak</h2>
      {tiltak.filter(t => t.generell).map(t => (
        <div key={t.id} className="p-2 border my-1 flex justify-between">
          <div>
            <strong>{t.tittel}</strong><br />
            <small>{t.beskrivelse}</small>
          </div>
          <button className="text-red-500" onClick={() => handleDelete(t.id)}>Slett</button>
        </div>
      ))}
    </div>
  );
}