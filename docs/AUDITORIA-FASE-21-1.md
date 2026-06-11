# Auditoria — Fase 21.1

Build v2.6.1 — 10/06/2026 22:50

## Correção
O Modo Live no celular mantinha o corpo da página bloqueado em `overflow:hidden` e altura fixa de `100dvh`. Ao exibir todos os comandos, parte deles ficava fora da área acessível.

## Solução
- corpo rolável quando os controles estão visíveis;
- painel inferior de comandos com rolagem própria;
- controles principais permanecem fixos no topo do painel;
- ferramentas organizadas em duas colunas;
- leitor da cifra mantém altura útil sem ocupar toda a tela;
- modo imersivo original preservado;
- ajuste adicional para telas abaixo de 380 px.

## Firebase
Arquivos Firebase e regras permaneceram idênticos à v2.6.0.

## Resultado
**AUDITORIA APROVADA**
