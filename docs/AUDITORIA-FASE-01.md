# Auditoria — Fase 1 — Fundação Premium

Build: v0.6.0 — 09/06/2026 12:12

## Corrigido
- Versões conflitantes 0.2.0, 0.4.0 e 0.5.0 foram unificadas em v0.6.0.
- A versão, data, hora e fase agora vêm de uma única fonte: js/build-info.js.
- Todas as páginas exibem a identificação da build.
- Service worker usa caminhos relativos, cache versionado e limpeza de caches antigos.
- Manifesto PWA foi ajustado para GitHub Pages e Firebase Hosting.
- Criada validação automática com npm run check.

## Mantido
- Editor local, busca local, autenticação demonstrativa e páginas existentes.
- Nenhum recurso funcional anterior foi removido.

## Próxima fase
Redesign AAA e design system responsivo, preservando a fundação desta build.
