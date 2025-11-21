import { Language } from './types';

interface RubricRow {
  id: number;
  criterion: string;
  levels: {
    0: string;
    1: string;
    2: string;
  };
}

export const rubricContent: Record<Language, RubricRow[]> = {
  es: [
    {
      id: 1,
      criterion: "1. Ajuste de las referencias curriculares al currículum de Navarra",
      levels: {
        0: "No se hace referencia al currículo de Navarra.",
        1: "Se hace referencia parcial o poco precisa al currículo de Navarra.",
        2: "Las referencias están claramente ajustadas y alineadas al currículo de Navarra."
      }
    },
    {
      id: 2,
      criterion: "2. Realización del número de cambios exigidos",
      levels: {
        0: "No se realizan los cambios solicitados.",
        1: "Se realizan solo algunos cambios, sin cumplir el mínimo exigido.",
        2: "Se realizan todos los cambios exigidos y se justifican adecuadamente."
      }
    },
    {
      id: 3,
      criterion: "3. Redacción cercana y precisa",
      levels: {
        0: "Redacción confusa, con errores gramaticales, lenguaje poco adecuado al público.",
        1: "Redacción comprensible pero con algunos errores de claridad, gramática o adecuación.",
        2: "Redacción clara, precisa, correcta y bien adaptada al público objetivo."
      }
    },
    {
      id: 4,
      criterion: "4. Lenguaje no discriminatorio",
      levels: {
        0: "Se usan expresiones excluyentes o sesgadas.",
        1: "Se evita en general el lenguaje discriminatorio, aunque persisten descuidos.",
        2: "Se emplea un lenguaje inclusivo y respetuoso en todo el texto."
      }
    },
    {
      id: 5,
      criterion: "5. Ortografía y coherencia",
      levels: {
        0: "Presenta numerosas faltas de ortografía y problemas de coherencia.",
        1: "Presenta pocas faltas de ortografía o algunas incoherencias.",
        2: "No presenta faltas de ortografía y mantiene coherencia total en las oraciones."
      }
    },
    {
      id: 6,
      criterion: "6. Licencias abiertas",
      levels: {
        0: "No se indican licencias o se usan licencias cerradas/inadecuadas.",
        1: "Se usan licencias abiertas pero no son las más recomendables.",
        2: "Se usan licencias abiertas correctas (CC-BY o CC-BY-SA preferentemente)."
      }
    },
    {
      id: 7,
      criterion: "7. Citas y créditos",
      levels: {
        0: "No se reconocen autores ni recursos utilizados.",
        1: "Se reconocen algunos autores o recursos, pero de forma incompleta.",
        2: "Se citan y acreditan adecuadamente todos los autores y recursos empleados."
      }
    },
    {
      id: 8,
      criterion: "8. Enlaces",
      levels: {
        0: "Los enlaces no funcionan o no están incrustados en palabras.",
        1: "Los enlaces funcionan pero no cumplen con la apertura en nueva pestaña o tienen permisos mal configurados.",
        2: "Los enlaces funcionan, están incrustados en palabras, se abren en nueva pestaña y tienen permisos correctos."
      }
    }
  ],
  eu: [
    {
      id: 1,
      criterion: "1. Curriculum-erreferentziak Nafarroako curriculumera egokitzea",
      levels: {
        0: "Ez da Nafarroako curriculuma aipatzen.",
        1: "Nafarroako curriculuma modu partzialean edo ez oso zehatzean aipatzen da.",
        2: "Erreferentziak argi eta garbi daude Nafarroako curriculumera egokituta eta lerrokatuta."
      }
    },
    {
      id: 2,
      criterion: "2. Eskatutako aldaketa kopurua egitea",
      levels: {
        0: "Ez dira eskatutako aldaketak egiten.",
        1: "Aldaketa batzuk bakarrik egiten dira, eskatutako gutxienekoa bete gabe.",
        2: "Eskatutako aldaketa guztiak egiten dira eta behar bezala justifikatzen dira."
      }
    },
    {
      id: 3,
      criterion: "3. Idazkera hurbila eta zehatza",
      levels: {
        0: "Idazkera nahasia, akats gramatikalekin, publikoarentzat hizkera ez oso egokia.",
        1: "Idazkera ulergarria baina argitasun, gramatika edo egokitzapen akats batzuekin.",
        2: "Idazkera argia, zehatza, zuzena eta xede-publikoari ondo egokitua."
      }
    },
    {
      id: 4,
      criterion: "4. Hizkera ez-diskriminatzailea",
      levels: {
        0: "Adierazpen baztertzaileak edo alboratuak erabiltzen dira.",
        1: "Oro har, hizkera diskriminatzailea saihesten da, nahiz eta arduragabekeria batzuk dirauten.",
        2: "Testu osoan hizkera inklusiboa eta errespetuzkoa erabiltzen da."
      }
    },
    {
      id: 5,
      criterion: "5. Ortografia eta koherentzia",
      levels: {
        0: "Ortografia-akats ugari eta koherentzia-arazoak ditu.",
        1: "Ortografia-akats gutxi edo inkoherentzia batzuk ditu.",
        2: "Ez du ortografia-akatsik eta esaldietan koherentzia osoa mantentzen du."
      }
    },
    {
      id: 6,
      criterion: "6. Lizentzia irekiak",
      levels: {
        0: "Ez da lizentziarik adierazten edo lizentzia itxiak/desegokiak erabiltzen dira.",
        1: "Lizentzia irekiak erabiltzen dira baina ez dira gomendagarrienak.",
        2: "Lizentzia ireki zuzenak erabiltzen dira (CC-BY edo CC-BY-SA ahal dela)."
      }
    },
    {
      id: 7,
      criterion: "7. Aipamenak eta kredituak",
      levels: {
        0: "Ez dira erabilitako egileak edo baliabideak aitortzen.",
        1: "Egile edo baliabide batzuk aitortzen dira, baina modu osatugabean.",
        2: "Erabilitako egile eta baliabide guztiak behar bezala aipatzen eta egiaztatzen dira."
      }
    },
    {
      id: 8,
      criterion: "8. Estekak",
      levels: {
        0: "Estekek ez dute funtzionatzen edo ez daude hitzetan txertatuta.",
        1: "Estekek funtzionatzen dute baina ez dira leiho berrian irekitzen edo baimenak gaizki konfiguratuta daude.",
        2: "Estekek funtzionatzen dute, hitzetan txertatuta daude, leiho berrian irekitzen dira eta baimen zuzenak dituzte."
      }
    }
  ]
};