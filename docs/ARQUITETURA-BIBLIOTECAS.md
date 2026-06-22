# Arquitetura de bibliotecas do Stage Music

## 1. Minha Biblioteca — privada
Cada conta possui cifras particulares em `users/{uid}/songs`. Somente o dono da conta pode ler ou editar esses documentos.

## 2. Catálogo Global — implementado na Fase 24
As cifras oficiais do Stage Music ficam em `globalSongs/{songId}`.

- todas as contas autenticadas podem visualizar;
- somente o administrador pode publicar, atualizar ou remover;
- as cifras aparecem automaticamente por listener em tempo real;
- o catálogo fica em cache para uso posterior;
- usuários podem criar uma cópia privada sem alterar a versão oficial.

## 3. Sala Live — compartilhamento temporário
O diretor compartilha somente o repertório da apresentação. Os músicos conectados recebem as cifras daquele repertório e acompanham a mesma música e os mesmos comandos ao vivo.

## 4. Biblioteca da equipe — evolução futura
Uma coleção compartilhada por equipe poderá permitir que administradores e editores publiquem cifras aprovadas apenas para aquela banda ou ministério.
