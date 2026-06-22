# Auditoria — Fase 28

## Escopo

Central Administrativa do Catálogo, publicação consecutiva segura, importação em massa e restauração de autenticação antes do bloqueio do editor.

## Riscos auditados

- sobrescrita acidental do documento global anterior;
- colisão de IDs em publicações rápidas;
- redirecionamento indevido para login durante a restauração do Firebase Auth;
- perda da fila administrativa ao fechar o navegador;
- importação incorreta de TAB, TSV, CSV e ponto e vírgula;
- publicação de linhas sem conteúdo de cifra;
- atualização involuntária de música repetida;
- alteração dos arquivos de conexão Firebase e das regras de segurança.

## Soluções

- IDs globais usam data, hora e sufixo aleatório;
- o botão “Publicar e preparar nova cifra” limpa campos e identificadores ocultos;
- o botão “Limpar editor” dispara limpeza da identidade global;
- a autenticação agora expõe `ready()` e `ensureAuthenticated()`;
- fila administrativa persistida em `users/{uid}/adminCatalogQueue/{queueId}`;
- importação detecta TAB, ponto e vírgula e CSV com aspas;
- duplicidades têm políticas explícitas: ignorar, atualizar ou criar versão;
- publicação em lote aceita somente cifras completas;
- cada item mantém status, erro, ID global e confirmação de publicação.

## Integridade Firebase

Permaneceram inalterados:

- `js/firebase-config.js`
- `js/firebase-runtime.js`
- `js/firebase-live.js`
- `js/cloud-sync.js`
- `firestore.rules`

A fila usa uma subcoleção já protegida pela regra recursiva de `users/{uid}`. Nenhuma nova regra é necessária.
