# Persistência e Sala Live — Fase 27

## Por que o repertório desaparecia

Repertórios, equipes e eventos eram gravados primeiro no armazenamento do navegador. Quando a sincronização opcional estava desativada — ou quando o navegador era usado em modo anônimo — os dados podiam desaparecer após o fechamento da sessão.

## Novo comportamento

Quando há uma conta Google online:

- repertórios são gravados automaticamente em `users/{uid}/setlists`;
- equipes são gravadas automaticamente em `users/{uid}/teams`;
- eventos são gravados automaticamente em `users/{uid}/events`;
- a restauração acontece ao entrar novamente com a mesma conta;
- dados locais e remotos são mesclados pela data de atualização;
- a criação é enviada imediatamente;
- alterações são agrupadas por alguns milissegundos para evitar gravações excessivas;
- exclusões também são removidas da nuvem.

A conexão Firebase original não foi alterada. A Fase 27 adiciona uma camada separada de proteção do espaço de trabalho usando a mesma configuração e as regras já publicadas.

## Comunicação do diretor

O diretor pode enviar avisos personalizados. Cada aviso:

- aparece centralizado e em letras grandes;
- permanece visível por aproximadamente oito segundos;
- é registrado em um histórico curto na sala;
- funciona no celular, tablet e computador.

## Operação mobile

No Modo Live do diretor existem atalhos laterais discretos para:

- trocar o tom;
- enviar aviso;
- avançar a música.

Os botões ficam semitransparentes para não cobrir a cifra e ganham destaque ao toque.
