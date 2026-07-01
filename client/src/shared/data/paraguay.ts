export interface DepartmentEntry {
  name: string;
  region: string;
  cities: string[];
}

export const DEPARTMENTS: DepartmentEntry[] = [
  {
    name: 'Distrito Capital',
    region: 'Distrito Capital',
    cities: ['Asunción'],
  },
  {
    name: 'Concepción',
    region: 'Región Oriental',
    cities: [
      'Concepción (Capital)', 'Arroyito', 'Azotey', 'Belén', 'Horqueta',
      'Loreto', 'Paso Barreto', 'San Alfredo', 'San Carlos del Apa',
      'San Lázaro', 'Sargento José Félix López', 'Yby Yaú',
    ],
  },
  {
    name: 'San Pedro',
    region: 'Región Oriental',
    cities: [
      'San Pedro de Ycuamandiyú (Capital)', '25 de Diciembre', 'Antequera',
      'Capiibary', 'Chore', 'General Elizardo Aquino',
      'General Francisco Isidoro Resquín', 'Guayaibí',
      'Itacurubí del Rosario', 'Katueté', 'Liberación', 'Lima',
      'Nueva Germania', 'San Estanislao (Santaní)', 'San Pablo',
      'San Vicente Pancholo', 'Santa Rosa del Aguaray', 'Tacuatí',
      'Unión', 'Villa del Rosario', 'Yataity del Norte', 'Yrybucuá',
    ],
  },
  {
    name: 'Cordillera',
    region: 'Región Oriental',
    cities: [
      'Caacupé (Capital)', 'Altos', 'Arroyos y Esteros', 'Atemby',
      'Caraguatay', 'Emboscada', 'Eusebio Ayala', 'Isla Pucú',
      'Itacurubí de la Cordillera', 'Juan de Mena', 'Loma Grande',
      'Mbocayaty del Yhaguy', 'Nueva Colombia', 'Piribebuy',
      'Primero de Marzo', 'San Bernardino', 'San José de los Arroyos',
      'Santa Elena', 'Tobatí', 'Valenzuela',
    ],
  },
  {
    name: 'Guairá',
    region: 'Región Oriental',
    cities: [
      'Villarrica (Capital)', 'Borja', 'Capitán Mauricio José Troche',
      'Coronel Martínez', 'Doctor Botrell', 'Garay', 'Independencia',
      'Itapé', 'Iturbe', 'José Fassardi', 'Mbocayaty',
      'Natalicio Talavera', 'Ñumí', 'Paso Yobái', 'San Salvador',
      'Tebicuary', 'Yataity',
    ],
  },
  {
    name: 'Caaguazú',
    region: 'Región Oriental',
    cities: [
      'Coronel Oviedo (Capital)', '3 de Febrero', 'Caaguazú', 'Carayaó',
      'Doctor Cecilio Báez', 'Doctor J. Eulogio Estigarribia (Campo 9)',
      'Doctor Juan Manuel Frutos (Pastoreo)', 'José Domingo Ocampos',
      'La Pastora', 'Mariscal Francisco Solano López', 'Nueva Londres',
      'Nueva Toledo', 'R.I. 3 Corrales', 'Raúl Arsenio Oviedo',
      'Repatriación', 'San Joaquín', 'San José de los Arroyos',
      'Santa Rosa del Mbutuy', 'Simón Bolívar', 'Tembiaporá',
      'Vaquería', 'Yhú',
    ],
  },
  {
    name: 'Caazapá',
    region: 'Región Oriental',
    cities: [
      'Caazapá (Capital)', '3 de Mayo', 'Buena Vista',
      'Doctor Moisés S. Bertoni', 'Fulgencio Yegros',
      'General Higinio Morínigo', 'Maciel', 'San Juan Nepomuceno',
      'Tavaí', 'Yuty',
    ],
  },
  {
    name: 'Itapúa',
    region: 'Región Oriental',
    cities: [
      'Encarnación (Capital)', 'Alto Verá', 'Bella Vista', 'Cambyretá',
      'Capitán Meza', 'Capitán Miranda', 'Carlos Antonio López',
      'Carmen del Paraná', 'Coronel Bogado', 'Edelira', 'Fram',
      'General Artigas', 'General Delgado', 'Hohendau', 'Itapúa Poty',
      'Jesús', 'José Leandro Oviedo', 'Mayor Julio Dionisio Otaño',
      'Natalio', 'Nueva Alborada', 'Obligado', 'Pirapó',
      'San Cosme y Damián', 'San Juan del Paraná', 'San Pedro del Paraná',
      'San Rafael del Paraná', 'Santa María',
      'Tomás Romero Pereira (María Auxiliadora)', 'Trinidad', 'Yatytay',
    ],
  },
  {
    name: 'Misiones',
    region: 'Región Oriental',
    cities: [
      'San Juan Bautista (Capital)', 'Ayolas', 'San Ignacio Guazú',
      'San Miguel', 'San Patricio', 'Santa María', 'Santa Rosa',
      'Santiago', 'Villa Florida', 'Yabebyry',
    ],
  },
  {
    name: 'Paraguarí',
    region: 'Región Oriental',
    cities: [
      'Paraguarí (Capital)', 'Acahay', 'Caapucú', 'Carapeguá',
      'Escobar', 'General Bernardino Caballero', 'La Colmena',
      'Mbuyapey', 'Pirayú', 'Quiindy', 'Quyquyhó',
      'San Roque González de Santa Cruz', 'Sapucai', 'Tebaicuary-mí',
      'Yaguarón', 'Ybycuí', 'Ybytymí',
    ],
  },
  {
    name: 'Alto Paraná',
    region: 'Región Oriental',
    cities: [
      'Ciudad del Este (Capital)', 'Ciudad Presidencial Franco',
      'Doctor Juan León Mallorquín', 'Doctor Raúl Peña',
      'Domingo Martínez de Irala', 'Hernandarias', 'Iruña', 'Itakyry',
      'Juan Emilio O\'Leary', 'Los Cedrales', 'Mbaracayú', 'Minga Guazú',
      'Minga Porá', 'Naranjal', 'Ñacunday', 'San Alberto',
      'San Cristóbal', 'Santa Fe del Paraná', 'Santa Rita',
      'Santa Rosa del Monday', 'Tavapy', 'Yguazú',
    ],
  },
  {
    name: 'Central',
    region: 'Región Oriental',
    cities: [
      'Areguá (Capital)', 'Capiatá', 'Fernando de la Mora',
      'Guarambaré', 'Itá', 'Itauguá', 'J. Augusto Saldívar',
      'Lambaré', 'Limpio', 'Luque', 'Mariano Roque Alonso',
      'Nueva Italia', 'Ñemby', 'San Antonio', 'San Lorenzo',
      'Villa Elisa', 'Villeta', 'Ypacaraí', 'Ypané',
    ],
  },
  {
    name: 'Ñeembucú',
    region: 'Región Oriental',
    cities: [
      'Pilar (Capital)', 'Alberdi', 'Cerrito', 'Desmochados',
      'General José Eduvigis Díaz', 'Guazú Cuá', 'Humaitá', 'Isla Umbú',
      'Laureles', 'Mayor José de Jesús Martínez', 'Paso de Patria',
      'San Juan Bautista del Ñeembucú', 'Tacuaras', 'Villa Franca',
      'Villa Oliva', 'Villalbín',
    ],
  },
  {
    name: 'Amambay',
    region: 'Región Oriental',
    cities: [
      'Pedro Juan Caballero (Capital)', 'Bella Vista Norte',
      'Capitán Bado', 'Karapaí', 'Cerro Corá',
    ],
  },
  {
    name: 'Canindeyú',
    region: 'Región Oriental',
    cities: [
      'Salto del Guairá (Capital)', 'Corpus Christi', 'Curuguaty',
      'General Francisco Caballero Álvarez (Puente Kyjhá)', 'Itanará',
      'Katueté', 'Laurel', 'Maracaná', 'Nueva Esperanza',
      'Puerto Adela', 'Villa Ygatimí', 'Yasy Cañy', 'Yby Pytá',
      'Ybyrarovana',
    ],
  },
  {
    name: 'Presidente Hayes',
    region: 'Región Occidental (Chaco)',
    cities: [
      'Villa Hayes (Capital)', 'Benjamín Aceval', 'Doctor José Falcón',
      'General José María Bruguez', 'Nanawa (Puerto Elsa)',
      'Puerto Pinasco', 'Teniente 1° Manuel Irala Fernández',
      'Teniente Esteban Martínez', 'Campo Aceval',
    ],
  },
  {
    name: 'Boquerón',
    region: 'Región Occidental (Chaco)',
    cities: [
      'Filadelfia (Capital)', 'Loma Plata',
      'Mariscal José Félix Estigarribia', 'Boquerón (Neuland)',
    ],
  },
  {
    name: 'Alto Paraguay',
    region: 'Región Occidental (Chaco)',
    cities: [
      'Fuerte Olimpo (Capital)', 'Bahía Negra',
      'Capitán Carmelo Peralta', 'Puerto Casado',
    ],
  },
];

export function getCitiesByDepartment(departmentName: string): string[] {
  const dept = DEPARTMENTS.find((d) => d.name === departmentName);
  return dept?.cities ?? [];
}
