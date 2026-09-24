# Convite — Marcio & Magali

Página estática. Ao rolar, o selo rompe, a aba do envelope abre, o envelope desce e o convite sobe para o centro da tela.

- `index.html` — texto do convite e da seção de detalhes.
- `js/main.js` — animação ligada à rolagem. `LOCAL` no topo preenche o local da cerimônia (vazio = oculto).
- `css/style.css` — visual e geometria da foto do envelope.
- `assets/envelope.jpg` — foto original de referência; `assets/envelope.webp` é a versão usada na página.
- `assets/selo.webp` — selo recortado da foto.
- `assets/envelope-sem-selo.webp` (opcional) — se existir, o selo sobe junto com a aba em vez de romper.
- `fonts/` — Cormorant Garamond e Pinyon Script (SIL OFL 1.1).

Para ver localmente: `python3 -m http.server` e abrir `http://localhost:8000`.
