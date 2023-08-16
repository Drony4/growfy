// Назначить .bg-i для родителю с изображением, которое используется как фон

function bgImage() {
  let bgParents = document.querySelectorAll(".bg-i");
  for (var i = 0; i < bgParents.length; i++) {
    if (bgParents[i].querySelector("img")) {
      bgParents[i].style.backgroundImage = "url(" + bgParents[i].querySelector("img").getAttribute("src") + ")";
    }
  }
}
bgImage();

//---------------------------------------------------------------------------------------------

//------------ Определение типа устройства для указания дальнейшего поведения страницы -------------------------
//+ добавление класса для <body>
let isMobile = {
  Android: function () {
    return navigator.userAgent.match(/Android/i);
  },
  BlackBerry: function () {
    return navigator.userAgent.match(/BlackBerry/i);
  },
  iOS: function () {
    return navigator.userAgent.match(/iPhone|iPad|iPod/i);
  },
  Opera: function () {
    return navigator.userAgent.match(/Opera Mini/i);
  },
  Windows: function () {
    return navigator.userAgent.match(/IEMobile/i);
  },
  any: function () {
    return isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows();
  },
};

if (isMobile.any()) {
  document.body.classList.add("_touchscreen");
} else {
  document.body.classList.add("_pc");
}
//--------------------------------------------------------------------------

// ---------------------------------------------------------------------------

//------------------ Убрать класс у элементов коллекции  ------------------------------
function removeClasses(object, remoovingClass) {
  for (let elem of object) {
    elem.classList.remove(remoovingClass);
  }
}
//------------------------------------------------------------------------------------
// ----------------  Перенос єлемента при адаптации
function useDynamicAdapt(type = "max") {
  const className = "_replaced";
  const attrName = "data-da";

  /** @type {dNode[]} */
  const dNodes = getDNodes();

  /** @type {dMediaQuery[]} */
  const dMediaQueries = getDMediaQueries(dNodes);

  dMediaQueries.forEach((dMediaQuery) => {
    const matchMedia = window.matchMedia(dMediaQuery.query);
    // массив объектов с подходящим брейкпоинтом
    const filteredDNodes = dNodes.filter(({ breakpoint }) => breakpoint === dMediaQuery.breakpoint);
    const mediaHandler = getMediaHandler(matchMedia, filteredDNodes);
    matchMedia.addEventListener("change", mediaHandler);

    mediaHandler();
  });

  function getDNodes() {
    const result = [];
    const elements = [...document.querySelectorAll(`[${attrName}]`)];

    elements.forEach((element) => {
      const attr = element.getAttribute(attrName);
      const [toSelector, breakpoint, order] = attr.split(",").map((val) => val.trim());

      const to = document.querySelector(toSelector);

      if (to) {
        result.push({
          parent: element.parentElement,
          element,
          to,
          breakpoint: breakpoint ?? "767",
          order: order !== undefined ? (isNumber(order) ? Number(order) : order) : "last",
          index: -1,
        });
      }
    });

    return sortDNodes(result);
  }

  /**
   * @param {dNode} items
   * @returns {dMediaQuery[]}
   */
  function getDMediaQueries(items) {
    const uniqItems = [...new Set(items.map(({ breakpoint }) => `(${type}-width: ${breakpoint}px),${breakpoint}`))];

    return uniqItems.map((item) => {
      const [query, breakpoint] = item.split(",");

      return { query, breakpoint };
    });
  }

  /**
   * @param {MediaQueryList} matchMedia
   * @param {dNodes} items
   */
  function getMediaHandler(matchMedia, items) {
    return function mediaHandler() {
      if (matchMedia.matches) {
        items.forEach((item) => {
          moveTo(item);
        });

        items.reverse();
      } else {
        items.forEach((item) => {
          if (item.element.classList.contains(className)) {
            moveBack(item);
          }
        });

        items.reverse();
      }
    };
  }

  /**
   * @param {dNode} dNode
   */
  function moveTo(dNode) {
    const { to, element, order } = dNode;
    dNode.index = getIndexInParent(dNode.element, dNode.element.parentElement);
    element.classList.add(className);

    if (order === "last" || order >= to.children.length) {
      to.append(element);

      return;
    }

    if (order === "first") {
      to.prepend(element);

      return;
    }

    to.children[order].before(element);
  }

  /**
   * @param {dNode} dNode
   */
  function moveBack(dNode) {
    const { parent, element, index } = dNode;
    element.classList.remove(className);

    if (index >= 0 && parent.children[index]) {
      parent.children[index].before(element);
    } else {
      parent.append(element);
    }
  }

  /**
   * @param {HTMLElement} element
   * @param {HTMLElement} parent
   */
  function getIndexInParent(element, parent) {
    return [...parent.children].indexOf(element);
  }

  /**
   * Функция сортировки массива по breakpoint и order
   * по возрастанию для type = min
   * по убыванию для type = max
   *
   * @param {dNode[]} items
   */
  function sortDNodes(items) {
    const isMin = type === "min" ? 1 : 0;

    return [...items].sort((a, b) => {
      if (a.breakpoint === b.breakpoint) {
        if (a.order === b.order) {
          return 0;
        }

        if (a.order === "first" || b.order === "last") {
          return -1 * isMin;
        }

        if (a.order === "last" || b.order === "first") {
          return 1 * isMin;
        }

        return 0;
      }

      return (a.breakpoint - b.breakpoint) * isMin;
    });
  }

  function isNumber(value) {
    return !isNaN(value);
  }
}

