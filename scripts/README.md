# Agente de Fichas Tecnicas

Fluxo para buscar fichas tecnicas de carros vendidos no Brasil, revisar os dados extraidos e importar para o banco somente depois da validacao.

## Entrada

CSV com colunas:

```csv
make,model,year,trim
Chevrolet,Opala,1971,SS
Ford,Maverick,1974,V8
Volkswagen,Santana,1984,
```

Use aspas quando a versao tiver virgula:

```csv
make,model,year,trim
Volkswagen,Golf,2019,"Highline 1.4 TSI, Automatico"
```

## 1. Buscar e extrair

```powershell
node scripts/specs_agent.js --input data/vehicles.csv --out data/specs.jsonl --cache data/cache --throttle 3000
```

Por padrao, o agente busca primeiro sites oficiais brasileiros dos fabricantes. Se nao encontrar dados uteis, ele tenta acervos brasileiros escaneados/PDF e depois fontes brasileiras de apoio, como Carros na Web, iCarros, Quatro Rodas e Car Blog.

Parametros uteis:

- `--input`: CSV de entrada.
- `--out`: arquivo JSONL de saida.
- `--cache`: pasta para guardar HTML de busca, catalogo e detalhe.
- `--throttle`: pausa em ms entre veiculos. Use `3000` a `5000` para lotes maiores.
- `--max-catalog-links`: maximo de links de catalogo testados por veiculo.
- `--max-queries`: maximo de consultas ao buscador por veiculo. O padrao em `archive` e 18.
- `--sources`: `all`, `official`, `archive` ou `support`. Use `official` para pesquisar somente sites oficiais brasileiros, ou `archive` para pesquisar revistas, PDFs e acervos.

Exemplo buscando apenas fabricantes:

```powershell
node scripts/specs_agent.js --input data/vehicles.csv --out data/specs.jsonl --cache data/cache --throttle 3000 --sources official
```

Exemplo buscando apenas revistas/acervos/PDFs:

```powershell
node scripts/specs_agent.js --input data/vehicles.csv --out data/specs_archive.jsonl --cache data/cache --throttle 3000 --sources archive --max-queries 18
```

Cada linha de saida inclui:

- `status`: `found`, `archive_candidate`, `empty`, `not_found`, `captcha` ou `error`.
- `market`: sempre `BR` neste fluxo.
- `source_type`: `official_br`, `archive_br` ou `support_br`.
- `source_url`: URL escolhida como fonte.
- `confidence_score`: nota de 0 a 1 baseada em campos encontrados e compatibilidade com marca/modelo/ano/versao.
- `missing_fields`: campos importantes que nao foram encontrados.
- `specs`: dados prontos para revisar/importar.

Registros `archive_candidate` indicam PDF ou scan encontrado. Eles nao sao importados automaticamente; primeiro precisam de revisao/OCR para confirmar os dados da ficha tecnica.

## 2. Revisar antes de importar

```powershell
node scripts/import_specs.js --input data/specs.jsonl --url http://localhost:3000 --min-confidence 0.55
```

Por padrao, esse comando e um dry run: ele mostra os candidatos e nao grava no banco.

## 3. Importar de verdade

Com o servidor local rodando e a chave admin configurada:

```powershell
$env:ADMIN_KEY="sua-chave"
node scripts/import_specs.js --input data/specs.jsonl --url http://localhost:3000 --min-confidence 0.55 --apply
```

Tambem e possivel passar a chave pela linha de comando:

```powershell
node scripts/import_specs.js --input data/specs.jsonl --url http://localhost:3000 --admin-key sua-chave --apply
```

## Boas praticas

- Comece com 10 a 20 carros para calibrar a extracao.
- Revise `missing_fields` e `confidence_score` antes de importar.
- Use `--sources archive` para carros antigos, especialmente quando revistas como Quatro Rodas, Oficina Mecanica ou colecoes de fichas forem fontes melhores que sites atuais.
- Use o cache para evitar repetir buscas externas.
- Evite throttle baixo em lotes grandes para reduzir bloqueios por captcha.
