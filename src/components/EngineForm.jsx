import { useState } from "react";

export default function EngineForm({ onCalculate }) {
  const [bore, setBore] = useState("");
  const [stroke, setStroke] = useState("");
  const [rod, setRod] = useState("");
  const [cylinders, setCylinders] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (bore && stroke && rod && cylinders) {
      onCalculate({
        bore: parseFloat(bore),
        stroke: parseFloat(stroke),
        rod: parseFloat(rod),
        cylinders: parseInt(cylinders, 10),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-gray-100 rounded-xl">
      <div>
        <label className="block text-sm">Diâmetro do pistão (mm)</label>
        <input type="number" value={bore} onChange={(e) => setBore(e.target.value)} className="w-full border rounded p-1"/>
      </div>

      <div>
        <label className="block text-sm">Curso do pistão (mm)</label>
        <input type="number" value={stroke} onChange={(e) => setStroke(e.target.value)} className="w-full border rounded p-1"/>
      </div>

      <div>
        <label className="block text-sm">Comprimento da biela (mm)</label>
        <input type="number" value={rod} onChange={(e) => setRod(e.target.value)} className="w-full border rounded p-1"/>
      </div>

      <div>
        <label className="block text-sm">Número de cilindros</label>
        <input type="number" value={cylinders} onChange={(e) => setCylinders(e.target.value)} className="w-full border rounded p-1"/>
      </div>

      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Calcular</button>
    </form>
  );
}
