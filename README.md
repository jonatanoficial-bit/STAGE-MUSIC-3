# Stage Music

**Build atual:** v2.3.1  
**Fase:** 18.1 — Hotfix Firebase UID e regras seguras  
**Gerada em:** 10/06/2026 às 17:21 (America/Sao_Paulo)

## Correção desta build
- configuração Firebase do projeto `stage-music-96cc1` já inserida;
- caminhos privados do Firestore corrigidos para `users/{UID}`;
- compatibilidade com regras seguras baseadas em `request.auth.uid`;
- proteção contra troca do proprietário de Sala Live;
- modo local e offline preservados.

## Publicação
Extraia o conteúdo da pasta do projeto na raiz do repositório GitHub Pages e substitua os arquivos da build anterior.

## Validação

`npm run audit`

## Teste recomendado
1. publique as regras do arquivo `firestore.rules`;
2. publique esta build no GitHub Pages;
3. limpe o cache/Service Worker antigo;
4. entre com Google ou e-mail;
5. crie uma cifra e clique em enviar para a nuvem;
6. confirme no Firestore o caminho `users/UID/songs`.
