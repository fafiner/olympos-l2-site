/**
 * Conteúdo de demonstração da Home Olympos L2.
 * Substitua este módulo pela API em app.js quando o serviço do jogo estiver disponível.
 * Nunca são métricas ou agendamentos conectados a um servidor real.
 */
export const demoData = {
  source: "demo",
  server: {
    status: "online",
    playersOnline: 284,
    nextSiegeAt: "2026-10-10T20:00:00+01:00",
  },
  pvpLeaders: [
    { name: "Valorian", className: "Gladiator", clan: "Heroes", pvpCount: 2481 },
    { name: "Aetheria", className: "Soultaker", clan: "Legends", pvpCount: 2207 },
    { name: "Kael", className: "Dreadnought", clan: "Noctis", pvpCount: 1936 },
  ],
  // Sample class boards for the visual preview. The live API will provide the final roster and scores.
  rankingsByClass: [
    { id: "duelist", name: "Duelist", pvp: [["Valorian", "Heroes", 2481], ["Rhaegar", "Noctis", 2190], ["Auron", "Legends", 1874]], pk: [["Valorian", "Heroes", 184], ["Rhaegar", "Noctis", 151], ["Auron", "Legends", 127]], olympiad: [["Rhaegar", "Noctis", 94], ["Valorian", "Heroes", 87], ["Auron", "Legends", 73]] },
    { id: "dreadnought", name: "Dreadnought", pvp: [["Kael", "Noctis", 1936], ["Thorne", "Legends", 1712], ["Baldur", "Heroes", 1495]], pk: [["Kael", "Noctis", 163], ["Thorne", "Legends", 132], ["Baldur", "Heroes", 109]], olympiad: [["Thorne", "Legends", 81], ["Kael", "Noctis", 76], ["Baldur", "Heroes", 68]] },
    { id: "moonlight-sentinel", name: "Moonlight Sentinel", pvp: [["Aeloria", "Legends", 2241], ["Silvara", "Noctis", 1988], ["Elaris", "Heroes", 1620]], pk: [["Aeloria", "Legends", 172], ["Silvara", "Noctis", 146], ["Elaris", "Heroes", 115]], olympiad: [["Silvara", "Noctis", 92], ["Aeloria", "Legends", 83], ["Elaris", "Heroes", 70]] },
    { id: "soultaker", name: "Soultaker", pvp: [["Aetheria", "Legends", 2207], ["Mordain", "Noctis", 1901], ["Nyx", "Heroes", 1683]], pk: [["Aetheria", "Legends", 196], ["Mordain", "Noctis", 154], ["Nyx", "Heroes", 138]], olympiad: [["Mordain", "Noctis", 97], ["Aetheria", "Legends", 89], ["Nyx", "Heroes", 75]] },
    { id: "evas-saint", name: "Eva's Saint", pvp: [["Seraphine", "Heroes", 1372], ["Lysander", "Legends", 1205], ["Eirwen", "Noctis", 1044]], pk: [["Seraphine", "Heroes", 94], ["Lysander", "Legends", 78], ["Eirwen", "Noctis", 61]], olympiad: [["Seraphine", "Heroes", 103], ["Eirwen", "Noctis", 88], ["Lysander", "Legends", 76]] },
    { id: "maestro", name: "Maestro", pvp: [["Forgewright", "Noctis", 1128], ["Doran", "Heroes", 986], ["Brom", "Legends", 811]], pk: [["Forgewright", "Noctis", 81], ["Doran", "Heroes", 69], ["Brom", "Legends", 53]], olympiad: [["Doran", "Heroes", 72], ["Forgewright", "Noctis", 64], ["Brom", "Legends", 58]] },
    ...[
      "Phoenix Knight", "Hell Knight", "Sagittarius", "Adventurer", "Titan", "Grand Khavatari",
      "Dominator", "Doomcryer", "Archmage", "Arcana Lord", "Cardinal", "Eva's Templar",
      "Sword Muse", "Wind Rider", "Mystic Muse", "Elemental Master", "Shillien Templar",
      "Spectral Dancer", "Ghost Hunter", "Ghost Sentinel", "Storm Screamer", "Spectral Master",
      "Shillien Saint", "Fortune Seeker", "Doombringer", "Soul Hound", "Trickster", "Judicator",
    ].map((name, index) => {
      const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const champions = ["Asterion", "Nymera", "Vaelor"];
      const clans = ["Heroes", "Legends", "Noctis"];
      const makeBoard = (base) => champions.map((player, place) => [player, clans[(index + place) % clans.length], base - place * (83 + (index % 9))]);
      return { id, name, pvp: makeBoard(1760 - index * 17), pk: makeBoard(142 - index * 2), olympiad: makeBoard(86 - index) };
    }),
  ],
  epicBoss: {
    name: "Freya",
    caption: "A Rainha do Gelo aguarda no templo congelado.",
    nextSpawnAt: "2026-10-06T19:00:00+01:00",
    state: "aguardando",
  },
  events: [
    { day: "05", month: "OUT", name: "Crônicas de Olympos", detail: "Evento comunitário", time: "20:00" },
    { day: "08", month: "OUT", name: "The Coliseum", detail: "Torneio de PvP", time: "21:00" },
    { day: "10", month: "OUT", name: "Siege of Olympos", detail: "Castle Siege", time: "20:00" },
  ],
  news: [
    { category: "O PROJETO", date: "04 OUT 2026", title: "Duas eras lendárias. Um mundo próprio.", image: "./assets/elven-chronicles.webp", alt: "Heróis élficos diante de um novo mundo" },
    { category: "O CAMPO DE BATALHA", date: "04 OUT 2026", title: "Combate competitivo, equilíbrio pensado para Olympos.", image: "./assets/sylvan-chronicle.webp", alt: "Arte clássica de uma heroína élfica" },
    { category: "A JORNADA", date: "04 OUT 2026", title: "Seu equipamento está ao alcance. O poder você conquista.", image: "./assets/shadow-elf.webp", alt: "Elfa sombria pronta para a batalha" },
  ],
};
