# Como colocar o RACHA no ar

São 4 partes. As partes 1 e 2 levam uns 15 minutos e já deixam o app funcionando. As partes 3 e 4 (IA do PDF e notificações) podem ser feitas depois.

| Parte | O que faz | Tempo |
|---|---|---|
| 1. Servidor | Planilha + Apps Script: guarda os dados do grupo | 10 min |
| 2. App | GitHub Pages + endereço do servidor no `config.js` | 5 min |
| 3. Leitura do PDF | Chave de IA na planilha | 5 min |
| 4. Notificações | Firebase (dá para reaproveitar o do RM) | 10 min |

---

## 1. Servidor (planilha + Apps Script)

1. No Google Drive, crie uma planilha nova chamada **RACHA**.
2. Na planilha: **Extensões › Apps Script**.
3. No editor, crie 6 arquivos (botão **+** › Script), com estes nomes e o conteúdo dos arquivos da pasta `servidor/` deste repositório:

   | Arquivo no Apps Script | Copiar de |
   |---|---|
   | `Nucleo` | `servidor/Nucleo.gs` |
   | `Api` | `servidor/Api.gs` |
   | `Dados` | `servidor/Dados.gs` |
   | `IA` | `servidor/IA.gs` |
   | `Push` | `servidor/Push.gs` |
   | `Receitas` | arquivo `Receitas.gs` enviado à parte (não fica no repositório, que é público) |

   Pelo celular: abra `https://raw.githubusercontent.com/brunomathias8-droid/racha/main/servidor/Api.gs` no Safari, toque e segure › Selecionar tudo › Copiar. Repita para cada arquivo.
4. Apague o arquivo `Código.gs` que veio vazio.
5. No topo, escolha a função **configurar** e toque em **Executar**. Na primeira vez o Google pede autorização: **Revisar permissões › sua conta › Avançado › Acessar RACHA (não seguro) › Permitir**. É o seu próprio script pedindo acesso à sua planilha e ao seu Drive.
6. O registro de execução mostra o **código de convite** (ex.: `K7X2QM`). Ele também fica na aba **Config** da planilha.
7. **Implantar › Nova implantação** › tipo **App da Web**:
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
8. Copie o endereço que termina em **/exec**.

> "Qualquer pessoa" só quer dizer que o app consegue chamar o servidor sem login do Google. Os dados continuam protegidos: tudo exige nome + PIN, e na planilha o PIN e as sessões ficam só como hash.

## 2. App (GitHub Pages)

1. No repositório `racha`, abra `config.js` e cole o endereço /exec na linha `api: ''`. Salve (commit).
2. **Settings › Pages** › Source: **Deploy from a branch** › Branch: **main** › pasta **/(root)** › Save.
3. Em 1 ou 2 minutos o app fica em **https://brunomathias8-droid.github.io/racha/**.

### Primeiro acesso (você)

1. Abra o endereço no Safari do iPhone.
2. **Primeiro acesso**: código de convite + seu nome + um PIN. A primeira pessoa a entrar vira quem administra o grupo.
3. Instale: **Compartilhar › Adicionar à Tela de Início**. Abra pelo ícone e entre de novo (o app instalado tem um armazenamento separado do Safari).

### Convidar os amigos

No app: **Racha › engrenagem › Mandar convite**. O link já leva o código. Cada pessoa cria o próprio nome e PIN. Os times são montados na entrada (quem entra vai para o time com menos gente); depois você pode sortear de novo pelo OVR.

---

## 3. Leitura do plano alimentar em PDF (IA)

Na aba **Config** da planilha, preencha **uma** das opções:

| Opção | ia_provedor | ia_chave | Custo |
|---|---|---|---|
| Claude | `claude` | chave criada em console.anthropic.com › API Keys (precisa colocar créditos, mínimo US$ 5) | Alguns centavos de real por PDF; texto e foto do prato custam menos |
| Gemini | `gemini` | chave criada em aistudio.google.com › Get API key | Grátis dentro da cota diária. No plano grátis, o Google pode usar os dados enviados para melhorar os modelos |

Depois, no Apps Script, execute **testarIA**. Se o registro mostrar "IA ok", está funcionando. A chave sai da planilha e vai para as Propriedades do script no primeiro uso.

Limite de segurança: `ia_limite_dia` (padrão 40 leituras por pessoa por dia).

Modelos: por padrão o Claude usa o Haiku (rápido e barato). Se quiser mais precisão na leitura do PDF, coloque `claude-sonnet-5-5` em `ia_modelo`.

## 4. Notificações (Firebase)

Dá para usar o **mesmo projeto Firebase do RM**. Copie da aba Config do RM para a aba Config do RACHA:

| Chave | De onde vem |
|---|---|
| `firebase_web_config` | Console do Firebase › Configurações do projeto › Seus apps › bloco `firebaseConfig` |
| `firebase_vapid_key` | Cloud Messaging › Web Push certificates › par de chaves |
| `firebase_service_account` | Contas de serviço › Gerar nova chave privada (arquivo JSON inteiro) |

> No RM a conta de serviço já saiu da planilha e foi para as Propriedades do script. Se não tiver mais o arquivo JSON, gere uma chave nova no console do Firebase (Contas de serviço › Gerar nova chave privada). A chave antiga continua valendo para o RM.

Depois, no Apps Script, execute **ativarAvisos** (cria o gatilho de hora em hora). No app: **Perfil › Notificações › Ativar**. No iPhone, só funciona com o app instalado na tela de início.

---

## Atualizar o app depois

| Mudou | O que fazer |
|---|---|
| Telas (arquivos `.js`, `index.html`) | Trocar `VERSAO` em `sw.js` e enviar. O app se atualiza sozinho na próxima abertura |
| Servidor (`servidor/*.gs`) | Colar no Apps Script › **Implantar › Gerenciar implantações › editar › Versão: Nova versão**. O endereço /exec não muda |
| Regras do placar (`nucleo.js`) | Rodar `./build.sh` (copia para `servidor/Nucleo.gs`) e atualizar os dois lados |

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| "Resposta inesperada do servidor" | Implantação não está como "Qualquer pessoa", ou o endereço não termina em /exec |
| Alguém esqueceu o PIN | No Apps Script, rode `redefinirPin('Nome', '1234')` (edite os valores na função antes) |
| Celular perdido | Rode `encerrarTodasSessoes` |
| Fechar a entrada de gente nova | Racha › engrenagem › Gerar código novo |
