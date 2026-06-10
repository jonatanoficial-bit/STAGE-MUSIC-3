# Stage Music — caminhos oficiais dos fundos mobile

Os arquivos WebP são os recomendados para o aplicativo por serem mais leves. Os PNGs originais foram preservados em `source-png`.

## Caminhos oficiais

- Home: `assets/backgrounds/mobile/webp/bg-home-stage-mobile.webp`
- Biblioteca e editor: `assets/backgrounds/mobile/webp/bg-library-wave-mobile.webp`
- Modo Live e Sala Live: `assets/backgrounds/mobile/webp/bg-live-stage-mobile.webp`
- Login, conta e configurações: `assets/backgrounds/mobile/webp/bg-account-portal-mobile.webp`
- Repertórios, eventos e equipes: `assets/backgrounds/mobile/webp/bg-setlists-flow-mobile.webp`

## Regras de uso

- usar `background-size: cover`;
- usar `background-position: center center`;
- adicionar camada escura/gradiente sobre a imagem para preservar legibilidade;
- não aplicar a imagem diretamente em áreas de leitura da cifra sem overlay forte;
- no desktop, manter `cover` e ajustar o foco por página quando necessário;
- não renomear os arquivos após a integração.

## Estrutura final esperada no projeto

```text
assets/
└── backgrounds/
    └── mobile/
        ├── webp/
        │   ├── bg-home-stage-mobile.webp
        │   ├── bg-library-wave-mobile.webp
        │   ├── bg-live-stage-mobile.webp
        │   ├── bg-account-portal-mobile.webp
        │   └── bg-setlists-flow-mobile.webp
        ├── source-png/
        ├── backgrounds.css
        └── backgrounds.json
```
