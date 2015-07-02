 /***
  * This project is licensed under the terms of the MIT license.
  * Copyright © 2015 Alexey Kopytko
  */

"use strict";

(function($) {

    /*
     * На сколько страниц автоматически прокручиваем до остановки
     */
    var maxPages = 3;
    /*
     * За сколько до конца страницы включаем прокрутку
     */
    var scrollBufferRatio = 1 / 3;
    /*
     * Где находится область для дополнения (содержимое)
     */
    var elementContainerSelector = '.messages';
    /*
     * Что делать если не найден новое содержимое
     */
    var elementFindingErrorHandler = function() {
        throw "Could not find " + elementContainerSelector;
    };

    /*
     * Названия события которое можно изменить если есть несколько областей прокрутки
     */
    var eventName = 'scroll.toInfinity';
    /*
     * Где находится выбор страниц для перехода
     */
    var pagerSelector = '.pager';
    /*
     * Где найти ссылку на следующую страницу
     */
    var nextPageSelector = '.pager .nextpage';

    var $window = $(window);
    // инициализируем при загрузке страницы
    var $elementContainer;
    var topOffset = 0,
        scrollBuffer = 1,
        pageCounter = 1;

    var eventProcessor = function(finished) {
        // позиция прокрутки когда должна сработать загрузка
        // считается от фактической высоты содержимого
        var triggerPosition = $elementContainer.height() + topOffset - scrollBuffer;
        // текущая позиция прокрутки по нижней части окна
        var scrollPosition = $window.scrollTop() + $window.height();

        // еще не дошли до нужной точки, ничего не делаем
        if (scrollPosition < triggerPosition) {
            // но ждём дальше
            finished();
            return true;
        }

        // пролистали достаточное число страниц
        if (pageCounter >= maxPages) {
            // дадим выбор пользователю листать ли дальше
            $(pagerSelector).show();
            // не перезапускаем загрузку
            return true;
        }

        // если следующей страницы нет...
        var $nextPage = $(nextPageSelector);
        if ($nextPage.length == 0) {
            // то и загружать дальше нечего
            return true;
        }

        $.get($nextPage.attr('href'), function(data) {
            var $data = $(data);

            // найдем содержимое в следующей странице
            var $newContent = $data.find(elementContainerSelector);
            if ($newContent.length == 0) {
                // если элемент не найден, он может быть корневым
                $newContent = $data.filter(elementContainerSelector);
            }
            // если ничего не найдено, то это конкретно ошибка
            if ($newContent.length == 0) {
                elementFindingErrorHandler();
            }

            // содержимое из следующей страницы допишем к содержимому страницы в окне
            $elementContainer.append($newContent.first().html());

            // найдем выбор страниц на следующей странице
            var $newPager = $data.find(pagerSelector);
            if ($newPager.length == 0) {
                // корневой элемент тоже поищем
                $newPager = $data.filter(pagerSelector);
            }
            // заменим выбор страниц новым
            var newPager = $newPager.first().html();
            // и скроем его пока не будет нужен
            $(pagerSelector).html(newPager).hide();

        }).always(function() {
            pageCounter += 1;
            // по окончании загрузки снова следим за прокруткой
            finished();
        });
    };

    var eventTimeout = 0;

    var eventHandler = function() {
        // событие на прокрутку должно сработать только один раз
        $window.unbind(eventName);
        clearTimeout(eventTimeout);
        eventTimeout = setTimeout(function() {
            // возьмем небольшую паузу чтобы не считать оставшиеся
            // пиксели при каждом событии прокрутки
            eventProcessor(function() {
                // после окончания загрузки снова ждем прокрутки
                $window.bind(eventName, eventHandler);
            });
        }, 100);
    };

    $(function() {
        $elementContainer = $(elementContainerSelector);
        // расстояния до элемента от верха экрана
        topOffset = $elementContainer.offset().top;
        // зададим пропорционально изначальной высоте
        scrollBuffer = $elementContainer.height() * scrollBufferRatio;
        $window.bind(eventName, eventHandler);
    });

})(jQuery);

