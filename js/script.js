"use strict";
document.body.classList.add("_lock");

window.addEventListener("load", function () {
  //для загрузочного попапа
  document.body.classList.add("_loaded");
  document.body.classList.remove("_lock");

  animateBlockSimple(); // анимация
  typeWriter();
  useDynamicAdapt("max"); //  Перенос блока при адаптации
  mouseslide(); // слайдер мыщью
  randomBubbles(); // пузырьки
  translator(); //переводчик

  document.addEventListener("click", menuActions);
  function menuActions(e) {
    const targetElement = e.target;
    //----------------------------------------------  Меню  --------------------------------------
    //--- Меню-бургер
    const burgerIcon = document.querySelector(".icon-burger"); // сам бургер
    const menuBody = document.querySelector(".menu__body");
    if (burgerIcon && targetElement == burgerIcon) {
      if (window.matchMedia("(max-width: 479.98px)").matches) {
        document.body.classList.toggle("_lock"); //для запрета прокрутки когда меню активное
      }
      burgerIcon.classList.toggle("_active"); //для превращения бургера
      menuBody.classList.toggle("_active"); // открыть/закрыть меню
    }
    // при открытом меню(размер - не на всю страницу) при клике на страницу меню сворачивается
    if (burgerIcon.classList.contains("_active") && targetElement.closest(".page")) {
      burgerIcon.classList.remove("_active");
      menuBody.classList.remove("_active");
      document.body.classList.remove("_lock");
    }
    // Скролл на блок при клике на ссылку
    if (targetElement.dataset.goto && document.querySelector(targetElement.dataset.goto)) {
      const gotoBlock = document.querySelector(targetElement.dataset.goto);
      //высчитываем положение обьекта !!Обязачельно с учетом высоты шапки!!
      const gotoBlockValue = gotoBlock.getBoundingClientRect().top + window.pageYOffset - document.querySelector("header").offsetHeight;
      // Закрываем меню, когда оно открыто на весь экран на тачскрине
      if (burgerIcon.classList.contains("_active")) {
        document.body.classList.remove("_lock");
        burgerIcon.classList.remove("_active"); //для превращения
        menuBody.classList.remove("_active");
      }
      // --- скролл за время
      const scrollDuration = 500;
      const steps = (scrollDuration / 1000) * 60;
      const currentPosition = window.pageYOffset;
      const distance = gotoBlockValue - currentPosition;
      const stepValue = distance / steps;
      const timeStep = scrollDuration / steps;
      let stepCount = 0;
      const scrollInterval = setInterval(() => {
        stepCount++;
        window.scrollTo(0, currentPosition + stepCount * stepValue);
        if (stepCount >= steps) {
          clearInterval(scrollInterval);
        }
      }, timeStep);

      //откл работу ссылки
      e.preventDefault();
    }

    //------------------------------ Магазин  -------------------------------------
    if (targetElement.classList.contains(".cart-header__link") || targetElement.closest(".cart-header__link")) {
      if (document.querySelector(".cart-list").children.length > 0) {
        document.querySelector(".cart-header").classList.toggle("_active");
      } else {
        document.querySelector(".cart-header__message").classList.toggle("_active");
        setTimeout(() => {
          document.querySelector(".cart-header__message").classList.remove("_active");
        }, 10000);
      }
      e.preventDefault();
    } else if (!targetElement.closest(".cart-header") && !targetElement.classList.contains("actions-product__button")) {
      document.querySelector(".cart-header").classList.remove("_active");
      document.querySelector(".cart-header__message").classList.remove("_active");
    }

    if (targetElement.classList.contains(".move-away") || targetElement.closest(".move-away")) {
      let toDelBlock = document.querySelector(".message__body");
      if (toDelBlock) {
        toDelBlock.style.display = "none";
        headerElement.style.backgroundColor = "transparent";
      }
    }
  }

  // Подсветка ссылки, при блоке в зоне видимости
  const backlightLinks = document.querySelectorAll("[data-goto]");
  if (backlightLinks.length > 0) {
    backlightLinks.forEach((link) => {
      const section = document.querySelector(`${link.dataset.goto}`);
      const blockHeight = section.offsetHeight;
      const viewHeight = window.innerHeight;
      const threshold = 0.5;
      const blockThreshold = viewHeight / blockHeight <= 1 ? (threshold * viewHeight) / blockHeight : threshold;
      const callback = function (entries, observer) {
        if (entries[0].isIntersecting) {
          backlightLinks.forEach((link) => {
            link.classList.remove("_active");
          });
          link.classList.add("_active");
        } else {
          link.classList.remove("_active");
        }
      };
      const sectionObserver = new IntersectionObserver(callback, { threshold: blockThreshold });
      sectionObserver.observe(section);
    });
  }

  // Дейсвия с хедером во время скролла
  const headerElement = document.querySelector("header");
  const headerHeight = headerElement.offsetHeight;
  if (headerElement) {
    document.addEventListener("scroll", () => {
      if (document.body.getBoundingClientRect().top < -headerHeight) {
        headerElement.classList.add("_scroll");
      } else {
        headerElement.classList.remove("_scroll");
      }
    });
  }
});

