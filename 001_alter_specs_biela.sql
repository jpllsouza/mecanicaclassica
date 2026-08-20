-- Roda isso no SQL Editor do Neon ANTES de importar os JSONs.
-- Adiciona campos que faltavam para o simulador de desempenho (biela/r-l)
-- e uma coluna "raw_data" para guardar tudo que veio nos JSONs sem perder nada,
-- já que os 21 arquivos têm nomes de campo levemente diferentes entre si
-- (ex: potência varia por combustível em alguns modelos, não em outros).

ALTER TABLE specs
  ADD COLUMN IF NOT EXISTS rod_length_mm NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS rod_ratio NUMERIC(6,4),
  ADD COLUMN IF NOT EXISTS raw_data JSONB,
  ADD COLUMN IF NOT EXISTS sources TEXT;

COMMENT ON COLUMN specs.rod_length_mm IS 'Comprimento de biela, centro a centro (mm)';
COMMENT ON COLUMN specs.rod_ratio IS 'Relação biela/manivela (r/l) = (curso/2) / comprimento_biela';
COMMENT ON COLUMN specs.raw_data IS 'JSON original completo da motorização, incluindo campos não estruturados nas colunas acima (ex: potência por combustível, variantes de alimentação)';
COMMENT ON COLUMN specs.sources IS 'Fontes consultadas para essa ficha, separadas por vírgula';
