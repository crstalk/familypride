// =========================================================
// ДАННЫЕ
// Все животные описаны в одном списке. Чтобы добавить
// животное — добавьте одну строку, и оно появится и в каталоге,
// и в подборе.
//
// formats: photo — фотосессия, party — праздник,
//          video — видеосъёмка, corp — корпоратив
// places:  studio — студия, indoor — помещение, outdoor — улица
// kids:    true — можно с детьми
// photo:   путь к фото, например 'img/lion.jpg' ('' — будет заглушка)
// pos:     какую часть фото показывать, если оно обрезается
//          ('50% 20%' — по центру и ближе к верху). Можно не указывать.
//
// ВАЖНО: признаки расставлены примерно — сверьте с заказчиком!
// =========================================================
const ANIMALS = [
  // --- с фото ---
  { name: 'Львята и львы',   size: 'Крупный', kids: false, places: ['studio', 'indoor'],            formats: ['photo', 'video', 'corp'],          photo: 'img/lion.jpg' },
  { name: 'Тигрята и тигры', size: 'Крупный', kids: false, places: ['studio', 'indoor'],            formats: ['photo', 'video', 'corp'],          photo: 'img/tiger.jpg',     pos: '50% 70%' },
  { name: 'Пума',            size: 'Крупный', kids: false, places: ['studio'],                      formats: ['photo', 'video'],                  photo: 'img/puma.jpg',      pos: '35% 50%' },
  { name: 'Лисята',          size: 'Малыш',   kids: true,  places: ['studio', 'outdoor'],           formats: ['photo', 'video'],                  photo: 'img/fox.jpg',       pos: '60% 35%' },
  { name: 'Енот',            size: 'Малыш',   kids: true,  places: ['studio', 'indoor', 'outdoor'], formats: ['photo', 'party', 'video'],         photo: 'img/raccoon.jpg' },
  { name: 'Обезьянка',       size: 'Малыш',   kids: true,  places: ['studio', 'indoor'],            formats: ['photo', 'party', 'video', 'corp'], photo: 'img/monkey.jpg',    pos: '50% 20%' },
  { name: 'Попугаи',         size: 'Малыш',   kids: true,  places: ['studio', 'indoor', 'outdoor'], formats: ['photo', 'party', 'video', 'corp'], photo: 'img/parrot.jpg',    pos: '50% 20%' },
  { name: 'Филин',           size: 'Малыш',   kids: true,  places: ['studio', 'outdoor'],           formats: ['photo', 'video', 'corp'],          photo: 'img/owl.jpg',       pos: '50% 30%' },
  { name: 'Ящерицы',         size: 'Малыш',   kids: true,  places: ['studio', 'indoor'],            formats: ['photo', 'party'],                  photo: 'img/lizard.jpg',    pos: '45% 40%' },
  { name: 'Крокодильчик',    size: 'Малыш',   kids: false, places: ['studio', 'indoor'],            formats: ['photo', 'party', 'video'],         photo: 'img/crocodile.jpg', pos: '30% 50%' },
  { name: 'Шоу собачек',     size: 'Средний', kids: true,  places: ['indoor', 'outdoor'],           formats: ['party', 'corp'],                   photo: 'img/dog-show.jpg',  pos: '50% 25%' },
  // --- фото пока нет ---
  { name: 'Медвежонок',      size: 'Средний', kids: false, places: ['studio', 'outdoor'],           formats: ['photo', 'video', 'corp'],          photo: '' },
  { name: 'Лемур',           size: 'Малыш',   kids: true,  places: ['studio', 'indoor'],            formats: ['photo', 'party'],                  photo: '' },
  { name: 'Сурикаты',        size: 'Малыш',   kids: true,  places: ['indoor', 'outdoor'],           formats: ['photo', 'party'],                  photo: '' },
  { name: 'Ламы',            size: 'Крупный', kids: true,  places: ['outdoor'],                     formats: ['photo', 'party', 'corp'],          photo: '' },
  { name: 'Альпаки',         size: 'Средний', kids: true,  places: ['indoor', 'outdoor'],           formats: ['photo', 'party', 'corp'],          photo: '' },
  { name: 'Верблюд',         size: 'Крупный', kids: true,  places: ['outdoor'],                     formats: ['photo', 'video', 'corp'],          photo: '' },
  { name: 'Мини-лошадки',    size: 'Средний', kids: true,  places: ['outdoor'],                     formats: ['photo', 'party', 'corp'],          photo: '' },
  { name: 'Оленята',         size: 'Средний', kids: true,  places: ['studio', 'outdoor'],           formats: ['photo', 'video'],                  photo: '' },
  { name: 'Змеи',            size: 'Средний', kids: false, places: ['studio', 'indoor'],            formats: ['photo', 'video', 'party'],         photo: '' },
  { name: 'Ворон',           size: 'Малыш',   kids: true,  places: ['studio', 'outdoor'],           formats: ['photo', 'video'],                  photo: '' },
];

