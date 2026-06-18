// Instant search engine with debounce (Grão Nobre)
(function() {
  let debounceTimeout = null;

  document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const dropdown = document.getElementById('search-results-dropdown');
    const resultsList = document.getElementById('search-results-list');

    if (!searchInput || !dropdown || !resultsList) return;

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();

      clearTimeout(debounceTimeout);

      if (query.length < 2) {
        dropdown.classList.add('hidden');
        return;
      }

      debounceTimeout = setTimeout(() => {
        resultsList.innerHTML = '<div class="p-3 text-xs text-text-muted">Buscando cafés...</div>';
        dropdown.classList.remove('hidden');

        fetch(`/api/products?q=${encodeURIComponent(query)}&limit=5`)
          .then(res => res.json())
          .then(data => {
            if (data.products && data.products.length > 0) {
              let html = '';
              data.products.forEach(p => {
                const img = p.images && p.images.length > 0 ? p.images[0] : '/uploads/placeholder.jpg';
                const isWebp = typeof img === 'object' && img.webp;
                
                html += `
                  <a href="/produtos/${p.slug}" class="flex items-center space-x-3 p-3 hover:bg-surface transition-colors rounded-lg">
                    <img src="${isWebp ? img.webp : img}" alt="${p.name}" class="w-10 h-10 object-cover rounded-lg border">
                    <div class="flex-grow min-w-0">
                      <h4 class="text-xs font-bold text-primary truncate">${p.name}</h4>
                      <p class="text-[10px] text-text-muted mt-0.5">R$ ${parseFloat(p.price).toFixed(2).replace('.', ',')}</p>
                    </div>
                  </a>
                `;
              });
              resultsList.innerHTML = html;
            } else {
              resultsList.innerHTML = '<div class="p-3 text-xs text-text-muted">Nenhum café encontrado.</div>';
            }
          })
          .catch(() => {
            resultsList.innerHTML = '<div class="p-3 text-xs text-danger">Erro de conexão.</div>';
          });
      }, 300); // 300ms debounce
    });

    // Close dropdown on click outside
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.add('hidden');
      }
    });
  });
})();
