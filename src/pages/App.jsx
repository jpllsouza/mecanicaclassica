import { useState } from "react";
import EngineForm from "../components/EngineForm";
import EngineResults from "../components/EngineResults";
import { calculateDisplacement, calculateRL } from "../utils/calculations";

export default function App() {
  const [result, setResult] = useState(null);

  const handleCalculate = ({ bore, stroke, rod, cylinders }) => {
    const displacement = calculateDisplacement(bore, stroke, cylinders);
    const rl = calculateRL(rod, stroke);
    setResult({ displacement, rl });
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4 text-center">Calculadora de Motor</h1>
      <EngineForm onCalculate={handleCalculate} />
      {result && <EngineResults displacement={result.displacement} rl={result.rl} />}
    </div>
  );
}
