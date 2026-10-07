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
| Cada hábito cumprido | 5 |
| Dia perfeito de hábitos | 15 |

Cada 100 pontos do time viram 1 gol (80 no modo competitivo, em que só vale lance com foto). A rodada vai de segunda a domingo.

## Receitas

As 108 receitas vêm do livro “200 Receitas pra Secar”, da nutricionista Patrícia Stênico (ingredientes e macros por porção; modo de preparo resumido com palavras próprias). Elas **não ficam neste repositório público**: vão num arquivo `Receitas.gs` colado só no Apps Script do grupo, e o app baixa depois do login. Uso restrito ao grupo de amigos. Para distribuir o app a terceiros, é preciso autorização da autora.
