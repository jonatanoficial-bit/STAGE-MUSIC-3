# Auditoria prévia — Compartilhamento da Sala Live

Base auditada: Stage Music v2.6.1  
Data: 11/06/2026

## Resultado antes das mudanças

A estrutura de Sala Live, código, participantes, controle do diretor e listener Firebase já existia. Porém, a auditoria identificou um bloqueio funcional importante:

- a sala compartilhava apenas o identificador do repertório (`setlistId`);
- o repertório e as cifras permaneciam apenas no dispositivo do criador;
- um músico em outro celular, sem a mesma biblioteca local, poderia entrar na sala, mas não teria conteúdo suficiente para abrir a mesma cifra;
- não havia QR Code, link de convite ou fluxo de entrada direta;
- o código antigo era funcional, porém pouco semelhante a uma reunião e pouco destacado visualmente;
- não havia explicação clara sobre o que o convidado veria ao entrar.

## Arquivos Firebase auditados

Os arquivos abaixo foram registrados por SHA-256 antes da fase e não deveriam ser alterados:

- `js/firebase-config.js`
- `js/firebase-runtime.js`
- `js/firebase-live.js`
- `js/cloud-sync.js`
- `firestore.rules`

## Decisão técnica

A solução escolhida foi manter a conexão Firebase existente e evoluir somente a camada da Sala Live:

1. criar um snapshot compacto do repertório dentro do documento da sala;
2. incluir a cifra completa necessária para a apresentação;
3. permitir que o convidado abra o mesmo repertório mesmo sem possuir biblioteca local;
4. gerar código curto, link e QR Code;
5. manter preferências pessoais de fonte, tema e rolagem independentes para cada músico.
