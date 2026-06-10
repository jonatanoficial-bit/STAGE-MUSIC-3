# Auditoria — Fase 6 / v1.1.0

## Escopo
Modo Live Individual reconstruído para uso real em apresentações.

## Proteções anti-quebra v5
- Recuperação da última música, fonte, tema, bloqueio e modo foco.
- Fallback seguro quando não existe repertório ativo ou uma cifra foi removida.
- Wake Lock e tela cheia tratados como recursos opcionais, sem impedir o app de funcionar.
- Navegação protegida nos limites inicial/final da lista.
- Conteúdo renderizado com escape de HTML.
- Persistência local isolada da biblioteca e dos repertórios.
- Cache PWA versionado e limpeza de caches antigos.

## Resultado
Auditoria automatizada, sintaxe JavaScript, JSON, referências locais e integridade do ZIP: APROVADOS.
