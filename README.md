# Stage Music

**Build atual:** v3.6.0
**Versão pública de teste:** Live Premium seguro, limpeza comercial e título fixo
**Gerada em:** 16/06/2026 às 18:26 (America/Sao_Paulo)

Aplicativo PWA mobile-first para cifras, repertórios, catálogo global e operação profissional ao vivo.

## Destaques da build
- Central do Diretor dentro do Modo Live;
- escolha de tom absoluto, como G, D, E, C#, D#, Bb, F#m ou Bbm;
- aplicação temporária do tom para toda a banda;
- opção de salvar o tom somente naquele repertório;
- cifra original preservada sem alteração;
- transposição real dos acordes no leitor;
- Sala Live visível no menu inferior mobile;
- botão Criar Sala Live diretamente em Repertórios;
- controles recolhíveis para celular e tablet;
- Firebase, catálogo global e regras preservados.

## Executar localmente

```bash
npm start
```

## Auditoria completa

```bash
npm run check
```

## Publicação
Extraia o conteúdo e publique os arquivos na raiz do GitHub Pages, Vercel ou Firebase Hosting.

## Firebase
A Fase 26 não exige alteração nas regras do Firestore. Mantenha as regras publicadas na Fase 24.

## Administração do catálogo
Consulte `docs/CATALOGO-GLOBAL-ADMIN.md`.
## Fase 28 — Central Administrativa

A conta administradora agora possui `catalogo-admin.html`, com importação por planilha, fila persistente, verificação de duplicidades e publicação segura em sequência. O editor individual também recebeu o botão **Publicar e preparar nova cifra**, que limpa os identificadores ocultos antes da próxima música.

A fila administrativa usa `users/{uid}/adminCatalogQueue` e funciona com as regras já publicadas. Não é necessário alterar o Firebase para esta fase.

