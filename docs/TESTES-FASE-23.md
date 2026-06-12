# Testes — Fase 23

## Testes automatizados
1. validação de referências HTML, CSS, JavaScript e assets;
2. sintaxe dos scripts de onboarding, diagnóstico e backup;
3. presença dos arquivos da Release Candidate no Service Worker;
4. integridade da configuração Firebase por SHA-256;
5. manutenção dos testes de compartilhamento por QR Code;
6. validação dos atalhos PWA;
7. verificação dos controles de exportar, importar e desfazer restauração.

## Testes funcionais previstos
- primeira abertura mostra o onboarding;
- conclusão impede reabertura automática;
- botão Primeiros passos reabre o guia;
- diagnóstico calcula pontuação e gera relatório JSON;
- checklist de palco permanece após recarregar;
- backup exportado contém schema v2 e os dados locais;
- restauração mesclada preserva itens atuais;
- restauração por substituição recria os dados;
- desfazer restauração recupera o estado anterior;
- Firebase continua autenticando e sincronizando normalmente.

## Resultado
**TESTES AUTOMATIZADOS APROVADOS**
