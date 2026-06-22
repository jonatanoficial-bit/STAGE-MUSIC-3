# Firebase Real — Configuração da Fase 18

## Serviços gratuitos utilizados
- Firebase Authentication
- Cloud Firestore
- Firebase Hosting opcional

## Passos
1. Crie um projeto no Firebase usando o plano Spark.
2. Em Authentication, ative **E-mail/senha** e **Google**.
3. Em Firestore Database, crie o banco.
4. Registre um aplicativo Web e copie as chaves para `js/firebase-config.js`.
5. Publique as regras de `firestore.rules`.
6. Adicione o domínio do GitHub Pages em **Authentication > Settings > Authorized domains**.
7. Publique novamente o projeto.
8. Abra Configurações no Stage Music e pressione **Testar Firebase**.

## Sala Live entre dispositivos
- O diretor e os músicos precisam estar logados com contas Firebase.
- O diretor cria uma Sala Live e compartilha o código `LIVE-XXXX`.
- Em outro aparelho, o músico abre Sala Live e entra com o código.
- Música atual, avisos e Worship Flow são atualizados pelo listener em tempo real do Firestore.

## Segurança
As chaves do app Web Firebase podem ficar no frontend. A proteção real é feita pelas regras do Firestore. Nunca coloque chaves administrativas ou arquivos de conta de serviço no projeto público.
