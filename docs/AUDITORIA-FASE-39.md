# Auditoria — Fase 39 — Hotfix pós-teste real

## Stage Music v4.6.0

A Fase 39 foi criada a partir dos testes reais em dois celulares e dois logins diferentes.

## Correções auditadas

- Área fantasma de “Nenhuma apresentação ativa” corrigida com regra explícita para elementos `hidden`.
- Entrada por convite ajustada para pedir escolha clara entre **Quero letra** e **Quero cifra**.
- Link/QR da Sala Live passa a abrir a página de convite antes de entrar automaticamente.
- Leitor de QR Code via câmera adicionado em `convite.html` e `sala-live.html`.
- Botão PT/EN/ES removido da interface; app travado em português nesta etapa.
- Botão local “Ver letra / Ver cifra” adicionado no Modo Live.
- Preferência de leitura salva por sala e por navegador.
- Velocidade de rolagem passa a aparecer também no mobile imersivo.

## Firebase

Arquivos preservados:

- `js/firebase-config.js`
- `js/firebase-runtime.js`
- `js/firebase-live.js`
- `js/cloud-sync.js`
- `firestore.rules`

Nenhuma alteração de regra Firebase necessária.
