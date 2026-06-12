# CHANGELOG

## v3.0.0-rc.1 — Fase 23 — 11/06/2026 17:16
- Release Candidate comercial com onboarding inicial em quatro passos.
- Nova página de diagnóstico técnico e prontidão para apresentação.
- Checklist persistente de palco para bateria, brilho, repertório, offline, Wake Lock e Sala Live.
- Backup local ampliado para cifras, repertórios, equipes, eventos e preferências.
- Restauração de backup em modo mesclar ou substituir.
- Snapshot automático antes da restauração e opção de desfazer.
- Manifesto PWA com atalhos para Modo Live, Biblioteca e Sala Live.
- Firebase, Firestore, Cloud Sync e regras preservados sem alterações.

## v2.7.0 — Fase 22 — 11/06/2026 16:37
- Sala Live redesenhada com fluxo visual em três etapas.
- Código curto estilo reunião no formato ABC-123.
- QR Code local e link direto de convite.
- Compartilhamento por copiar código, copiar link, menu nativo e WhatsApp.
- Snapshot do repertório e das cifras incluído na própria sala.
- Músicos passam a ver o mesmo repertório mesmo sem biblioteca local.
- Entrada por convite abre automaticamente o Modo Live sincronizado.
- Firebase e regras preservados byte a byte.
- Anti-break v25 e auditoria dedicada de compartilhamento.

## v2.6.1 — Fase 21.1 — 10/06/2026 22:50
- Corrige comandos inacessíveis no Modo Live mobile.
- Adiciona painel inferior rolável para todos os controles.
- Mantém controles principais sempre visíveis dentro do painel.
- Preserva modo imersivo, Firebase e sincronização.

## v2.6.0 — Fase 21 — 10/06/2026 19:32
- Login com Google transformado em ação principal da Home.
- Botão de conta destacado no menu inferior mobile.
- Atualização automática da nuvem após restauração da sessão, com botão manual obrigatório em destaque.
- Título inicial simplificado para uma proposta comercial mais direta.
- Modo Live com controles recolhíveis e leitura imersiva padrão no celular.
- Firebase, Firestore, autenticação e regras preservados.
- Anti-break v23.

## v2.5.0 — Fase 20 — 10/06/2026 22:02
- Auditoria dedicada para celular e tablet.
- Navegação inferior global em mobile.
- Editor com ações fixas, melhor toque e adaptação ao teclado virtual.
- Repertórios reorganizados em cards mobile.
- Safe areas, viewport e orientação horizontal revisados.
- Firebase e sincronização preservados integralmente.

## v2.4.1 — Fase 19.1 — 10/06/2026 21:54
- Corrige fundos premium quase invisíveis no desktop.
- Adiciona imagens horizontais 16:9 para desktop e mantém 9:16 no mobile.
- Aplica fundo diretamente ao hero da Home.
- Reduz opacidade das camadas que escondiam as imagens.
- Firebase e sincronização preservados sem alteração.

## v2.4.0 — Fase 19 — 10/06/2026 18:31
- Integração de cinco fundos cinematográficos AAA em WebP.
- Mapeamento visual por Home, Biblioteca/Editor, Live, Conta e Setlists/Eventos.
- Overlays de contraste e otimização mobile-first.
- Service Worker atualizado para cache offline dos fundos.
- Firebase e conexões existentes preservados integralmente.
- Anti-break v20 e auditoria da fase.

## v2.3.2 — Fase 18.2 — 10/06/2026 18:06
- Corrigido contraste de inputs, selects, textarea, cards e prévia do editor.
- Texto digitado e placeholders agora ficam legíveis no tema escuro.
- Nenhuma lógica do Firebase, autenticação, Firestore ou sincronização foi alterada.
- Configuração do projeto stage-music-96cc1 preservada integralmente.
- Anti-break v19 e auditoria de regressão.

