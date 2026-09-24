# Convite — Marcio & Magali

Página estática. Ao rolar (ou tocar no envelope), a aba abre, o envelope desce e o convite sobe para o centro da tela.

Duas versões do envelope no mesmo código:
- `index.html` — floral com selo de cera.
- `index.html#renda` — papel liso com renda e pérola.

- `index.html` — texto do convite e da seção de detalhes.
- `js/main.js` — animação ligada à rolagem. `LOCAL` no topo preenche o local da cerimônia (vazio = oculto).
- `css/style.css` — visual e geometria da foto do envelope.
- `assets/envelope.jpg` — foto original de referência.
- `assets/envelope-sem-selo.webp` — a mesma foto sem o selo (editada com Nano Banana Pro), usada no envelope.
- `assets/selo.webp` — selo recortado da foto original, preso à aba.
- `assets/envelope-renda.webp` e `assets/aba-renda.webp` — versão renda: envelope com o papel limpo sob a aba e a aba recortada (renda + pérola) com transparência. Gerados a partir de uma edição feita com Nano Banana Pro.
- `fonts/` — Cormorant Garamond e Pinyon Script (SIL OFL 1.1).

Para ver localmente: `python3 -m http.server` e abrir `http://localhost:8000`.
