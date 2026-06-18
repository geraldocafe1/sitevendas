// Memory cache to save addresses and reduce requests to ViaCEP API
const cepCache = {};

/**
 * Resolves a zip code (CEP) using ViaCEP API
 * @param {String} cep - Zip code (e.g., '01001-000' or '01001000')
 * @returns {Promise<Object>} - Address data or error
 */
const lookupCEP = async (cep = '') => {
  const cleanCEP = cep.replace(/\D/g, '');

  if (cleanCEP.length !== 8) {
    throw new Error('Formato de CEP inválido. Deve conter 8 dígitos.');
  }

  // Return from cache if present
  if (cepCache[cleanCEP]) {
    return cepCache[cleanCEP];
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
    if (!response.ok) {
      throw new Error('Não foi possível conectar ao serviço de busca de CEP.');
    }

    const data = await response.json();

    if (data.erro) {
      throw new Error('CEP não encontrado na base de dados do ViaCEP.');
    }

    const result = {
      zip: cleanCEP,
      address: data.logradouro || '',
      neighborhood: data.bairro || '',
      city: data.localidade || '',
      state: data.uf || '',
      complement: data.complemento || ''
    };

    // Store in cache
    cepCache[cleanCEP] = result;

    return result;
  } catch (error) {
    console.error(`Error fetching CEP ${cleanCEP}:`, error.message);
    throw error;
  }
};

module.exports = {
  lookupCEP
};