## v2.3.1 — Fase 18.1 — 10/06/2026 17:21
- Hotfix do Firebase: caminhos privados agora usam o UID real do Firebase Authentication.
- Removido o identificador derivado do e-mail em `cloud-sync.js`.
- Configuração do projeto `stage-music-96cc1` inserida na build.
- Regras do Firestore alinhadas com `users/{uid}` e propriedade imutável das Salas Live.
- Validação anti-regressão para impedir retorno do caminho baseado em e-mail.
- Anti-break v18.

## v2.3.0 — Fase 18 — 10/06/2026 16:42
- Firebase Authentication real com sessão persistente e UID local.
- Runtime Firebase centralizado e Firestore offline quando suportado.
- Sala Live online por código entre dispositivos diferentes.
- Listener em tempo real no painel da sala e no Modo Live.
- Regras Firestore, firebase.json e guia de implantação incluídos.
- Teste de conexão Firebase nas Configurações.
- Fallback local/offline e anti-break v17 preservados.

## v2.2.0 — Fase 17 — 10/06/2026 16:35
- Assistente musical local com reconhecimento de estrutura, acordes e tom provável.
- Estimativa de duração baseada em conteúdo e BPM.
- Sugestões de capo e transposição para tonalidades mais simples.
- Simplificação harmônica para leitura rápida.
- Assistente de repertório com prontidão, duração e alertas de transição tonal.
- Anti-break v16 e auditoria da fase.

## v2.1.0 — Fase 16 — 10/06/2026 16:26
- Agenda de eventos, cultos, shows, ensaios e aulas.
- Escala de músicos com confirmação de presença.
- Associação de equipe e repertório.
- Checklist de preparação e indicadores de prontidão.
- Persistência local offline e anti-break v15.

## v2.0.0 — Fase 15 — 10/06/2026 16:13
- Painel de pedal Bluetooth, teclado externo e Web MIDI no Modo Live.
- Mapeamento configurável de próxima/anterior música e seção, rolagem, repetição, fonte e tela cheia.
- Modo de aprendizado: pressione o botão físico do pedal para remapear.
- Persistência offline das preferências e restauração do padrão.
- Web MIDI opcional com fallback seguro em navegadores incompatíveis.
- Anti-break v14 e auditoria da fase.

## v1.9.0 — Fase 14 — 10/06/2026 13:28
- Worship Flow e direção musical avançada.
- Controle sincronizado de seções, repetição, vamp, ministração e final.
- Dinâmica ao vivo: suave, crescendo, banda completa e corte total.
- Modulação visual de até dois semitons para cima ou para baixo.
- Histórico de comandos e painel persistente no Modo Live.
- Anti-break v13 e auditoria da fase.

## v1.8.0 — Fase 13 — 10/06/2026 13:02
- Sala Live com criação de sessão e entrada por código.
- Diretor controla a música atual e envia comandos rápidos.
- Músicos conectados recebem posição e mensagens da sala.
- Sincronização local por BroadcastChannel e armazenamento protegido.
- Integração entre Sala Live, repertório ativo e leitor ao vivo.
- Anti-break v12 e auditoria da fase.

## v1.7.0 — Fase 12 — 10/06/2026 12:39
- Criação e gestão de bandas, ministérios e equipes musicais.
- Funções de administrador, diretor, editor, músico e somente leitura.
- Cadastro de membros por instrumento.
- Códigos de convite e entrada por código local.
- Associação de repertórios a equipes.
- Sincronização opcional de equipes via Firebase.
- Anti-break v11 e auditoria completa.

## v1.6.0 — Fase 11 — 10/06/2026 10:58
- Conta, nuvem e sincronização free-first preparadas para Firebase Spark.
- Central de sincronização com status de conta, status da nuvem e auto-sync opcional.
- Envio manual e download manual de cifras e repertórios entre dispositivo e Firestore.
- Editor e setlists agora tentam sincronizar automaticamente quando o auto-sync estiver ativo.
- Backup local completo exportável pelas Configurações.
- Anti-break v10 e auditoria da fase.

