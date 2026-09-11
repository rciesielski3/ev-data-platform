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