//#######################################################################################################
/*  Параллакс по горизонтальной оси при наведении мышью (показывается скрытый за областью просмотра контент)
 Скользящий блок должен быть обвернут в оболочку, на которую ставится прослушка.
 Для направляющего блока (с прослушкой) - data-mouseslide со значением времени выполнения. Если значение не указано - по умолчанию - 2с.
 Для движения и влево и вправо используется значение скорости без знаков "+" или "-". Со знаками - определяется направление движения.
 В случае, если контент ориентирован относительно правой части блока и нужно движение влево, тогда контенту применяются св-ва: display: flex; justify-content: flex-end; direction: rtl; flex-direction: row-reverse;  из-за особенностей flex-box.
 Движение происходит в зависимости от положения курсора относительно центра экрана. initRatio определяет область по горизонтальной оси, где движение контента не включается (например 0,25 - четверть половины экрана)
  !!!  дополнительно должна біть подключена функция определения типа устройства !isMobile.any() */

function mouseslide() {
  const blockCollection = document.querySelectorAll("[data-mouseslide]");
  const initRatio = 0.25; //включение паралакса при значении ratio
  if (blockCollection.length > 0 && !isMobile.any()) {
    blockCollection.forEach((block) => {
      const slider = block.firstElementChild;
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      const speed = Math.abs(block.dataset.mouseslide) || 2;
      let parallax = 0;
      let ratio = 0;

      // Ф-ция передающая стили для трансформации
      function setStylesMouseParallax() {
        slider.style.cssText = `transform:translateX(${-parallax}px);transition:transform ${speed}s ease-out;`;
      }
      block.addEventListener("mousemove", function (event) {
        ratio = (event.pageX - scrollBarWidth) / (block.offsetWidth / 2) - 1;
        ratio > 1 ? (ratio = 1) : null;
        ratio < -1 ? (ratio = -1) : null;
        if (Math.abs(ratio) > initRatio) {
          parallax = (slider.scrollWidth - slider.offsetWidth) * ratio * ((Math.abs(ratio) - initRatio) / (1 - initRatio));
        }
        // Настройка направления движения слайдера
        if (block.dataset.mouseslide.includes("+") && parallax < 0) {
          parallax = 0;
        } else if (block.dataset.mouseslide.includes("-") && parallax > 0) {
          parallax = 0;
        }
        requestAnimationFrame(setStylesMouseParallax);
      });
    });
  }
}

