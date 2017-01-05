var subir = (function ($, win) {
  'use strict';

  return function (sl, pc, ms) {
    $(sl).style.display = 'none';

    addEventListener('scroll', function () {
      var height = $('body').scrollHeight;
      var scroll = win.scrollY;

      if ((height - win.innerHeight) / (100 / pc) <= scroll) {
        $(sl).style.display = '';

        $(sl).onclick = function () {
          var interval = setInterval(function () {
            win.scroll(win.scrollX, scroll);

            if (scroll <= 0) {
              clearInterval(interval);
            }

            scroll -= 20;
          }, ms);
        }
      } else {
        $(sl).style.display = 'none';
      }
    });
  }
})(function (selector) {
  return document.querySelector(selector);
}, window);
