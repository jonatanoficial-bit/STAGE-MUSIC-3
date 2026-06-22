# Auditoria — Fase 22

Build v2.7.0 — 11/06/2026 16:37

## Objetivo

Transformar o compartilhamento em um fluxo simples e visual, semelhante a uma reunião online:

- criar sala;
- gerar código e QR Code;
- entrar pelo convite;
- abrir automaticamente a mesma cifra e o mesmo repertório;
- acompanhar os comandos do diretor.

## Comportamento final

### Diretor

- escolhe um repertório;
- cria a sala;
- recebe código curto no formato `ABC-123`;
- recebe QR Code e link de convite;
- compartilha pelo menu nativo, cópia ou WhatsApp;
- controla música, seção, dinâmica, modulação, vamp e ministração.

### Músico

- escaneia o QR Code ou digita o código;
- entra na sala;
- abre automaticamente o Modo Live;
- recebe o mesmo repertório, a mesma ordem e a cifra completa;
- acompanha a música escolhida pelo diretor;
- mantém fonte, tema e rolagem pessoais.

## Proteção de dados

A sala recebe apenas um snapshot do repertório em uso. A biblioteca privada completa do criador não é compartilhada.

## Integridade Firebase

Os arquivos Firebase permaneceram idênticos, byte a byte, à build v2.6.1. A verificação automática está em:

`npm run test:firebase-integrity`

## Resultado

**AUDITORIA APROVADA**