//##########################################################################################################
function animateBlockSimple() {
  if (Array.prototype.forEach && "IntersectionObserver" in window) {
    animateBlockObserverSimple();
  } else {
    animateBlockScrollSimple();
  }
  //------------------------   IntersectionObserver  -----------------------
  function animateBlockObserverSimple() {
    const animClass = "animated"; //элемент анимирован
    const animAttr = "[data-animate]";
    const thrshholdDefault = 0; //[0..1]
    const onloadAnimDelay = 50; //ms
    const techClass = "_animation";
    const animBlocks = document.querySelectorAll(animAttr);
    const headerElement = document.querySelector("header");

    if (animBlocks.length > 0) {
      animBlocks.forEach((animBlock) => {
        animBlock.classList.add(techClass); //тех-класс для нерабочего JS
      });
      setTimeout(() => {
        animBlocks.forEach((animBlock) => {
          const onload = animBlock.dataset.animate.split(",")[1];
          let threshold = thresholdCalc(animBlock);
          if (onload) {
            animBlock.classList.add(animClass);
          } else {
            observering(animBlock, threshold);
          }
        });
      }, onloadAnimDelay);

      function observering(animBlock, threshold) {
        // слежка за объектами для их анимации
        let observer = new IntersectionObserver(
          (entries, observer) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                animBlock.classList.add(animClass);
                observer.unobserve(animBlock);
              }
            });
          },
          { threshold: threshold }
        );
        observer.observe(animBlock);
      }
    }
    function thresholdCalc(animBlock) {
      // коррекция порога появления объекта, если высота объекта больше высоты экрана
      let animBlockHeight = animBlock.offsetHeight;
      let screenHeight = window.innerHeight;
      let headerHeight = headerElement ? headerElement.offsetHeight : 20;
      let threshold = +animBlock.dataset.animate.split(",")[0] || thrshholdDefault;
      if (animBlockHeight > screenHeight - headerHeight) {
        threshold = Math.floor(threshold * ((screenHeight - headerHeight) / animBlockHeight) * 100) / 100;
      }
      return threshold;
    }
  }
  // ------------------------  Scroll  -----------------------------
  function animateBlockScrollSimple() {
    const animClass = "animated";
    const animAttr = "[data-animate]";
    const thresholdDefault = 0; //[0..1]
    const onloadAnimDelay = 50; //ms
    const techClass = "_animation";
    const animBlocks = document.querySelectorAll(animAttr);
    const headerElement = document.querySelector("header");

    if (animBlocks.length > 0) {
      let activeElems = animBlocks.length; // если = 0 выключается наблюдатель
      for (let index = 0; index < animBlocks.length; index++) {
        const animBlock = animBlocks[index];
        animBlock.classList.add(techClass);
      }

      function animate() {
        let headerHeight = headerElement ? headerElement.offsetHeight : 20;
        const screenHeight = window.innerHeight;
        for (let index = 0; index < animBlocks.length; index++) {
          const animBlock = animBlocks[index];
          if (!animBlock.classList.contains(animClass)) {
            const animBlockHeight = animBlock.offsetHeight;
            const [threshold = thresholdDefault, onload] = animBlock.dataset.animate.split(",");
            let visible = visibility(animBlock, threshold, screenHeight, animBlockHeight, headerHeight);

            if (onload) {
              animBlock.classList.add(animClass);
              activeElems--;
            }

            if (visible) {
              animBlock.classList.add(animClass);
              activeElems--;
            }
          }
        }
        if (activeElems === 0) {
          window.removeEventListener("scroll", animate);
        }
      }
      setTimeout(() => {
        animate();
        window.addEventListener("scroll", animate);
      }, onloadAnimDelay);
    }

    function visibility(animBlock, threshold, screenHeight, animBlockHeight, headerHeight) {
      let elemPosition = animBlock.getBoundingClientRect().top;
      if (animBlockHeight > screenHeight - headerHeight) {
        threshold = Math.floor(threshold * ((screenHeight - headerHeight) / animBlockHeight) * 100) / 100;
      }
      return elemPosition + animBlockHeight * threshold < screenHeight && elemPosition + animBlockHeight > animBlockHeight * threshold;
    }
  }
}

function typeWriter() {
  let blocks = document.querySelectorAll("[data-typewriter]");
  if (blocks.length > 0) {
    blocks.forEach((block) => {
      let oneSimbolPrintTime = block.dataset.typewriter || 0.1;
      let characters = block.textContent.split("");
      let charactersLength = characters.length;
      let wrapedCharacters = characters
        .map((char, index) => {
          return `<span style='--delay: ${index * oneSimbolPrintTime}s;'>${char}</span>`;
        })
        .join("");
      block.innerHTML = wrapedCharacters;
      block.style.setProperty("--cursorDelay", charactersLength * oneSimbolPrintTime + "s");
    });
  }
}

