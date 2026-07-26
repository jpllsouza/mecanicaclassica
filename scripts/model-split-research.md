# Pesquisa: separação de registros `models` que juntam vários carros

Relatório de pesquisa (não aplica nenhuma mudança no banco). Para cada um dos 4 casos: nomes de
modelo corretos, tabela motor→modelo(s) com ano, fontes e nível de confiança por linha.

Convenções de confiança:
- **Alta**: confirmado por 2+ fontes independentes e coerentes (ou fonte especializada + wiki concordando).
- **Média**: uma fonte razoável, ou fontes com pequena divergência (ex.: ±1 ano), ou inferência lógica bem fundamentada.
- **Baixa**: fonte única fraca, resumo de IA sobre página não verificada diretamente, ou lacuna que exigiria mais apuração.

---

## 1. Chevrolet "D-20 / C-20 / A-20 / Veraneio (Série 10 e Série 20)"

Arquivo: `FichasTecnicas/chevrolet_d20_veraneio.json`

### Achado central (muda a premissa do case)

D-20, C-20 e A-20 **não são carrocerias diferentes** — são a mesma picape (mesma cabine/caçamba/chassi),
diferenciada só pelo combustível: **D = Diesel, C = Gasolina ("Combustão"), A = Álcool**. Isso vale tanto
para a Série 10 (nomes C-10/D-10/A-10) quanto para a Série 20 (C-20/D-20/A-20), lançada em 1985 como
"upgrade" de estilo/robustez da Série 10, que continuou existindo em paralelo (10 = linha mais leve,
20 = mais robusta), ambas restilizadas em 1985.

Isso significa que **os motores anteriores a 1985 no arquivo não pertencem a "D-20/C-20/A-20"** (esses nomes
só existem a partir de 1985) — pertencem à família Série 10 (C-10, D-10, A-10) e à Veraneio. O registro atual
no banco força nomenclatura de Série 20 em motores de Série 10, o que é uma segunda camada de erro além da
simples fusão de carrocerias.

Nomes de modelo corretos a criar: **D-20, C-20, A-20, Veraneio** (conforme pedido). Adicionalmente
identificado mas fora do escopo pedido: **Bonanza** (irmã "econômica" da Veraneio, 2/3 portas com menos
vidros/acabamento, mesmo chassi/motorização) e a família **Série 10 (C-10/D-10/A-10)**, que não deveria ser
absorvida por nenhum dos 4 nomes acima.

### Tabela motor → modelo/ano

