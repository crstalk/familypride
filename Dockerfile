# Готовый образ: Apache (веб-сервер) + PHP 8.3.
# Apache отдаёт index.html, style.css, script.js как обычные файлы,
# а send.php запускает через PHP. curl в PHP уже встроен.
FROM php:8.3-apache

# Разрешаем Apache читать .htaccess (по умолчанию в этом образе выключено),
# чтобы работал запрет на открытие config.php из браузера.
RUN sed -i 's/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

# Копируем сайт в папку, которую Apache показывает в интернет.
COPY . /var/www/html/

# Apache работает от пользователя www-data — отдаём ему права на файлы.
RUN chown -R www-data:www-data /var/www/html
