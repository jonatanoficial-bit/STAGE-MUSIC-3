# Estratégia de infraestrutura gratuita

## Base recomendada
- Front-end/PWA: HTML, CSS e JavaScript, sem licenças pagas.
- Hospedagem inicial: GitHub Pages ou Firebase Hosting no plano gratuito.
- Autenticação: Firebase Authentication dentro das cotas gratuitas.
- Banco: Cloud Firestore para contas, cifras, listas e equipes, dentro das cotas gratuitas.
- Sessões ao vivo: inicialmente Firestore ou Realtime Database, com controle rigoroso de leituras.
- Offline: IndexedDB/cache local para o palco continuar funcionando sem internet.

## Restrição importante em 2026
Não depender do Cloud Storage do Firebase no plano Spark para anexos. Imagens e arquivos estáticos devem permanecer no repositório/hosting; recursos de áudio e PDF serão avaliados com alternativas gratuitas ou armazenamento local.

## Proteção contra gastos
O projeto deve permanecer no plano Spark sem conta de faturamento. Nenhuma função que exija Blaze será ativada sem decisão explícita do proprietário.
