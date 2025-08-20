export default function EngineResults({ displacement, rl }) {
  return (
    <div className="p-4 mt-4 bg-white shadow rounded-xl">
      <h2 className="text-lg font-semibold mb-2">Resultados</h2>
      <p><strong>Deslocamento:</strong> {displacement.toFixed(1)} cm³</p>
      <p><strong>R/L:</strong> {rl.toFixed(3)}</p>

      {rl > 0.3 && (
        <p className="text-red-600 font-bold mt-2">
          ⚠ Atenção: R/L maior que 0,3!
        </p>
      )}
    </div>
  );
}
