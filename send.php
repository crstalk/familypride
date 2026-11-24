<?php
// =========================================================
// send.php — принимает заявку с сайта и пересылает её в Telegram.
//
// Как это работает:
// 1. script.js отправляет сюда данные формы (POST-запрос).
// 2. Мы проверяем данные и отсеиваем спам.
// 3. Собираем текст сообщения и отправляем через Telegram Bot API.
// 4. Отвечаем браузеру в формате JSON: получилось или нет.
// =========================================================

// Отвечаем всегда в JSON — так script.js легко поймёт ответ
header('Content-Type: application/json; charset=utf-8');

// Короткая функция: отправить ответ и закончить работу скрипта
function respond(bool $ok, string $message, int $code = 200): void
{
    http_response_code($code);
    echo json_encode(['ok' => $ok, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

// ---------- 1. Принимаем только POST ----------
// Если кто-то просто откроет send.php в браузере (GET) — отказываем
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Метод не поддерживается', 405);
}

$config = require __DIR__ . '/config.php';

// ---------- 2. Ловушка для ботов (honeypot) ----------
// Поле "website" спрятано от людей. Живой человек его не видит и не заполняет,
// а спам-боты заполняют все поля подряд. Делаем вид, что всё хорошо,
// чтобы бот не понял, что его поймали.
if (!empty($_POST['website'])) {
    respond(true, 'Спасибо!');
}

// ---------- 3. Ограничение частоты ----------
// Запоминаем время последней заявки с этого IP во временном файле.
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
// За прокси REMOTE_ADDR — это адрес прокси, одинаковый для всех посетителей.
// Без этой строки ограничение срабатывало бы сразу на всех людей.
if ($config['trust_proxy'] && !empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
    $ip = trim(explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0]);
}
$rateFile = sys_get_temp_dir() . '/arenda_' . md5($ip);
if (is_file($rateFile) && time() - (int) file_get_contents($rateFile) < $config['rate_limit_seconds']) {
    respond(false, 'Слишком часто. Подождите немного и попробуйте снова.', 429);
}

// ---------- 4. Берём и проверяем данные ----------
// trim убирает пробелы по краям; mb_substr обрезает слишком длинный текст
function field(string $name, int $maxLength = 100): string
{
    return mb_substr(trim((string) ($_POST[$name] ?? '')), 0, $maxLength);
}

$name   = field('name');
$phone  = field('phone', 30);
$date   = field('date', 10);
$format = field('format', 10);
$guests = field('guests', 10);
$place  = field('place', 10);
$agree  = field('agree', 5);

$phoneDigits = preg_replace('/\D/', '', $phone); // оставляем только цифры

if ($name === '' || strlen($phoneDigits) < 10) {
    respond(false, 'Проверьте имя и телефон', 422);
}
if ($agree === '') {
    respond(false, 'Нужно согласие на обработку данных', 422);
}

// ---------- 5. Переводим коды из подбора в человеческие слова ----------
$formatNames = ['photo' => 'Фотосессия', 'party' => 'Праздник', 'video' => 'Видеосъёмка', 'corp' => 'Корпоратив'];
$guestNames  = ['kids' => 'Есть дети', 'adults' => 'Только взрослые'];
$placeNames  = ['studio' => 'Студия', 'indoor' => 'Помещение', 'outdoor' => 'Улица'];

// Дату из формата 2026-12-20 делаем 20.12.2026
$dateText = 'не указана';
if (preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $date, $m)) {
    $dateText = "$m[3].$m[2].$m[1]";
}

// ---------- 6. Собираем сообщение ----------
// htmlspecialchars обязателен: иначе символы < > & в имени
// сломают разметку Telegram (или кто-то вставит туда ссылку-ловушку)
$e = fn(string $s): string => htmlspecialchars($s, ENT_QUOTES, 'UTF-8');

$text = "<b>Новая заявка с сайта</b>\n\n"
      . "Имя: " . $e($name) . "\n"
      . "Телефон: " . $e($phone) . "\n"
      . "Дата: " . $e($dateText) . "\n\n"
      . "<b>Из подбора:</b>\n"
      . "Повод: " . $e($formatNames[$format] ?? '—') . "\n"
      . "Гости: " . $e($guestNames[$guests] ?? '—') . "\n"
      . "Место: " . $e($placeNames[$place] ?? '—');

// ---------- 7. Отправляем в Telegram ----------
// Документация: https://core.telegram.org/bots/api#sendmessage
$url = 'https://api.telegram.org/bot' . $config['telegram_token'] . '/sendMessage';

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => [
        'chat_id'    => $config['telegram_chat_id'],
        'text'       => $text,
        'parse_mode' => 'HTML',
    ],
    CURLOPT_RETURNTRANSFER => true, // вернуть ответ строкой, а не печатать его
    CURLOPT_TIMEOUT        => 10,   // не ждать дольше 10 секунд
]);
$response = curl_exec($ch);
curl_close($ch);

$telegram = json_decode((string) $response, true);
$sent = !empty($telegram['ok']);

// ---------- 8. Запасной канал: почта ----------
if ($config['backup_email'] !== '') {
    $plain = strip_tags($text);
    $mailSent = mail(
        $config['backup_email'],
        '=?UTF-8?B?' . base64_encode('Новая заявка с сайта') . '?=',
        $plain,
        "Content-Type: text/plain; charset=utf-8"
    );
    $sent = $sent || $mailSent;
}

if (!$sent) {
    // Записываем причину в лог сервера — пригодится при отладке
    error_log('Заявка не отправлена: ' . $response);
    respond(false, 'Не удалось отправить. Позвоните нам: +7 (919) 999-75-75', 500);
}

// Запоминаем время успешной заявки для защиты от спама
file_put_contents($rateFile, (string) time());

respond(true, 'Спасибо! Мы перезвоним в ближайшее время.');
