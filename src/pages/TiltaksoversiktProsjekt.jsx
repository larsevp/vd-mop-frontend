import React, { useState } from "react";
import HeaderNav from "@/components/layout/HeaderNav";
import { PageTitleSection, FilterSection, TemaSection } from "@/components/ui";

// Mock data
const temaer = [
  { id: 1, navn: "Arbeidsmiljø" },
  { id: 2, navn: "Sikkerhet" },
];
const tiltak = [
  {
    id: 1,
    tittel: "Sjekk brannslukker",
    beskrivelse: "Kontroller at brannslukker er på plass og i orden",
    temaId: 2,
    implementasjon: "Utført månedlig",
    avklaringer: "Ingen",
    vurdering: ["Bra"],
  },
  {
    id: 2,
    tittel: "Vernerunde",
    beskrivelse: "Gjennomfør vernerunde i alle avdelinger",
    temaId: 1,
    implementasjon: "",
    avklaringer: "",
    vurdering: [],
  },
];

export default function TiltaksoversiktProsjekt() {
  const [selectedTema, setSelectedTema] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [tiltakState, setTiltakState] = useState(tiltak);

  const filteredTemaer = selectedTema ? temaer.filter((t) => t.id === Number(selectedTema)) : temaer;

  const filteredTiltak = searchTerm
    ? tiltakState.filter(
        (t) =>
          t.tittel.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.beskrivelse.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.implementasjon?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.avklaringer?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : tiltakState;

  const handleVurderingChange = (tiltakId, val) => {
    setTiltakState((ts) =>
      ts.map((t) =>
        t.id === tiltakId
          ? { ...t, vurdering: t.vurdering.includes(val) ? t.vurdering.filter((v) => v !== val) : [...t.vurdering, val] }
          : t
      )
    );
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <PageTitleSection
        title="Tiltaksoversikt prosjektspesifikke"
        subtitle="Liste over tiltak for prosjektet"
        onNewTiltak={() => alert("Nytt tiltak")}
        onCopy={() => alert("Kopier fra generelt tiltak")}
        showCopy
      />
      <FilterSection temaList={temaer} selectedTema={selectedTema} onTemaChange={setSelectedTema} onSearch={setSearchTerm} />
      <main className="py-6">
        {filteredTemaer.map((tema) => (
          <TemaSection
            key={tema.id}
            tema={tema}
            tiltakList={filteredTiltak.filter((t) => t.temaId === tema.id)}
            type="prosjekt"
            onRemove={() => alert("Fjern tiltak")}
            onEdit={() => alert("Endre prosjekttiltak")}
            onEditImpl={() => alert("Endre implementasjon")}
            vurderingChange={(val) => handleVurderingChange(tema.id, val)}
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
