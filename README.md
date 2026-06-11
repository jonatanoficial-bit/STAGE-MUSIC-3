# Stage Music

**Build atual:** v2.7.0  
**Fase:** 22 — Compartilhamento intuitivo com QR Code e repertório sincronizado  
**Gerada em:** 11/06/2026 às 16:37 (America/Sao_Paulo)

Aplicativo PWA mobile-first para cifras, repertórios e operação profissional ao vivo.

## Destaques desta build

- Sala Live com código curto no formato `ABC-123`;
- QR Code gerado localmente no próprio app;
- link de convite compartilhável;
- compartilhamento pelo menu nativo e WhatsApp;
- repertório e cifras enviados como snapshot da apresentação;
- convidado não precisa possuir as músicas previamente;
- abertura automática do mesmo repertório no Modo Live;
- música atual, seção, dinâmica, modulação e comandos sincronizados;
- preferências de leitura continuam individuais;
- Firebase, Firestore e regras preservados sem alteração.

## Validar a build

```bash
npm run check
```

O comando executa auditoria estrutural, testes do compartilhamento e verificação de integridade Firebase.
