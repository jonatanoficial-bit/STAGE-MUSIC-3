# Stage Music

**Build atual:** v3.0.0-rc.1  
**Fase:** 23 — Release Candidate comercial, onboarding, diagnóstico e recuperação  
**Gerada em:** 11/06/2026 às 17:16 (America/Sao_Paulo)

Aplicativo PWA mobile-first para cifras, repertórios, bandas e apresentações ao vivo, com Firebase gratuito, funcionamento offline e Sala Live por código/QR Code.

## Destaques desta build
- onboarding inicial em quatro passos;
- tela de diagnóstico e prontidão do aparelho;
- checklist de palco persistente;
- backup completo em JSON;
- restauração por mesclagem ou substituição;
- cópia de recuperação antes de cada restauração;
- opção para desfazer a última restauração;
- atalhos PWA para Live, Biblioteca e Sala Live;
- Firebase, Firestore e regras preservados byte a byte.

## Executar localmente

```bash
npm start
```

## Auditoria completa

```bash
npm run check
```

## Publicação
Extraia o conteúdo e publique os arquivos na raiz do GitHub Pages, Vercel ou Firebase Hosting. Não publique apenas o ZIP fechado.

## Firebase
A configuração validada do projeto `stage-music-96cc1` permanece em `js/firebase-config.js`. As regras estão em `firestore.rules`.