// Русские названия для подписей
const PLACE_NAMES = { studio: 'студия', indoor: 'помещение', outdoor: 'улица' };
const FORMAT_NAMES = { photo: 'фотосессии', party: 'праздника', video: 'видеосъёмки', corp: 'корпоратива' };

// Вопросы для подбора
const QUESTIONS = [
  { key: 'format', title: 'Какой повод?', options: [['photo', 'Фотосессия'], ['party', 'Праздник'], ['video', 'Видеосъёмка'], ['corp', 'Корпоратив']] },
  { key: 'guests', title: 'Кто гости?',   options: [['kids', 'Есть дети'], ['adults', 'Только взрослые']] },
  { key: 'place',  title: 'Где пройдёт?', options: [['studio', 'Студия'], ['indoor', 'Помещение'], ['outdoor', 'На улице']] },
];

// Текущие ответы посетителя (что выбрано по умолчанию)
const answers = { format: 'party', guests: 'kids', place: 'indoor' };


// =========================================================
// ВСПОМОГАТЕЛЬНОЕ: фото или заглушка
// =========================================================
function photoHtml(animal, className) {
  if (animal.photo) {
    // object-position выбирает, какая часть фото видна в рамке (по умолчанию — центр)
    const pos = animal.pos ? ` style="object-position:${animal.pos}"` : '';
    return `<img class="${className}" src="${animal.photo}" alt="${animal.name}" loading="lazy"${pos}>`;
  }
  return `<div class="photo ${className}" role="img" aria-label="Место для фото: ${animal.name}"></div>`;
}


// =========================================================
// 1. КАТАЛОГ ЖИВОТНЫХ
// =========================================================
function renderAnimals() {
  const grid = document.getElementById('animals-grid');

  grid.innerHTML = ANIMALS.map(animal => {
    const kidsText = animal.kids ? 'Можно детям' : 'Со взрослыми';
    const placesText = animal.places.map(p => PLACE_NAMES[p]).join(', ');

    return `
      <article class="animal">
        <div class="animal__photo-wrap">
          ${photoHtml(animal, 'animal__photo')}
          <span class="animal__badge">ПРИВИТ</span>
        </div>
        <div class="animal__body">
          <div class="animal__top">
            <h3 class="animal__name">${animal.name}</h3>
            <span class="animal__size">${animal.size}</span>
          </div>
          <p class="animal__meta">${kidsText} · ${placesText}</p>
        </div>
      </article>`;
  }).join('');
}


// =========================================================
// 2. ПОДБОР: кнопки-вопросы
// =========================================================
function renderQuiz() {
  const quiz = document.getElementById('quiz');

  quiz.innerHTML = QUESTIONS.map((q, i) => `
    <fieldset class="quiz__group">
      <legend class="quiz__legend"><span class="quiz__num">${i + 1}</span>${q.title}</legend>
      <div class="quiz__options">
        ${q.options.map(([value, label]) => `
          <button type="button" class="chip"
                  data-key="${q.key}" data-value="${value}"
                  aria-pressed="${answers[q.key] === value}">${label}</button>
        `).join('')}
      </div>
    </fieldset>
  `).join('');

  // Один обработчик на весь блок (делегирование событий):
  // ловим клик по любой кнопке .chip внутри #quiz
  quiz.addEventListener('click', event => {
    const chip = event.target.closest('.chip');
    if (!chip) return;

    answers[chip.dataset.key] = chip.dataset.value;

    // Переключаем подсветку в этой группе
    quiz.querySelectorAll(`.chip[data-key="${chip.dataset.key}"]`)
      .forEach(btn => btn.setAttribute('aria-pressed', btn === chip));

    renderResult();
  });
}


// =========================================================
// 3. ПОДБОР: считаем очки и показываем топ-3
// =========================================================
function scoreAnimal(animal) {
  let score = 0;
  if (animal.formats.includes(answers.format)) score += 3;      // подходит под повод
  if (answers.guests === 'kids') score += animal.kids ? 2 : -10; // с детьми — только безопасные
  score += animal.places.includes(answers.place) ? 2 : -4;      // может работать в этом месте
  return score;
}