| Motor (registro atual no JSON) | Período no JSON | Modelo(s) correto(s) e ano | Confiança | Notas |
|---|---|---|---|---|
| "Chevrolet Brasil" 261 (4300cc) | 1964-1981 | **Não é D-20/C-20/A-20/Veraneio.** É **C-10/C-14** (picape Série 10, gasolina) e **Veraneio** (Série 10, fase antiga), 1964-1981 | Alta (para "não pertence à Série 20") / Média (para o resto) | O próprio JSON já registra `aplicacao: "Picape C-10/C-14, Veraneio (Série 10, fase antiga)"`, o que bate com a pesquisa. Nomenclatura D-20/C-20/A-20 não existia ainda. |
| 250 (4100, 6 cil.) gasolina/álcool | 1981-1994 | **1981-1985**: C-10/A-10 (Série 10 tardia) + Veraneio. **1985-1994 (ver ressalva de data abaixo)**: C-20 (gasolina) / A-20 (álcool) + Veraneio + Bonanza | Média | Fontes concordam que é o motor 6cc do Opala/Caravan aplicado a picapes/utilitários, mas nenhuma fonte encontrada detalha o corte exato mês/ano de quando a Série 10 tardia passou a se chamar Série 20 para este motor especificamente — assumido 1985 (ano de lançamento oficial da Série 20). |
| 4.1 Powertech injetado (Motronic) | 1994-1997 | **C-20** (gasolina) 1995-1996 e **A-20** (álcool) 1995 apenas (descontinuada por baixa demanda) | Média | pt.wikipedia (artigo "Chevrolet Série 20") diz textualmente que a versão injetada chegou em **1995**, só na versão a gasolina, e que a A-20 foi descontinuada "nesta ocasião" (1995) — diferente do "1994" que consta no JSON atual. Toda a linha D-20/C-20/A-20 foi descontinuada em **1996** (dando lugar à Silverado), não 1997 como sugere o JSON. **Divergência de datas entre o JSON atual e a Wikipédia (1994 vs 1995/1996) não resolvida com certeza — recomendo checagem adicional antes de gravar no banco.** Não encontrei nenhuma fonte que diga que a Veraneio recebeu este motor injetado — Veraneio/Bonanza foram descontinuadas por volta de 1994/1995 (fontes divergem: instacarro/roteironoticias dizem 1994; pt.wikipedia sugere 1995), possivelmente antes ou bem perto do lançamento da injeção. **Não incluir Veraneio nesta linha sem fonte melhor.** |
| Perkins Q20B4 (diesel) | 1985-1990/91 | **D-20** 1985-1990/91 (lançamento da Série 20 diesel). **Veraneio** só a partir de **1990** (não desde 1985) | Média | Um resumo de busca sobre um fórum especializado (picapesgm.com.br — não consegui abrir a página diretamente, erro de SSL, então é uma citação indireta via resumo de busca) afirma que a Veraneio só ganhou motor diesel (Perkins) em 1990, indo até 1991. O JSON atual já restringe a aplicação ao "D-20" e isso está coerente, mas **a existência de uma Veraneio Diesel entre 1990-1991 não está no JSON e merece um registro próprio** se for gravado no banco. |
| Iochpe-Maxion S4 (diesel aspirado) | 1990/92-1997 | **D-20** 1991/92-1994(-1997?). **Veraneio** 1992 (mesma fonte indireta acima) | Baixa/Média | Mesma ressalva do Perkins: fonte é um resumo indireto de fórum, não teve confirmação cruzada com uma segunda fonte independente sobre a aplicação em Veraneio. Além disso há divergência de datas: pt.wikipedia (Série 20) não fala em Veraneio diesel nenhuma vez; só a fonte de fórum fala. **Tratar aplicação em Veraneio como não confirmada com confiança alta.** |
| Iochpe-Maxion S4T (diesel turbo) | 1992-1994 | **D-20** 1992-1994/95. **Veraneio** possivelmente 1992-1994 (mesma ressalva acima) | Baixa/Média | Idem acima. |
| Iochpe-Maxion S4T-Plus (diesel turbo Euro-II) | 1994-1997 | **D-20** apenas, 1994/95-1996/97 | Alta (exclusivo D-20) | Veraneio já estava descontinuada (1994/95) quando este motor chegou — nenhuma fonte associa este motor à Veraneio. |

### Fontes consultadas
- https://pt.wikipedia.org/wiki/Chevrolet_S%C3%A9rie_20
- https://pt.wikipedia.org/wiki/Chevrolet_S%C3%A9rie_10
- https://www.portalsaofrancisco.com.br/automoveis/chevrolet-d-20
- https://www.portalsaofrancisco.com.br/automoveis/chevrolet-c-10
- http://www.picapesgm.com.br/forum/viewtopic.php?p=34003 (não abriu diretamente — erro SSL; usado só como referência indireta via resultado de busca, tratar com cautela)
- Resultados de busca (Google via WebSearch) citando instacarro.com/blog, roteironoticias.com.br, novoguscar.blogspot.com sobre fim de produção da Veraneio/Bonanza (1994 vs 1995 — não resolvido)

### Recomendação
Antes de gravar, revisar manualmente se vale a pena criar também os nomes **C-10 / D-10 / A-10** (Série 10)
para não forçar os motores pré-1985 dentro de "D-20/C-20/A-20", e considerar um registro separado para
**Bonanza**. Se o escopo ficar mesmo restrito aos 4 nomes pedidos, os motores pré-1985 (261 e parte do
250/4100) deveriam ficar de fora dessa migração específica, ou ser marcados como "Série 10" dentro do mesmo
nome por falta de opção melhor — mas isso é uma decisão de produto, não um fato histórico.

---

## 2. DKW-Vemag "Belcar / Vemaguet / Candango / Fissore / GT Malzoni"

Arquivo: `FichasTecnicas/dkw_vemag.json`

