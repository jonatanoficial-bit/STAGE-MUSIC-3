# Testes — Fase 24

Build v3.1.0 — 16/06/2026 11:16

## Testes automatizados
1. presença da coleção `globalSongs` nas regras;
2. leitura global limitada a contas autenticadas;
3. escrita limitada ao administrador;
4. presença do listener em tempo real `onSnapshot`;
5. cache offline do catálogo global;
6. publicação, atualização e exclusão administrativa;
7. cópia de cifra global para biblioteca privada;
8. filtro entre catálogo global e cifras privadas;
9. uso de cifras globais em repertórios;
10. inclusão do conteúdo completo da cifra no repertório e no Modo Live;
11. cache PWA dos novos scripts e estilos;
12. preservação dos quatro arquivos centrais de conexão Firebase por SHA-256.

## Teste manual recomendado
- publicar uma cifra global com a conta administrativa;
- entrar em outra conta;
- abrir a Biblioteca e tocar em **Atualizar catálogo**;
- confirmar que a cifra global aparece;
- criar uma versão privada;
- adicionar a cifra global a um repertório e abrir o Modo Live.

## Resultado
**TESTES AUTOMATIZADOS APROVADOS**
