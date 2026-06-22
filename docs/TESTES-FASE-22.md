# Testes — Fase 22

Build v2.7.0 — 11/06/2026 16:37

## Testes automatizados

1. geração de código curto sem caracteres ambíguos;
2. normalização de código digitado com ou sem hífen;
3. geração do link `sala-live.html?room=ABC-123`;
4. criação de snapshot compacto do repertório;
5. inclusão de letra, acordes, tom, BPM e capo no snapshot;
6. resolução do repertório compartilhado sem biblioteca local;
7. verificação de tamanho do documento antes do envio ao Firestore;
8. presença do QR Code local, sem dependência externa;
9. cache PWA dos novos recursos;
10. sintaxe dos scripts JavaScript;
11. referências HTML, CSS e assets;
12. hashes dos arquivos Firebase.

## Teste funcional simulado

Foi validado o cenário crítico:

- o diretor possui uma cifra e um repertório;
- a sala é criada com snapshot completo;
- a biblioteca local é removida do ambiente convidado;
- o repertório ainda pode ser resolvido a partir da própria sala;
- o Modo Live recebe título, conteúdo e posição da música.

## Resultado

**TESTES APROVADOS**
