# Central Administrativa do Catálogo

## Formato aceito

A Central reconhece as colunas:

1. Música
2. Artista
3. Estilo
4. Tags
5. Tom oficial
6. BPM oficial
7. Conteúdo da cifra — opcional na importação
8. Observações — opcional
9. Capotraste — opcional

Linhas sem conteúdo entram como “Sem conteúdo”. Elas podem ser completadas e publicadas individualmente.

## Publicação segura

- **Publicar esta cifra:** confirma a gravação e mantém o item aberto.
- **Publicar e abrir a próxima:** confirma a gravação e avança na fila.
- **Publicar todas as prontas:** publica somente itens completos.

## Repetidas

- **Ignorar:** não altera a cifra existente.
- **Atualizar:** usa o ID global já existente.
- **Criar nova versão:** gera um novo ID global.

## Persistência

A fila é salva localmente e também em:

`users/{uid}/adminCatalogQueue/{queueId}`

Essa área é privada e só pode ser acessada pela própria conta autenticada.
