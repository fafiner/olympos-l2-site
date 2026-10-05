/**
 * Contrato inicial para a API do jogo.
 * Adicione os endpoints reais e a autenticação do serviço quando estiverem definidos.
 */
export function createGameApi({ baseUrl }) {
  const request = async (path) => {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Game API returned ${response.status}`);
    return response.json();
  };

  return {
    getHome: () => request("/api/home"),
    getStatus: () => request("/api/server/status"),
    getPvpRanking: () => request("/api/rankings/pvp"),
    getEpicBosses: () => request("/api/epic-bosses"),
    getEvents: () => request("/api/events"),
    getNews: () => request("/api/news"),
  };
}

/**
 * Para ativar a API no futuro: defina window.OLYMPOS_API_URL antes de app.js
 * e implemente os mapeamentos dos endpoints acima para o mesmo formato de demo-data.js.
 */
