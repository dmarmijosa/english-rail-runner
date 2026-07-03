/**
 * @fileoverview Domain data: 36 levels, basics → essentials. Pure data.
 * Each item is [es (prompt shown), en (correct answer)]; distractors are
 * drawn from the same level by the quiz module, so they stay plausible.
 */

/** One curriculum level: a themed unit of 8 word/phrase pairs. */
export interface LevelDef {
  id: number;
  unit: string;
  items: ReadonlyArray<readonly [string, string]>;
}

export interface LevelConfig {
  speed: number;
  questions: number;
  obstacleRate: number;
  rampRate: number;
  powerupCount: number;
  droneStart: number;
}

export const CURRICULUM: readonly LevelDef[] = [
  // ——— TIER 1 · Lo básico (1–6) ———
  { id: 1, unit: 'Saludos', items: [
    ['Hola', 'Hello'], ['Adiós', 'Goodbye'], ['Buenos días', 'Good morning'],
    ['Buenas noches', 'Good night'], ['Por favor', 'Please'], ['Gracias', 'Thank you'],
    ['Lo siento', 'Sorry'], ['De nada', "You're welcome"],
  ]},
  { id: 2, unit: 'Números', items: [
    ['Uno', 'One'], ['Dos', 'Two'], ['Tres', 'Three'], ['Cuatro', 'Four'],
    ['Cinco', 'Five'], ['Seis', 'Six'], ['Siete', 'Seven'], ['Diez', 'Ten'],
  ]},
  { id: 3, unit: 'Colores', items: [
    ['Rojo', 'Red'], ['Azul', 'Blue'], ['Verde', 'Green'], ['Amarillo', 'Yellow'],
    ['Negro', 'Black'], ['Blanco', 'White'], ['Naranja', 'Orange'], ['Morado', 'Purple'],
  ]},
  { id: 4, unit: 'Familia', items: [
    ['Madre', 'Mother'], ['Padre', 'Father'], ['Hermano', 'Brother'], ['Hermana', 'Sister'],
    ['Hijo', 'Son'], ['Hija', 'Daughter'], ['Abuelo', 'Grandfather'], ['Abuela', 'Grandmother'],
  ]},
  { id: 5, unit: 'Días y meses', items: [
    ['Lunes', 'Monday'], ['Martes', 'Tuesday'], ['Viernes', 'Friday'], ['Domingo', 'Sunday'],
    ['Enero', 'January'], ['Junio', 'June'], ['Hoy', 'Today'], ['Mañana', 'Tomorrow'],
  ]},
  { id: 6, unit: 'Animales', items: [
    ['Perro', 'Dog'], ['Gato', 'Cat'], ['Pájaro', 'Bird'], ['Caballo', 'Horse'],
    ['Vaca', 'Cow'], ['Pez', 'Fish'], ['Oso', 'Bear'], ['Zorro', 'Fox'],
  ]},
  // ——— TIER 2 · Mi mundo (7–12) ———
  { id: 7, unit: 'Comida', items: [
    ['Pan', 'Bread'], ['Leche', 'Milk'], ['Huevo', 'Egg'], ['Queso', 'Cheese'],
    ['Manzana', 'Apple'], ['Pollo', 'Chicken'], ['Arroz', 'Rice'], ['Agua', 'Water'],
  ]},
  { id: 8, unit: 'La casa', items: [
    ['Casa', 'House'], ['Cocina', 'Kitchen'], ['Dormitorio', 'Bedroom'], ['Baño', 'Bathroom'],
    ['Puerta', 'Door'], ['Ventana', 'Window'], ['Mesa', 'Table'], ['Silla', 'Chair'],
  ]},
  { id: 9, unit: 'La escuela', items: [
    ['Libro', 'Book'], ['Lápiz', 'Pencil'], ['Profesor', 'Teacher'], ['Estudiante', 'Student'],
    ['Escuela', 'School'], ['Papel', 'Paper'], ['Pregunta', 'Question'], ['Respuesta', 'Answer'],
  ]},
  { id: 10, unit: 'El cuerpo', items: [
    ['Cabeza', 'Head'], ['Mano', 'Hand'], ['Pie', 'Foot'], ['Ojo', 'Eye'],
    ['Boca', 'Mouth'], ['Nariz', 'Nose'], ['Brazo', 'Arm'], ['Pierna', 'Leg'],
  ]},
  { id: 11, unit: 'La ropa', items: [
    ['Camisa', 'Shirt'], ['Pantalones', 'Trousers'], ['Zapatos', 'Shoes'], ['Vestido', 'Dress'],
    ['Sombrero', 'Hat'], ['Chaqueta', 'Jacket'], ['Calcetines', 'Socks'], ['Bufanda', 'Scarf'],
  ]},
  { id: 12, unit: 'El clima', items: [
    ['Sol', 'Sun'], ['Lluvia', 'Rain'], ['Nieve', 'Snow'], ['Viento', 'Wind'],
    ['Nube', 'Cloud'], ['Frío', 'Cold'], ['Calor', 'Hot'], ['Tormenta', 'Storm'],
  ]},
  // ——— TIER 3 · Acción (13–18) ———
  { id: 13, unit: 'Verbos comunes I', items: [
    ['Ser / estar', 'To be'], ['Tener', 'To have'], ['Ir', 'To go'], ['Hacer', 'To do'],
    ['Comer', 'To eat'], ['Beber', 'To drink'], ['Dormir', 'To sleep'], ['Correr', 'To run'],
  ]},
  { id: 14, unit: 'Verbos comunes II', items: [
    ['Hablar', 'To speak'], ['Escuchar', 'To listen'], ['Leer', 'To read'], ['Escribir', 'To write'],
    ['Ver', 'To see'], ['Comprar', 'To buy'], ['Trabajar', 'To work'], ['Jugar', 'To play'],
  ]},
  { id: 15, unit: 'Adjetivos', items: [
    ['Grande', 'Big'], ['Pequeño', 'Small'], ['Rápido', 'Fast'], ['Lento', 'Slow'],
    ['Bueno', 'Good'], ['Malo', 'Bad'], ['Nuevo', 'New'], ['Viejo', 'Old'],
  ]},
  { id: 16, unit: 'Lugares', items: [
    ['Ciudad', 'City'], ['Calle', 'Street'], ['Parque', 'Park'], ['Tienda', 'Shop'],
    ['Hospital', 'Hospital'], ['Banco', 'Bank'], ['Playa', 'Beach'], ['Montaña', 'Mountain'],
  ]},
  { id: 17, unit: 'Transporte', items: [
    ['Tren', 'Train'], ['Coche', 'Car'], ['Autobús', 'Bus'], ['Avión', 'Plane'],
    ['Bicicleta', 'Bicycle'], ['Barco', 'Boat'], ['Estación', 'Station'], ['Billete', 'Ticket'],
  ]},
  { id: 18, unit: 'El tiempo', items: [
    ['Ahora', 'Now'], ['Después', 'Later'], ['Siempre', 'Always'], ['Nunca', 'Never'],
    ['Temprano', 'Early'], ['Tarde', 'Late'], ['Ayer', 'Yesterday'], ['Semana', 'Week'],
  ]},
  // ——— TIER 4 · Frases útiles (19–24) ———
  { id: 19, unit: 'Presentarse', items: [
    ['Me llamo Ana', 'My name is Ana'], ['¿Cómo estás?', 'How are you?'],
    ['Estoy bien', "I'm fine"], ['Mucho gusto', 'Nice to meet you'],
    ['¿De dónde eres?', 'Where are you from?'], ['Soy de España', "I'm from Spain"],
    ['¿Cuántos años tienes?', 'How old are you?'], ['Tengo veinte años', "I'm twenty years old"],
  ]},
  { id: 20, unit: 'En el restaurante', items: [
    ['La carta, por favor', 'The menu, please'], ['Quiero una pizza', 'I want a pizza'],
    ['La cuenta, por favor', 'The bill, please'], ['Está delicioso', "It's delicious"],
    ['Tengo hambre', "I'm hungry"], ['Tengo sed', "I'm thirsty"],
    ['Una mesa para dos', 'A table for two'], ['Sin azúcar', 'Without sugar'],
  ]},
  { id: 21, unit: 'Direcciones', items: [
    ['¿Dónde está el baño?', 'Where is the bathroom?'], ['A la derecha', 'To the right'],
    ['A la izquierda', 'To the left'], ['Todo recto', 'Straight ahead'],
    ['Cerca de aquí', 'Near here'], ['Lejos', 'Far away'],
    ['Estoy perdido', "I'm lost"], ['¿Puedes ayudarme?', 'Can you help me?'],
  ]},
  { id: 22, unit: 'De compras', items: [
    ['¿Cuánto cuesta?', 'How much is it?'], ['Es muy caro', "It's very expensive"],
    ['Es barato', "It's cheap"], ['Quiero comprarlo', 'I want to buy it'],
    ['¿Tiene otra talla?', 'Do you have another size?'], ['Solo estoy mirando', "I'm just looking"],
    ['¿Aceptan tarjeta?', 'Do you take cards?'], ['Me lo llevo', "I'll take it"],
  ]},
  { id: 23, unit: 'En el aeropuerto', items: [
    ['Mi pasaporte', 'My passport'], ['El vuelo', 'The flight'],
    ['La maleta', 'The suitcase'], ['Puerta de embarque', 'Boarding gate'],
    ['¿A qué hora sale?', 'What time does it leave?'], ['Está retrasado', "It's delayed"],
    ['Equipaje de mano', 'Hand luggage'], ['Buen viaje', 'Have a good trip'],
  ]},
  { id: 24, unit: 'En el hotel', items: [
    ['Una habitación doble', 'A double room'], ['¿Tiene wifi?', 'Do you have wifi?'],
    ['La llave', 'The key'], ['El desayuno', 'The breakfast'],
    ['¿A qué hora es la salida?', 'What time is check-out?'], ['Una noche más', 'One more night'],
    ['No funciona', "It doesn't work"], ['Necesito toallas', 'I need towels'],
  ]},
  // ——— TIER 5 · Vida real (25–30) ———
  { id: 25, unit: 'El trabajo', items: [
    ['Trabajo', 'Job'], ['Reunión', 'Meeting'], ['Jefe', 'Boss'], ['Sueldo', 'Salary'],
    ['Correo electrónico', 'Email'], ['Estoy ocupado', "I'm busy"],
    ['Llego tarde', "I'm running late"], ['Buen trabajo', 'Good job'],
  ]},
  { id: 26, unit: 'La salud', items: [
    ['Me duele la cabeza', 'I have a headache'], ['Estoy enfermo', "I'm sick"],
    ['El médico', 'The doctor'], ['La farmacia', 'The pharmacy'],
    ['Necesito ayuda', 'I need help'], ['Me encuentro mejor', 'I feel better'],
    ['Una cita', 'An appointment'], ['La medicina', 'The medicine'],
  ]},
  { id: 27, unit: 'Emociones', items: [
    ['Feliz', 'Happy'], ['Triste', 'Sad'], ['Cansado', 'Tired'], ['Enfadado', 'Angry'],
    ['Nervioso', 'Nervous'], ['Tranquilo', 'Calm'], ['Sorprendido', 'Surprised'], ['Aburrido', 'Bored'],
  ]},
  { id: 28, unit: 'Preguntas comunes', items: [
    ['¿Qué es esto?', 'What is this?'], ['¿Por qué?', 'Why?'],
    ['¿Quién es?', 'Who is it?'], ['¿Cuándo?', 'When?'],
    ['¿Cómo se dice...?', 'How do you say...?'], ['¿Qué hora es?', 'What time is it?'],
    ['¿Hablas español?', 'Do you speak Spanish?'], ['No entiendo', "I don't understand"],
  ]},
  { id: 29, unit: 'Conectores', items: [
    ['Y', 'And'], ['Pero', 'But'], ['Porque', 'Because'], ['Entonces', 'So'],
    ['También', 'Also'], ['Quizás', 'Maybe'], ['Por supuesto', 'Of course'], ['Sin embargo', 'However'],
  ]},
  { id: 30, unit: 'Pasado básico', items: [
    ['Fui al cine', 'I went to the cinema'], ['Comí pizza', 'I ate pizza'],
    ['Vi una película', 'I watched a movie'], ['Estuve en casa', 'I was at home'],
    ['Compré pan', 'I bought bread'], ['Hice ejercicio', 'I did exercise'],
    ['Dormí bien', 'I slept well'], ['Fue divertido', 'It was fun'],
  ]},
  // ——— TIER 6 · Conversación esencial (31–36) ———
  { id: 31, unit: 'Planes futuros', items: [
    ['Voy a viajar', "I'm going to travel"], ['Mañana trabajaré', 'Tomorrow I will work'],
    ['¿Qué vas a hacer?', 'What are you going to do?'], ['Quiero aprender inglés', 'I want to learn English'],
    ['Nos vemos luego', 'See you later'], ['Tengo planes', 'I have plans'],
    ['El próximo año', 'Next year'], ['Pronto', 'Soon'],
  ]},
  { id: 32, unit: 'Conversación casual', items: [
    ['¿Qué tal tu día?', 'How was your day?'], ['Más o menos', 'So-so'],
    ['¡Qué buena idea!', 'What a good idea!'], ['No te preocupes', "Don't worry"],
    ['Tienes razón', "You're right"], ['Estoy de acuerdo', 'I agree'],
    ['¡Cuánto tiempo!', 'Long time no see!'], ['Cuídate', 'Take care'],
  ]},
  { id: 33, unit: 'Opiniones', items: [
    ['Me gusta', 'I like it'], ['No me gusta', "I don't like it"],
    ['Me encanta', 'I love it'], ['Creo que sí', 'I think so'],
    ['En mi opinión', 'In my opinion'], ['Prefiero el café', 'I prefer coffee'],
    ['Es interesante', "It's interesting"], ['No estoy seguro', "I'm not sure"],
  ]},
  { id: 34, unit: 'Emergencias', items: [
    ['¡Socorro!', 'Help!'], ['Llama a la policía', 'Call the police'],
    ['Es una emergencia', "It's an emergency"], ['Ten cuidado', 'Be careful'],
    ['Perdí mi cartera', 'I lost my wallet'], ['Me robaron', 'I was robbed'],
    ['¡Cuidado!', 'Watch out!'], ['Todo está bien', 'Everything is fine'],
  ]},
  { id: 35, unit: 'Tecnología', items: [
    ['El teléfono', 'The phone'], ['El ordenador', 'The computer'],
    ['La contraseña', 'The password'], ['Sin conexión', 'Offline'],
    ['Enviar un mensaje', 'Send a message'], ['Cargar la batería', 'Charge the battery'],
    ['La pantalla', 'The screen'], ['Descargar', 'Download'],
  ]},
  { id: 36, unit: 'Repaso esencial', items: [
    ['¿Puedes repetir?', 'Can you repeat?'], ['Habla más despacio', 'Speak more slowly'],
    ['¿Qué significa?', 'What does it mean?'], ['Estoy aprendiendo', "I'm learning"],
    ['Un poco de inglés', 'A little English'], ['Cada día mejor', 'Better every day'],
    ['Lo conseguí', 'I did it'], ['Sigue adelante', 'Keep going'],
  ]},
];

/**
 * Track/difficulty config per level index (0-based): speed and hazard
 * density scale with progress; the reading window is enforced downstream.
 */
export function levelConfig(i: number): LevelConfig {
  const tier = Math.floor(i / 6); // 0..5
  return {
    speed: Math.min(14 + i * 0.35, 26),
    questions: 8,
    obstacleRate: 0.35 + tier * 0.09,   // obstacles per 20 m segment
    rampRate: 0.10 + tier * 0.02,
    powerupCount: Math.max(2, 4 - Math.floor(tier / 2)),
    droneStart: 30,
  };
}
