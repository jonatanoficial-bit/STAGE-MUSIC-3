# Testes — Fase 39 — Hotfix pós-teste real

Checklist validado estaticamente:

- `convite.html` possui botão de leitor de QR Code.
- `sala-live.html` possui botão de leitor de QR Code.
- `live-sharing-core.js` gera link para `convite.html?room=CODIGO`.
- `modo-live.html` possui botão `Ver letra / Ver cifra`.
- `live-choice.js` cria escolha grande entre letra e cifra no Modo Live quando necessário.
- `css/live.css` impede que `#live-empty[hidden]` apareça por cima da cifra.
- `js/i18n.js` permanece em português e não cria seletor PT/EN/ES visível.
- `service-worker.js` inclui os novos arquivos de QR e escolha de leitura.

Teste manual recomendado:

1. Diretor cria a Sala Live.
2. Diretor compartilha QR/link.
3. Convidado abre pelo link e escolhe “Vou cantar”.
4. A tela abre como letra limpa.
5. Convidado abre pelo link e escolhe “Vou tocar”.
6. A tela abre como cifra completa.
7. No Modo Live, confirmar que não aparece “Nenhuma apresentação ativa” sobre a música.
8. Ajustar velocidade de rolagem no celular.
9. Confirmar que o botão PT/EN/ES não aparece.