### Achado central
O motor "900" original (1956-1959) **não era vendido como "Belcar"** — o nome Belcar (e Vemaguet) só passou
a existir em **1961**, quando a Vemag renomeou o "Grande DKW-Vemag" (sedã) e a "Perua DKW-Vemag" (perua).
Antes disso, o carro se chamava **DKW-Vemag Universal** (sedã, lançado 1956/1958) e a perua era conhecida só
como "Perua DKW-Vemag"/"Camioneta DKW-Vemag". O próprio JSON já registra isso corretamente na `aplicacao` do
motor 900 ("DKW-Vemag Universal"), então a recomendação é **não** mapear o motor 900 para "Belcar" — ele
pertence a um nome anterior, fora do escopo dos 5 nomes pedidos.

O Candango é um caso à parte: nunca recebeu o motor "S" (1000 S) e sua produção **terminou em 1963**, bem
antes do fim da linha (1967). Isso significa que o motor "1000 (1960-1967)" do JSON não se aplica ao Candango
durante toda a janela 1960-1967 — só até 1963.

O GT Malzoni teve **duas variantes de motor**: uma "de rua" com o mesmo motor 1000 "S" (981cc) do
Fissore/Belcar S/Vemaguet S, e uma "de competição" com pistões maiores (1080cc, 77,5mm) — só esta segunda
está registrada no JSON atual (`"1000 'S' competição (GT Malzoni)"`). A versão de rua do GT Malzoni, se for
separada no banco, na verdade compartilha o mesmo motor do registro "Fissore/Belcar S/Vemaguet S", não precisa
de motor próprio.

Nomes de modelo corretos a criar: **Belcar, Vemaguet, Candango, Fissore, GT Malzoni** (conforme pedido).
Nome adicional identificado, fora do escopo pedido: **DKW-Vemag Universal** (predecessor do Belcar, 1956-1961).

### Tabela motor → modelo/ano

| Motor (registro atual no JSON) | Período no JSON | Modelo(s) correto(s) e ano | Confiança | Notas |
|---|---|---|---|---|
| 900 (motor original) | 1956-1959 | **Não é Belcar.** É **DKW-Vemag Universal** (sedã) e a "Perua DKW-Vemag" (predecessora da Vemaguet), 1956/58-1959 | Alta | pt.wikipedia (Belcar, Vemaguet) confirma que o nome "Belcar"/"Vemaguet" só surgiu em 1961; antes disso os carros eram "Grande DKW-Vemag"/Universal e "Perua DKW-Vemag". O JSON já registra isso certo na `aplicacao`. |
| 1000 (motor padrão) | 1960-1967 | **Belcar e Vemaguet**: 1961(*)-1967 (ano em que passaram a se chamar assim). **Candango**: 1960/61-**1963 apenas** (produção encerrada em 1963, não em 1967) | Alta (Candango até 1963) / Média (ano exato 1959 vs 1961 da troca 900→1000 e da renomeação) | pt.wikipedia (Belcar/Vemaguet) diz que o motor 1000cc chegou já em 1959 (ainda com os nomes antigos), e que a renomeação para Belcar/Vemaguet só ocorreu em 1961 — ou seja, por 1-2 anos o motor 1000cc já rodava sob o nome antigo, não "Belcar/Vemaguet". pt.wikipedia (Candango) confirma fim de produção do Candango em 1963 e cerca de 5.600 unidades, e não há qualquer menção ao Candango recebendo o motor "S". |
| 1000 'S' (Fissore/Belcar S/Vemaguet S) | 1964-1967 | **Fissore**: 1964-1967 (motor S durante toda a produção). **Belcar S** e **Vemaguet S**: **apenas 1967** (última série, lançada em setembro/1967, não 1964-1966) | Alta | pt.wikipedia (Belcar) diz explicitamente que o "Belcar S" foi a variante final, de 1967 apenas ("motor S" mais potente chegou só no último ano de produção); pt.wikipedia (Fissore) confirma toda a produção do Fissore (1964-1967) com o motor S. O JSON já tem essa nuance na própria `aplicacao` ("última série, 1967" para Belcar S/Vemaguet S) — mas o campo `periodo_producao: "1964-1967"` do registro pode induzir a marcar Belcar/Vemaguet S como válidos desde 1964, o que é incorreto. |
| 1000 'S' competição (GT Malzoni) | 1964-1966 | **GT Malzoni** (versão de competição, motor 1080cc), 1964-1966. Versão "de rua" do GT Malzoni usava o motor 1000 S de 981cc (mesma linha acima) | Média | pt.wikipedia (GT Malzoni) confirma produção 1964-1966 e cerca de 35 unidades no total, divididas entre versões de rua (motor 981cc "S", igual ao Fissore) e versões de competição (1080cc, pistões de 77,5mm). O JSON atual só documenta a variante 1080cc; a variante de rua do GT Malzoni não tem registro próprio (o que é aceitável, já que ela é idêntica ao motor do Fissore). |