//==============================================================================
// ------  Спойлеры в хедер при адаптации  ----------------------------
const spoilersArray = document.querySelectorAll("[data-spoilers]");
if (spoilersArray.length > 0) {
  // Получение обычных спойлеров (без медиазапроса)
  // Arrey.from - переводим коллекцию в массив, а затем фильтруем айтемы не содержащие ','
  const spoilersRegular = Array.from(spoilersArray).filter(function (item, index, self) {
    return !item.dataset.spoilers.split(",")[0];
  });
  // инициализация обычных спойлеров
  if (spoilersRegular.length > 0) {
    initSpoilers(spoilersRegular);
  }

  // Получаем спойлеры с медиа-запросом
  const spoilersMedia = Array.from(spoilersArray).filter(function (item, index, self) {
    return item.dataset.spoilers.split(",")[0];
  });
  // Инициализация спойлеров с медиа-запросами
  if (spoilersMedia.length > 0) {
    const breakpointsArray = [];
    spoilersMedia.forEach((item) => {
      const params = item.dataset.spoilers;
      const breakpoint = {};
      const paramsArray = params.split(",");
      breakpoint.value = paramsArray[0];
      breakpoint.type = paramsArray[1] ? paramsArray[1].trim() : "max";
      breakpoint.item = item;
      breakpointsArray.push(breakpoint);
    });
    // Получаем уникальные брейкпоинты
    let mediaQueries = breakpointsArray.map(function (item) {
      return "(" + item.type + "-width: " + item.value + "px)," + item.value + "," + item.type;
    });
    mediaQueries = mediaQueries.filter(function (item, index, self) {
      return self.indexOf(item) === index;
    });
    // Работаем с каждым брейк-поинтом
    mediaQueries.forEach((breakpoint) => {
      const paramsArray = breakpoint.split(",");
      const mediaBreackpoint = paramsArray[1];
      const mediaType = paramsArray[2];
      const matchMedia = window.matchMedia(paramsArray[0]);
      // обьекты с нужными условиями
      const spoilersArray = breakpointsArray.filter(function (item) {
        if (item.value === mediaBreackpoint && item.type === mediaType) {
          return true;
        }
      });
      // Событие
      matchMedia.addListener(function () {
        initSpoilers(spoilersArray, matchMedia);
      });
      // window.addEventListener("resize", function () {
      //   initSpoilers(spoilersArray, matchMedia);
      // });
      initSpoilers(spoilersArray, matchMedia);
    });
  }
  //Инициализация
  function initSpoilers(spoilersArray, matchMedia = false) {
    spoilersArray.forEach((spoilersBlock) => {
      spoilersBlock = matchMedia ? spoilersBlock.item : spoilersBlock;
      if (matchMedia.matches || !matchMedia) {
        spoilersBlock.classList.add("_init");
        initSpoilerBody(spoilersBlock);
        spoilersBlock.addEventListener("click", setSpoilerAction);
      } else {
        spoilersBlock.classList.remove("_init");
        initSpoilerBody(spoilersBlock, false);
        spoilersBlock.removeEventListener("click", setSpoilerAction);
      }
    });
  }
  //Работа с контентом
  function initSpoilerBody(spoilersBlock, hideSpoilerBody = true) {
    const spoilerTitles = spoilersBlock.querySelectorAll("[data-spoiler]");
    if (spoilerTitles.length > 0) {
      spoilerTitles.forEach((spoilerTitle) => {
        if (hideSpoilerBody) {
          spoilerTitle.removeAttribute("tabindex");
          if (!spoilerTitle.classList.contains("_active")) {
            spoilerTitle.nextElementSibling.hidden = true;
          }
        } else {
          spoilerTitle.setAttribute("tabindex", "-1");
          spoilerTitle.nextElementSibling.hidden = false;
        }
      });
    }
  }
  function setSpoilerAction(e) {
    const el = e.target;
    if (el.hasAttribute("data-spoiler") || el.closest("[data-spoiler]")) {
      const spoilerTitle = el.hasAttribute("data-spoiler") ? el : el.closest("[data-spoiler]");
      const spoilersBlock = spoilerTitle.closest("[data-spoilers]");
      const soleSpoiler = spoilersBlock.hasAttribute("data-sole-spoiler") ? true : false;
      if (!spoilersBlock.querySelectorAll("._slide").length) {
        if (soleSpoiler && !spoilerTitle.classList.contains("_active")) {
          hideSpoilersBody(spoilersBlock);
        }
        spoilerTitle.classList.toggle("_active");
        _slideToggle(spoilerTitle.nextElementSibling, 500);
      }
      e.preventDefault();
    }
  }
  function hideSpoilersBody(spoilersBlock) {
    const spoilerActiveTitle = spoilersBlock.querySelector("[data-spoiler]._active");
    if (spoilerActiveTitle) {
      spoilerActiveTitle.classList.remove("_active");
      _slideUp(spoilerActiveTitle.nextElementSibling, 500);
    }
  }
}
//===============================================================
// Slide Toggle
let _slideUp = (target, duration = 500) => {
  if (!target.classList.contains("_slide")) {
    target.classList.add("_slide");
    target.style.transitionProperty = "height,margin,padding";
    target.style.transitionDuration = duration + "ms";
    target.style.height = target.offsetHeight + "px";
    target.offsetHeight;
    target.style.overflow = "hidden";
    target.style.height = 0;
    target.style.paddingTop = 0;
    target.style.paddingBottom = 0;
    target.style.marginTop = 0;
    target.style.marginBottom = 0;
    window.setTimeout(() => {
      target.hidden = true;
      target.style.removeProperty("height");
      target.style.removeProperty("padding-top");
      target.style.removeProperty("padding-bottom");
      target.style.removeProperty("margin-top");
      target.style.removeProperty("margin-bottom");
      target.style.removeProperty("overflow");
      target.style.removeProperty("transition-duration");
      target.style.removeProperty("transition-property");
      target.classList.remove("_slide");
    }, duration);
  }
};
let _slideDown = (target, duration = 500) => {
  if (!target.classList.contains("_slide")) {
    target.classList.add("_slide");
    if (target.hidden) {
      target.hidden = false;
    }
    let height = target.offsetHeight;
    target.style.overflow = "hidden";
    target.style.height = 0;
    target.style.paddingTop = 0;
    target.style.paddingBottom = 0;
    target.style.marginTop = 0;
    target.style.marginBottom = 0;
    target.offsetHeight;
    target.style.transitionProperty = "height,margin,padding";
    target.style.transitionDuration = duration + "ms";
    target.style.height = height + "px";
    target.style.removeProperty("padding-top");
    target.style.removeProperty("padding-bottom");
    target.style.removeProperty("margin-top");
    target.style.removeProperty("margin-bottom");
    window.setTimeout(() => {
      target.style.removeProperty("height");
      target.style.removeProperty("overflow");
      target.style.removeProperty("transition-duration");
      target.style.removeProperty("transition-property");
      target.classList.remove("_slide");
    }, duration);
  }
};
let _slideToggle = (target, duration = 500) => {
  if (target.hidden) {
    return _slideDown(target, duration);
  } else {
    return _slideUp(target, duration);
  }
};
//================================================================================