//################################################################################################
//-----------------Пузырьки
function randomBubbles() {
  const bubblesBoxes = document.querySelectorAll("[data-bubbles]");
  const bubbleClass = "bubble";
  const bubbleAnimClass = "animate";

  if (bubblesBoxes.length > 0) {
    bubblesBoxes.forEach((bubbleBox) => {
      const bubblesQuantity = bubbleBox.dataset.bubbles.split(",")[0] || 3; // количество пузырьков
      const maxStartDelay = bubbleBox.dataset.bubbles.split(",")[1] || 5000; //s - ожидаемая задержка анимации
      const repeatQuantity = bubbleBox.dataset.bubbles.split(",")[2] || false; // количество повторений
      bubbleBox.style.cssText = `position: absolute;width: 100%;height: 100%;left: 0;top: 0;z-index:1;overflow: hidden;`;
      const bubbleBoxWidth = bubbleBox.offsetWidth;
      const bubbleBoxHeight = bubbleBox.offsetHeight;
      const animTime = propertyHunter(bubbleBox);

      for (let i = 0; i < bubblesQuantity; i++) {
        const bubble = document.createElement("div");
        bubble.classList.add(bubbleClass);
        bubbleBox.append(bubble);

        let counter = repeatQuantity;

        function bubbling() {
          let cicleTime;

          function startBubbling() {
            let startDelay = Math.round(maxStartDelay * Math.random());
            let bubbleLeft = Math.round(Math.random() * bubbleBoxWidth);
            let bubbleTop = Math.round(Math.random() * bubbleBoxHeight);
            cicleTime = startDelay + animTime;
            bubble.style.cssText = `position: absolute;left: ${bubbleLeft}px;top: ${bubbleTop}px;`;
            setTimeout(() => {
              bubble.classList.add(bubbleAnimClass);
              setTimeout(() => {
                bubble.classList.remove(bubbleAnimClass);
                if (counter > 0) {
                  counter--;
                  if (counter === 0) {
                    bubble.remove();
                  } else {
                    startBubbling();
                  }
                } else {
                  startBubbling();
                }
              }, animTime);
            }, startDelay);
          }

          startBubbling();
        }

        bubbling();
      }
    });

    function propertyHunter(bubbleBox) {
      const bubble = document.createElement("div");
      bubble.classList.add(bubbleClass);
      bubbleBox.append(bubble);
      let animTimePasive = getComputedStyle(bubble);
      animTimePasive = parseFloat(animTimePasive.transition.split(" ")[1]) * 1000;
      bubble.classList.add(bubbleAnimClass);
      let animTimeActive = getComputedStyle(bubble);
      animTimeActive = parseFloat(animTimeActive.transition.split(" ")[1]) * 1000;
      bubble.remove();
      animTime = Math.max(animTimePasive, animTimeActive);
      return animTime;
    }
  }
}

//##############################################################################################
//----------------- Переводчик
function translator() {
  const translatorButtons = document.querySelectorAll("[data-page-translator]");
  if (translatorButtons.length > 0) {
    const langClass = "lang_"; // начало рабочего класса
    let languages = ["eng", "ukr", "ru"]; //список продолжений классов
    const innerFromArray = true; // Содержимое кнопки берется из массива
    const allSite = true; //Переводчик работает на весь проект и запоминается браузером
    setLanguage();
    window.addEventListener("click", changeLanguage);
    function changeLanguage(e) {
      const targetElement = e.target;
      translatorButtons.forEach((button) => {
        if (targetElement == button) {
          //прокрутка массива языков
          let firstElement = languages.shift();
          languages.push(firstElement);
          // запись массива языков для всех страниц
          if (allSite) {
            localStorage.setItem("languages", JSON.stringify(languages));
          }
          setLanguage();
        }
      });
    }
    function setLanguage() {
      // читаем массив языков для всех страниц
      if (allSite) {
        const savedLanguages = JSON.parse(localStorage.getItem("languages"));
        if (savedLanguages) {
          languages = savedLanguages;
        }
      }

      translatorButtons.forEach((button) => {
        // назначение содержимого кнопкам
        if (innerFromArray) {
          button.innerHTML = languages[1];
        }
        // переназначение рабочего класса
        for (i = 0; i < languages.length; i++) {
          document.body.classList.remove(`${langClass + languages[i]}`);
        }
        document.body.classList.add(`${langClass + languages[0]}`);
      });
    }
  }
}