### Fontes consultadas
- https://pt.wikipedia.org/wiki/DKW-Vemag_Belcar
- https://pt.wikipedia.org/wiki/DKW-Vemag_Vemaguet
- https://pt.wikipedia.org/wiki/DKW-Vemag_Candango
- https://pt.wikipedia.org/wiki/DKW-Vemag_Fissore
- https://pt.wikipedia.org/wiki/DKW-Vemag_GT_Malzoni
- Resultado de busca citando o Clube do Candango (dkwcandango.com.br) e oficinabrasil.com.br sobre datas/potências do Candango

---

## 3. Ford "Corcel / Corcel II"

Arquivo: `FichasTecnicas/ford_corcel.json`

### Datas de geração confirmadas
- **Corcel I**: 1968-1977 (lançado 1968, restilizado ao longo dos anos, mas mesma carroceria de 2 volumes).
- **Corcel II**: lançado no final de **1977** (ano-modelo 1978), carroceria totalmente nova.
- Em **1985**, a Corcel II perdeu o "II" do nome (voltou a se chamar apenas "Corcel"), com frente redesenhada
  para lembrar o Del Rey, e produção seguiu até **1986**.

Ou seja, há um **terceiro rótulo** ("Corcel", 1985-1986, sem o "II") que tecnicamente não é nem "Corcel I"
nem "Corcel II" — é relevante para os dois últimos motores da lista (1.6 CHT e 1.3 CHT, 1983-1986), cuja
janela cruza a fronteira 1985.

Nomes de modelo corretos a criar: **Corcel** (1968-1977, ger. I) e **Corcel II** (1977-1985), com nota sobre
o "Corcel" final (1985-1986) que reaproveitou o nome da geração I sem ser a mesma geração.

### Tabela motor → modelo/ano

| Motor (registro atual no JSON) | Período no JSON | Modelo(s) correto(s) e ano | Confiança | Notas |
|---|---|---|---|---|
| 1.3 Cléon-Fonte | 1968-1976 | **Corcel (geração I)**, 1968-1976 | Alta | Não cruza a fronteira de geração (Corcel II só começa no fim de 1977). Sem ambiguidade. |
| 1.4 Cléon-Fonte/Sierra | 1973-1983 | **Corcel (geração I)** 1973-1977 e **Corcel II** 1977/78-1983 (motor de entrada, mantido mesmo após a chegada do 1.6 em 1979/80) | Alta | Múltiplas fontes (comprecar.com.br, Ford 50 anos) confirmam que o Corcel II foi lançado em 1977/78 já com o 1.4 (72cv líquido) como único motor, e que ele seguiu como opção de entrada mesmo depois do 1.6 chegar. |
| 1.4 XP (GT) | 1973-1979 | **Corcel GT (geração I)** 1973-1977 e **Corcel II GT** 1977/78-1979 | Média/Alta | Fichas técnicas de terceiros confirmam existência de um "Ford Corcel II GT 1.4" em 1978 (ex.: revistaauto.com.br, brabocar.com.br, classicospremium.com.br), então o motor 1.4 XP seguiu equipando o GT durante os 2 primeiros anos da geração II, antes do 1.6 assumir o posto em 1980. Não achei fonte que detalhe se a potência/spec do motor mudou entre a versão Corcel I GT e a Corcel II GT 1978 (pode ter sido levemente detunada — uma fonte cita 57cv para o Corcel II GT 1978, bem abaixo dos 85cv brutos do JSON; não investigado a fundo, marcar como possível divergência de potência entre as duas gerações mesmo usando "o mesmo motor"). |
| 1.6 (pré-CHT) | 1979-1983 | **Corcel II** apenas, 1979/1980-1983 | Média | Toda a janela é Corcel II, sem ambiguidade de modelo. Único ponto: fontes divergem no ano exato de lançamento do 1.6 — uma busca indicou 1979, mas duas fontes independentes (comprecar.com.br e um resultado de busca citando o mesmo texto) indicam **1980**. Não é crítico para a separação de modelo (ambos os anos já são Corcel II), mas vale ajustar o `periodo_producao` se for mexer no registro. |
| 1.6 CHT | 1983/1984-1986 | **Corcel II** 1983/84-1985 e **"Corcel"** (nome sem "II", restilizado) 1985-1986 | Média | O corte exato em que o "II" saiu do nome (1985) foi encontrado em fonte secundária (retornar.com.br/carrosegaragem via busca), não verificado num texto de fonte primária/Wikipedia. Se o banco só tiver os nomes "Corcel" e "Corcel II" (sem um terceiro rótulo), o ideal é decidir manualmente se o final 1985-86 conta como "Corcel" ou continua taggeado "Corcel II" — arquiteturalmente pouco importa pois ambos são o mesmo motor/carroceria, é uma questão de rótulo comercial oficial. |
| 1.3 CHT | 1983-1986 | Mesma observação do 1.6 CHT acima: **Corcel II** 1983-1985 e **"Corcel"** 1985-1986 | Média | Idem. |

