import React, { useState } from "react";
import HeaderNav from "@/components/layout/HeaderNav";
import { PageTitleSection, FilterSection, TemaSection } from "@/components/ui";

// Mock data
const temaer = [
  { id: 1, navn: "Arbeidsmiljø" },
  { id: 2, navn: "Sikkerhet" },
];
const tiltak = [
  { id: 1, tittel: "Sjekk brannslukker", beskrivelse: "Kontroller at brannslukker er på plass og i orden", temaId: 2 },
  { id: 2, tittel: "Vernerunde", beskrivelse: "Gjennomfør vernerunde i alle avdelinger", temaId: 1 },
  { id: 3, tittel: "Førstehjelpskurs", beskrivelse: "Arranger førstehjelpskurs for ansatte", temaId: 2 },
];

export default function TiltaksoversiktGenerelle() {
  const [selectedTema, setSelectedTema] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTemaer = selectedTema ? temaer.filter((t) => t.id === Number(selectedTema)) : temaer;

  const filteredTiltak = searchTerm
    ? tiltak.filter(
        (t) => t.tittel.toLowerCase().includes(searchTerm.toLowerCase()) || t.beskrivelse.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : tiltak;

  return (
    <div className="min-h-screen bg-white font-sans">
      <PageTitleSection title="Tiltaksoversikt generelle" subtitle="Liste over generelle tiltak" onNewTiltak={() => alert("Nytt tiltak")} />
      <FilterSection temaList={temaer} selectedTema={selectedTema} onTemaChange={setSelectedTema} onSearch={setSearchTerm} />
      <main className="py-6">
        {filteredTemaer.map((tema) => (
          <TemaSection
            key={tema.id}
            tema={tema}
            tiltakList={filteredTiltak.filter((t) => t.temaId === tema.id)}
            type="generell"
            onCopy={() => alert("Kopier til prosjekt")}
            onEdit={() => alert("Endre generelt tiltak")}
          />
        ))}

        {filteredTemaer.length === 0 && (
          <div className="text-center py-20 text-neutral-500">Ingen tema funnet med det valgte filteret.</div>
        )}

        {filteredTemaer.length > 0 && filteredTiltak.length === 0 && (
          <div className="text-center py-20 text-neutral-500">Ingen tiltak funnet som matcher søket.</div>
        )}
      </main>
    </div>
  );
}