//=================================================================================
// -------------------  Форма   --------------------------------------
document.addEventListener("DOMContentLoaded", function () {
  //Перехватываем отправку формы, чтоб взять все в свои руки
  const form = document.getElementById("form");
  if (form) {
    form.addEventListener("submit", formSend);
  }

  async function formSend(e) {
    e.preventDefault();
    let error = formValidate(form); //предварительная валидация формы
    let formData = new FormData(form); //получаем данные полей формы
    if (error === 0) {
      form.classList.add("_sending");

      //пробуем выполнить запрос, если сервер не отвечает, тогда сработает catch
      try {
        const formAction = form.getAttribute("action") ? form.getAttribute("action").trim() : "#";
        const formMethod = form.getAttribute("method") ? form.getAttribute("method").trim() : "GET";

        // let response = await fetch(formAction, {
        //   method: formMethod,
        //   body: formData,
        // });
        let response = { ok: false };

        if (response.ok) {
          let result = await response.json(); // получаем ответ
          alert(result.message); // выводим ответ сервера пользователю
          form.reset(); //чистим форму после отправки
          form.classList.remove("_sending"); //убираем покрывало
        } else {
          // запрос был выполнен, но ответ сервера был не успешен

          setTimeout(() => {
            alert("Something was wrong while sending form. Mayby server is not avalable");
            form.classList.remove("_sending");
          }, 5000);
        }
      } catch (error) {
        //возможные ошибки при выполнении запроса
        alert("An error occurred while sending the form: " + error.message);
        form.classList.remove("_sending");
      }
    } else {
      // если не прошло валидацию
      alert("Please fill in the required fields");
    }
  }
  //функция валидации
  function formValidate(form) {
    let error = 0; //изначальное значение
    let formReq = form.querySelectorAll("._req"); //(required - требуемое) этот клас добавить к полям с обязательным заполнением
    for (let index = 0; index < formReq.length; index++) {
      const input = formReq[index];
      formRemoveError(input); //изначально перед каждой проверкой убираем класс "error"
      //проверка E-mail
      if (input.classList.contains("_email")) {
        if (emailTestFail(input) && input.value !== "") {
          formAddTypeError(input); // поле заполнено, но неправильно
          formAddError(input); // элемент не прошел валидацию вообще
          error++; //увеличиваем значение переменной error (0+1)
        } else if (emailTestFail(input) && input.value === "") {
          formAddError(input);
          error++; //увеличиваем значение переменной error (0+1)
        }
      } else if (
        //проверка чекбокса
        input.getAttribute("type") === "checkbox" &&
        input.checked === false
      ) {
        formAddError(input);
        error++; //увеличиваем значение переменной error (0+1)
      } else {
        //проверка заполнено ли поле
        if (input.value === "") {
          formAddError(input);
          error++; //увеличиваем значение переменной error (0+1)
        }
      }
    }
    return error;
  }

  //---------------------------    вспомогательные функции  ------------------------------------
  // если какоето поле не прошло валидацию в общем (не заполнено)
  function formAddError(input) {
    input.parentElement.classList.add("_error");
    input.classList.add("_error");
  }
  // если поле заполнено, но неправильно
  function formAddTypeError(input) {
    input.parentElement.classList.add("_type-error");
    input.classList.add("_type-error");
  }

  function formRemoveError(input) {
    input.parentElement.classList.remove("_error");
    input.classList.remove("_error");
    input.parentElement.classList.remove("_type-error");
    input.classList.remove("_type-error");
  }
  //Функция теста E-mail (true если не пройден)
  function emailTestFail(input) {
    return !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,8})+$/.test(input.value);
  }
});