### Fontes consultadas
- https://www.comprecar.com.br/revista/o-historico-ford-corcel-e-corcel-ii
- https://media.ford.com/content/fordmedia/fsa/br/pt/news/2018/06/28/ford-corcel--50-anos-do-modelo-que-revolucionou-os-carros-medios.html (comunicado oficial Ford, resumo de busca — fetch direto expirou por timeout, tratar com cautela)
- https://brasilcaminhoneiro.com.br/corcel-50-anos-do-modelo-que-marcou-epoca-no-brasil/ (via resumo de busca)
- https://www.classicospremium.com.br/ford-corcel-ii-gt-1978-1978
- https://brabocar.com.br/ficha/auto/ford-corcel-ii-gt-1-4-1978
- https://www.revistaauto.com.br/ficha-tecnica-ford-corcel-gt-1-4-1978/
- https://retornar.com.br/ford-belina-historia-perua/ e https://www.carrosegaragem.com.br/ford-scala-a-belina-com-a-classe-do-del-rey/ (via resumo de busca, usados para confirmar o ano de queda do "II" do nome Corcel)

---

## 4. Ford "Del Rey / Belina (Scala até 1985) / Del Rey Ghia"

Arquivo: `FichasTecnicas/ford_delrey.json`

### Achado central
Confirma-se a hipótese do enunciado: **Del Rey e Belina compartilharam a mesma gama de motores do início ao
fim** (1981-1991) — inclusive o motor mais recente, **AP 1.8 (1989-1991)**, que o registro atual no banco
marca como exclusivo de "Del Rey Ghia, GLX", mas que a pesquisa mostra que também equipou a **Belina**
(vendida então já como "Del Rey Belina", nas versões L e Ghia). "Del Rey Ghia" **não é um modelo separado**,
é apenas o nível de acabamento de topo do Del Rey sedã — confirmado, nenhuma fonte trata "Ghia" como nome de
modelo à parte.

A perua teve uma sequência de nomes ao longo do tempo, todos com a mesma mecânica do Del Rey sedã:
- até 1981: "Corcel Belina" / "Belina II"
- 1981-1986: **Scala** (nome oficial "Del Rey Scala"), evolução direta do Belina, agora dentro da família Del Rey
- 1987 em diante: nome "Scala" abandonado, voltou a se chamar **"Del Rey Belina"** (idêntico ao Scala, só
  mudou o nome, por causa da popularidade do nome Belina)

Nomes de modelo corretos a criar: **Del Rey** (sedã) e **Belina** (perua — cobrindo Scala/Del Rey Belina como
o mesmo modelo, apenas com nomes comerciais diferentes por período). "Del Rey Ghia" deve continuar sendo
tratado como trim/versão dentro de "Del Rey", não como modelo.

### Tabela motor → modelo/ano

