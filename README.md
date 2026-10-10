# RACHA

Treino, dieta e hábitos com os amigos, em dois times, valendo gol. App instalável no celular (iPhone e Android), sem loja.

## Como funciona

| Camada | Onde fica | O que faz |
|---|---|---|
| App | Este repositório, publicado no GitHub Pages | Telas. Abre na hora com os últimos dados guardados no aparelho e funciona sem internet |
| Servidor | Apps Script ligado a uma planilha Google (`servidor/`) | Login, lances, placar, VAR, resenha, desafios, fotos, leitura de PDF por IA e notificações |
| Dados | Planilha "RACHA" + pasta "RACHA · fotos do app" no Drive | Uma aba por assunto. Nada de dado pessoal fica neste repositório |

- Entrada: código de convite do grupo + nome + PIN. Login depois: nome + PIN. 5 erros bloqueiam 15 minutos.
- Na planilha ficam só hashes do PIN e das sessões.
- O app chama a API com POST e JSON em `text/plain`, como o RM e o Rumo.
- Lances e posts passam por uma fila no aparelho: sem internet, saem quando a conexão voltar.

Passo a passo para colocar no ar: [IMPLANTAR.md](IMPLANTAR.md).

## Arquivos

| Arquivo | Para quê |
|---|---|
| `index.html` | Estrutura e estilos (3 aparências: A Monumento, B Edição, C Estádio) |
| `config.js` | Endereço /exec da API |
| `nucleo.js` | Regras do placar, iguais no app e no servidor (cópia em `servidor/Nucleo.gs`, via `build.sh`) |
| `base.js` | Estado, armazenamento no aparelho, API, fila offline, sincronização, virada do dia, atributos |
| `telas.js` | Telas Hoje, Dieta, Treino, Hábitos e Racha |
| `paineis.js` | Painéis (card, atributos, VAR, dieta, treino, grupo, perfil, anamnese) |
| `acoes.js` | O que cada toque faz, login e inicialização |
| `push.js` | Notificações (Firebase Cloud Messaging) |
| `resultados.js` | Resultados: medidas do corpo, tendência do peso, gasto estimado, disciplina × resultado e os gráficos |
| `motor.js` | Ícones, Tabela TACO, animação dos exercícios, aparelhos, recorte da foto do card |
| `receitas.js` | Carrega as receitas do servidor e guarda no aparelho |
| `sw.js` | Guarda o app no aparelho e mostra as notificações. Trocar `VERSAO` a cada publicação |
| `servidor/*.gs` | Código do Apps Script |

## Pontuação

| Lance | Pts |
|---|---|
| Treino de musculação concluído | 50 |
| Recorde pessoal (até 3 por treino) | 10 |
| Corrida ou outro esporte | 35 |
| Refeição dentro do plano (até 5 por dia) | 5 |
| Dia dentro dos macros | 25 |
| Cada hábito cumprido (até 10 hábitos) | 5 |
| Dia perfeito de hábitos | 15 |

Quem calcula os pontos é o servidor, pela tabela acima (`N_oficial` em `nucleo.js`): o que o aparelho manda como pontuação é ignorado.

Cada 100 pontos do time viram 1 gol (80 no modo competitivo, em que só vale lance com foto). A rodada vai de segunda a domingo.

## Resultados

Peso, % de gordura, massa muscular e cintura, registrados pela pessoa (Perfil › Resultados ou o cartão na tela Hoje). **Só a própria pessoa vê**: os dados ficam no estado pessoal, não vão para o grupo. Registrar medidas dá XP, não pontos para o time.

- **Tendência do peso:** média móvel exponencial diária (α = 0,1), com os dias sem pesagem preenchidos em linha reta. É o número principal; a pesagem do dia aparece apagada no gráfico.
- **Disciplina por semana:** média diária de treino (nos dias de treino), dieta (refeições do plano ou macros fechados) e hábitos. O resumo de cada dia fica guardado por 2 anos.
- **Variação do peso por semana:** média centrada de 7 dias, que não tem o atraso da tendência e atribui a mudança à semana certa.
- **Disciplina × resultado:** compara semanas com 80% ou mais do plano com as outras. Aparece com 4 semanas completas, desde que haja semanas dos dois lados.
- **Gasto estimado:** média do que a pessoa registrou na dieta menos a variação da tendência × 7.700 kcal/kg, nas últimas 3 semanas (precisa de 14 dias com dieta registrada).

### Coach

No topo de Resultados (e no cartão da tela Hoje) aparecem insights gerados pelos dados da própria pessoa, sem IA e sem custo, em três grupos: **Mandando bem**, **Vale olhar** (sempre com uma ação concreta) e **Precisa de mais dados**. Referências: MacroFactor (ajusta pelos dados, sem julgar), Apple Fitness (tendências com dica do que fazer) e Strava (reconhece conquistas). Quando há pontos de atenção, pelo menos um positivo aparece junto.

| Regra | Quando |
|---|---|
| Ritmo ideal / rápido demais / platô | Perder: 0,5–1% do peso por semana é o ideal; acima de 1% arrisca músculo; parado com 80%+ do plano pede ajuste, parado com plano fraco pede cumprir mais dias. Ganhar: 0,25–0,5% por semana |
| Meta alcançada | A tendência passou da meta; a partir daí o objetivo vira manter |
| Disciplina × resultado | Semana atual (com 3 dias ou mais) ou a anterior abaixo de 80%, com a comparação das semanas boas e das outras |
| Composição | Gordura caindo com massa magra mantida; massa magra caindo mais de 1 kg; cintura caindo com o peso parado |
| Proteína | Meta do plano abaixo de 1,4 g/kg em déficit; meta batida em menos da metade dos dias registrados |
| Gasto real × meta | Déficit menor que 150 kcal ou maior que 1.000 kcal |
| Conquistas e balança | A cada 2 kg perdidos; semanas seguidas se pesando; pesagem 0,7 kg acima da anterior (água) |
| Dados | Sem pesagem há 10 dias ou mais; poucas pesagens; menos de 14 dias de dieta registrada |

## Receitas

As 108 receitas vêm do livro “200 Receitas pra Secar”, da nutricionista Patrícia Stênico (ingredientes e macros por porção; modo de preparo resumido com palavras próprias). Elas **não ficam neste repositório público**: vão num arquivo `Receitas.gs` colado só no Apps Script do grupo, e o app baixa depois do login. Uso restrito ao grupo de amigos. Para distribuir o app a terceiros, é preciso autorização da autora.