## v1.5.0 — Fase 10 — 10/06/2026 10:24
- Home reconstruída com visual premium AAA e hierarquia visual mais forte.
- Hero principal redesenhado para comunicar valor real do produto.
- Dashboard inicial com cifras recentes, repertórios recentes e ações rápidas.
- Busca iniciada na Home agora pode seguir direto para a Biblioteca.
- Refinamento visual global para tornar a Home coerente com as demais telas.
- Anti-break v9, auditoria da fase e compatibilidade preservada com os dados anteriores.

## v1.4.0 — Fase 9 — 09/06/2026
- Perfis por instrumento para direção, vocal, teclado, guitarra, violão, baixo, bateria e sopros.
- Notas privadas separadas por música e instrumento.
- Lembrete opcional visível acima da cifra no Modo Live.
- Sugestões rápidas específicas para cada função musical.
- Persistência offline e compatibilidade com repertórios anteriores.
- Anti-break v8 e auditoria de integridade.


## v1.3.0 — Fase 8 — 09/06/2026
- Metrônomo, Tap Tempo, contagem de entrada, gerador de tom, capo inteligente e graus harmônicos.
- Áudio local via Web Audio API, compatível com funcionamento offline.
- Anti-break v7 e auditoria ampliada.

## v0.9.0 — Fase 4 — 09/06/2026 12:48
- Editor musical inteligente, transposição, capo, seções, detecção, histórico e anti-quebra v3.

# Stage Music — Changelog

## v0.9.0 — Fase 3 — 09/06/2026 12:48
- Biblioteca profissional com busca, filtros, favoritos, recentes e tags.
- Visualização rápida de cifras e painel estatístico.
- Armazenamento local protegido pelo sistema anti-quebra v2.
- Auditoria automatizada de integridade e regressão.


## v0.7.0 — Fase 2 — 09/06/2026 12:33
- redesign AAA escuro, premium e responsivo;
- design system centralizado;
- camada anti-quebra com diagnóstico local;
- armazenamento seguro com fallback em memória;
- Service Worker tolerante a falhas parciais;
- auditoria automática ampliada para links e arquivos essenciais;
- acessibilidade de foco e redução de movimento.

## v0.6.0 — Fase 1 — Fundação Premium — 09/06/2026 12:12
- Centralização de versão, data, hora e fase.
- Build visível em todas as páginas.
- PWA e cache offline corrigidos.
- Compatibilidade aprimorada com hospedagem em subpasta.
- Validador automático de integridade.
- Documentação de auditoria, testes e infraestrutura gratuita.
- Recursos anteriores preservados.

## v0.5.0 — legado
- Salvamento local de cifras, rascunho automático e busca local.

## v1.0.0 — Fase 5 — 09/06/2026 12:56
- Repertórios e setlists totalmente funcionais.
- Inclusão de músicas da biblioteca local.
- Reordenação por arrastar, subir e descer.
- Tom, duração e status de ensaio por item.
- Duplicação, exclusão, filtros e estatísticas.
- Preparação do repertório ativo para o Modo Live.
- Camada anti-break v4 e auditoria ampliada.

## v1.1.0 — Fase 6 — 09/06/2026 13:14
- Modo Live Individual completo com repertório real.
- Navegação por botões, teclado e gestos.
- Tela cheia, Wake Lock, bloqueio e modo foco.
- Fonte ajustável, temas de palco e recuperação de sessão.
- Anti-break v5 e auditoria da fase.


## v1.2.0 — Fase 7 — 09/06/2026 13:17
- Rolagem automática com 10 velocidades.
- Pausa e retomada pelo botão central ou barra de espaço.
- Barra de progresso da cifra.
- Navegação por seções detectadas automaticamente.
- Repetição de parte e recuperação da posição de leitura.
- Anti-break v6 e auditoria específica da Fase 7.
