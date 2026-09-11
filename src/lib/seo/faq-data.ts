import type { ConnectorKey } from "@/features/charging/connectors";

export type ConnectorFaqEntry = {
  question: string;
  answer: string;
};

export const connectorFAQs: Partial<Record<ConnectorKey, ConnectorFaqEntry[]>> = {
  ccs2: [
    {
      question: "Co to jest złącze CCS2?",
      answer:
        "CCS2 (Combined Charging System 2) to europejski standard szybkiego ładowania DC dla pojazdów elektrycznych. Obsługuje zarówno ładowanie AC jak i DC w jednym złączu.",
    },
    {
      question: "Które samochody obsługują CCS2?",
      answer:
        "Większość nowych samochodów elektrycznych dostępnych w Europie obsługuje CCS2, w tym BMW i3, Audi e-tron, Tesla (z adapterem), oraz pojazdy Forda, Hyundaia i Kii.",
    },
    {
      question: "Jak długo trwa ładowanie CCS2?",
      answer:
        "Ładowanie DC trwa 20-45 minut do 80% pojemności, w zależności od mocy stacji. Ładowanie AC zajmuje kilka godzin.",
    },
  ],
  type2: [
    {
      question: "Co to jest złącze Type 2?",
      answer:
        "Type 2 (Mennekes) to europejski standard ładowania AC dla pojazdów elektrycznych. Obsługuje ładowanie jednofazowe i trójfazowe, a w Polsce jest najczęściej spotykanym typem złącza.",
    },
    {
      question: "Jaką moc ładowania zapewnia Type 2?",
      answer:
        "Ładowarki AC z Type 2 oferują zwykle od 3,7 kW (jednofazowe) do 22 kW (trójfazowe). Moc zależy również od ładowarki pokładowej samochodu, która często ogranicza ją do 11 kW.",
    },
    {
      question: "Które samochody obsługują Type 2?",
      answer:
        "Praktycznie każdy samochód elektryczny i hybryda plug-in sprzedawane w Europie mają gniazdo Type 2 do ładowania AC, w tym pojazdy Volkswagena, Renault, BMW, Tesli, Hyundaia i Kii.",
    },
    {
      question: "Jak długo trwa ładowanie złączem Type 2?",
      answer:
        "Pełne naładowanie akumulatora ładowarką AC trwa zwykle od 4 do 8 godzin, dlatego Type 2 najlepiej sprawdza się przy postoju w pracy, w domu lub na parkingu miejskim.",
    },
  ],
  chademo: [
    {
      question: "Co to jest złącze CHAdeMO?",
      answer:
        "CHAdeMO to japoński standard szybkiego ładowania DC, powszechnie używany w samochodach Nissana, Mitsubishi i Toyoty.",
    },
    {
      question: "Czy CHAdeMO jest wciąż popularne?",
      answer:
        "CHAdeMO jest powoli wycofywane na rzecz CCS2. Nowe samochody rzadko je obsługują, ale starsze modele je wymagają.",
    },
  ],
};