function renderResult() {
  const result = document.getElementById('result');

  const top3 = ANIMALS
    .map((animal, index) => ({ animal, index, score: scoreAnimal(animal) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)  // при равенстве — по порядку в списке
    .slice(0, 3);

  result.innerHTML = top3.map(({ animal }, i) => {
    const why = ['Для ' + FORMAT_NAMES[answers.format]];
    if (answers.guests === 'kids' && animal.kids) why.push('ладит с детьми');
    why.push(PLACE_NAMES[answers.place]);

    return `
      <article class="pick">
        ${photoHtml(animal, 'pick__photo')}
        <div>
          <span class="pick__rank">МЕСТО ${i + 1}</span>
          <h3 class="pick__name">${animal.name}</h3>
          <p class="pick__why">${why.join(' · ')}</p>
        </div>
      </article>`;
  }).join('');
}


// =========================================================
// 4. ВОПРОСЫ-АККОРДЕОН: открыт только один ответ
// =========================================================
function initFaq() {
  const items = document.querySelectorAll('.faq__item');

  items.forEach(item => {
    item.querySelector('.faq__q').addEventListener('click', () => {
      const wasOpen = item.classList.contains('is-open');

      items.forEach(other => {
        other.classList.remove('is-open');
        other.querySelector('.faq__q').setAttribute('aria-expanded', 'false');
      });

      if (!wasOpen) {
        item.classList.add('is-open');
        item.querySelector('.faq__q').setAttribute('aria-expanded', 'true');
      }
    });
  });
}


// =========================================================
// 5. МЕНЮ НА ТЕЛЕФОНЕ
// =========================================================
function initBurger() {
  const burger = document.querySelector('.burger');
  const nav = document.getElementById('nav');

  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', open);
  });

  // Закрываем меню после клика по пункту
  nav.addEventListener('click', event => {
    if (event.target.tagName === 'A') {
      nav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    }
  });
}


// =========================================================
// 6. ФОРМА ЗАЯВКИ
// Проверяем поля в браузере (чтобы человек сразу увидел ошибку),
// потом отправляем данные в send.php. Сервер проверит их ещё раз:
// проверке в браузере доверять нельзя — её легко обойти.
// =========================================================
function initForm() {
  const form = document.getElementById('form');
  const message = document.getElementById('form-message');
  const button = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async event => {
    event.preventDefault();   // не перезагружаем страницу

    const name = form.elements.name;
    const phone = form.elements.phone;
    const agree = form.elements.agree;

    // Простая проверка: имя не пустое, в телефоне хотя бы 10 цифр
    const phoneDigits = phone.value.replace(/\D/g, '');
    name.classList.toggle('is-error', !name.value.trim());
    phone.classList.toggle('is-error', phoneDigits.length < 10);

    if (!name.value.trim() || phoneDigits.length < 10) {
      showMessage('Проверьте имя и телефон', 'is-error');
      return;
    }
    if (!agree.checked) {
      showMessage('Нужно согласие на обработку данных', 'is-error');
      return;
    }

    // FormData сама собирает все поля формы (name, phone, date, agree, website)
    const data = new FormData(form);
    // Добавляем то, что посетитель выбрал в подборе
    data.append('format', answers.format);
    data.append('guests', answers.guests);
    data.append('place', answers.place);

    button.disabled = true;               // защита от двойного нажатия
    button.textContent = 'Отправляем…';

    try {
      const response = await fetch('send.php', { method: 'POST', body: data });
      const result = await response.json(); // send.php отвечает {ok, message}

      showMessage(result.message, result.ok ? 'is-ok' : 'is-error');
      if (result.ok) form.reset();
    } catch (error) {
      // Нет интернета, сервер не ответил или send.php упал
      showMessage('Не удалось отправить. Позвоните нам: +7 (919) 999-75-75', 'is-error');
    } finally {
      button.disabled = false;
      button.textContent = 'Отправить заявку';
    }
  });

  function showMessage(text, type) {
    message.textContent = text;
    message.className = 'form__message ' + type;
  }
}


// =========================================================
// ЗАПУСК — когда страница загрузилась
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
  renderAnimals();
  renderQuiz();
  renderResult();
  initFaq();
  initBurger();
  initForm();
  document.getElementById('year').textContent = new Date().getFullYear();
});