| Motor (registro atual no JSON) | Período no JSON | Modelo(s) correto(s) e ano | Confiança | Notas |
|---|---|---|---|---|
| CHT 1.6 pré-1983 | 1981-1983 | **Del Rey** e **Belina/Scala**, 1981-1983 (mesma motorização nas duas carrocerias) | Alta | O próprio JSON já lista `aplicacao: "Del Rey, Scala (versões Prata e Ouro)"` — pesquisa não encontrou nada que contradiga o compartilhamento. |
| CHT 1.6 pós-1983 | 1983-1989 | **Del Rey** e **Belina/Scala**, 1983-1989 | Alta | Idem — JSON já lista `"Del Rey L/GL/GLX/Ghia, Belina/Scala"`. |
| CHT E-Max 1.6 | 1987-1990 | **Del Rey** e **Belina** (já rebatizada "Del Rey Belina" nessa época), 1987-1990 | Alta | JSON já lista `"Del Rey L/GL/GLX, Belina"`. |
| AP 1.8 (VW EA827) | 1989-1991 | **Del Rey** (todas as versões, inclusive Ghia) **e Belina** ("Del Rey Belina" L e Ghia), 1989-1991 | Alta | **Correção ao JSON atual**, que lista `aplicacao` como só "Del Rey Ghia, GLX" — fichas técnicas de terceiros (jkcarros.com.br, carrosnaweb.com.br, mobiauto.com.br, automobile-catalog.com) mostram claramente "Ford Del Rey Belina Ghia 1.8" e "Belina L 1.8" para 1989-1991, ou seja, o motor AP 1.8 também equipou a perua, não só o sedã. Isso bate com a nota de mecânica compartilhada já presente no próprio JSON (`_nota`: "Motores compartilhados com Corcel/Escort... e depois com o Santana/Gol"). |

### Fontes consultadas
- https://pecamentor.com.br/ford-del-rey-1981-1991-versoes-motor-ficha-tecnica/
- https://www.bielaautopecas.com/post/ford-del-rey-1981-1991-versoes-motor-ficha-tecnica
- https://retornar.com.br/ford-belina-historia-perua/
- https://www.carrosegaragem.com.br/ford-scala-a-belina-com-a-classe-do-del-rey/
- https://jkcarros.com.br/ficha-tecnica-carros-ford-del-rey-belina-l-1-8-ano-1990/
- https://www.carrosnaweb.com.br/fichadetalhe.asp?codigo=14946 (Belina Ghia 1.8 1990)
- https://www.carrosnaweb.com.br/fichadetalhe.asp?codigo=8585 (Belina Ghia 1.8 1991)
- https://www.automobile-catalog.com/car/1989/985655/ford_del_rey_belina_ghia_1_8_alcool.html
- https://www.mobiauto.com.br/catalogo/carros/ford/del-rey-belina/1989/del-rey-belina-ghia-1-8

---

## Observações gerais sobre método

- Várias fontes foram acessadas via resultado resumido de busca (WebSearch), não sempre por leitura direta e
  integral da página (alguns fetches diretos falharam por erro de SSL, 404 ou timeout — sinalizado caso a
  caso acima). Isso é uma limitação real: resumos de busca podem simplificar ou, raramente, confundir datas.
  Onde isso ocorreu, o nível de confiança foi rebaixado explicitamente.
- Não foram localizados scans ou referências diretas de "Quatro Rodas" / "Oficina Mecânica" hospedados em
  Scribd/SlideShare/PDFCoffee ou blogs de colecionadores para nenhum dos 4 casos, apesar de buscas
  específicas nesse sentido — a Wikipédia em português e sites especializados de fichas técnicas
  (picapesgm.com.br, pecamentor.com.br, jkcarros.com.br, carrosnaweb.com.br) foram as fontes mais úteis
  disponíveis. Nenhum texto de revista foi copiado literalmente; todo o conteúdo acima é resumo/paráfrase dos
  fatos encontrados, sempre com a fonte indicada.
- Nenhuma correspondência foi inventada: onde a fonte não permitia confirmar com segurança (ex.: aplicação de
  motores diesel na Veraneio, ano exato de lançamento do 1.6 pré-CHT, potência do 1.4 XP na Corcel II), isso
  foi declarado explicitamente em vez de assumido.
