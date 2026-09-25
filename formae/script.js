/* ========================================
   MORPHYFOUNDRY TYPE TESTERS
======================================== */


const testerUnits =
  document.querySelectorAll(".tester-unit");

const mobileTesterQuery =
  window.matchMedia("(max-width: 650px)");

const compactTesterQuery =
  window.matchMedia("(max-width: 900px)");


document.querySelectorAll("[data-fill-repeats]").forEach(
  function (tester) {
    const originalText = tester.textContent.trim();
    const repeatCount = Number(tester.dataset.fillRepeats);
    const targetLength = Math.round(
      originalText.length * repeatCount
    );

    tester.textContent =
      (originalText + " ")
        .repeat(Math.ceil(repeatCount))
        .slice(0, targetLength);
  }
);


document.querySelectorAll(".tester").forEach(
  function (tester) {
    const desktopText = tester.textContent;

    // Type Tester 01 (tester-medium) always fills its box wall to
    // wall via live text-width measurement, at any viewport width --
    // truncating its text at the mobile breakpoint broke that
    // continuity (it would suddenly show a different, shorter string
    // instead of the same headline scaling down further), so it's the
    // one tester that keeps its full text at every size.
    if (tester.classList.contains("tester-medium")) {
      return;
    }

    // Type Tester 02/03 (tester-small) scale as one piece with their
    // box -- applyTesterSize below sizes the text off the box's own
    // width, so the full text wraps at the same places at every tablet
    // and laptop width. On a phone (one column) 14-15 lines of text was
    // simply too long, so there they show only the opening sentences --
    // cut at a full stop, never mid-sentence.
    const isSmallTester = tester.classList.contains("tester-small");

    function shortenToSentences(text, ratio) {
      const limit = text.length * ratio;
      const sentences = text.match(/[^.!?]+[.!?]+\s*/g) || [text];
      let shortened = "";

      for (const sentence of sentences) {
        if (shortened && (shortened + sentence).length > limit) break;
        shortened += sentence;
      }

      return shortened.trim();
    }

    function applyResponsiveTesterContent() {
      if (mobileTesterQuery.matches) {
        if (tester.dataset.mobileText) {
          tester.textContent = tester.dataset.mobileText;
          return;
        }

        if (isSmallTester) {
          tester.textContent = shortenToSentences(desktopText, 0.5);
          return;
        }

        const mobileContentRatio =
          tester.closest(".tester-unit").matches(":nth-child(6)")
            ? 0.2
            : 0.5;

        tester.textContent = desktopText.slice(
          0,
          Math.ceil(desktopText.length * mobileContentRatio)
        );
      } else {
        tester.textContent = desktopText;
      }
    }

    applyResponsiveTesterContent();
    mobileTesterQuery.addEventListener(
      "change",
      applyResponsiveTesterContent
    );
  }
);


// How far the window is above the 1920px design width (1 up to it): the
// type testers' own px sizes grow in step with the page above that.
function wideScale() {
  return Math.max(1, window.innerWidth / 1920);
}


testerUnits.forEach(
  function (unit) {

    const tester =
      unit.querySelector(".tester");

    const sizeSlider =
      unit.querySelector('[data-control="size"]');

    const weightSlider =
      unit.querySelector('[data-control="weight"]');

    const trackingSlider =
      unit.querySelector('[data-control="tracking"]');

    const sizeValue =
      unit.querySelector('[data-value="size"]');

    const weightValue =
      unit.querySelector('[data-value="weight"]');

    const trackingValue =
      unit.querySelector('[data-value="tracking"]');


    // Type Tester 01 starts wall-to-wall by default, but the moment you
    // drag its Size slider yourself, your value takes over -- it's a
    // type TESTER, you have to be able to set your own size in it.
    let sizeManuallySet = false;

    function applyTesterSize(requestedSize) {
      const wide = wideScale();
      let renderedSize = Number(requestedSize) * wide;

      tester.style.letterSpacing = Number(trackingSlider.value) * wide + "px";

      const testerStyle = window.getComputedStyle(tester);
      const horizontalPadding =
        parseFloat(testerStyle.paddingLeft) +
        parseFloat(testerStyle.paddingRight);
      const availableWidth = Math.max(
        1,
        unit.clientWidth - horizontalPadding
      );
      const isFillWidth =
        tester.classList.contains("tester-medium") && !sizeManuallySet;
      const scale = Math.min(1, availableWidth / (1500 * wide));
      let minimumSize = 24;

      if (tester.classList.contains("tester-small")) {
        // No px floor: the size below is requestedSize * scale, i.e.
        // proportional to the box's own width, so the text wraps at the
        // same words at every width. The old 28px floor stopped the text
        // shrinking while the box kept narrowing -- more lines, a taller
        // and taller box (20-24 lines and 700-830px at 900-1100px wide).
        minimumSize = 1;
      }

      if (tester.classList.contains("tester-micro")) {
        minimumSize = 14;
      }

      if (isFillWidth) {
        // Type Tester 01's headline always spans the full width of its
        // box ("wall to wall") at every viewport, including when the
        // mobile breakpoint swaps in shorter text -- so instead of the
        // shrink-only scale above, measure the current text's actual
        // rendered width and solve for the font-size that fills
        // availableWidth exactly. Two passes because letter-spacing is
        // an additive px amount, not proportional to font-size, so one
        // measurement alone slightly undershoots/overshoots when
        // tracking isn't 0.
        const range = document.createRange();
        range.selectNodeContents(tester);

        // Wrapping would make the measured width reflect the widest
        // wrapped line instead of the whole string, throwing off the
        // scale-to-fit math below -- this tester is always sized to
        // exactly fill availableWidth, so it never needs to wrap.
        tester.style.whiteSpace = "nowrap";

        let probeSize = Math.max(minimumSize, renderedSize);
        tester.style.fontSize = probeSize + "px";
        let textWidth = range.getBoundingClientRect().width;
        if (textWidth > 0) {
          probeSize = Math.max(
            minimumSize,
            probeSize * (availableWidth / textWidth)
          );
        }

        tester.style.fontSize = probeSize + "px";
        textWidth = range.getBoundingClientRect().width;
        renderedSize =
          textWidth > 0
            ? Math.max(
                minimumSize,
                probeSize * (availableWidth / textWidth)
              )
            : probeSize;
      } else {
        // Restore normal wrapping once fill-width mode is off (manual
        // size, or the user typed their own text) -- otherwise a
        // leftover "nowrap" from an earlier fill-width pass would run
        // any longer custom text off the edge instead of wrapping it.
        tester.style.whiteSpace = "";

        renderedSize = Math.min(
          Number(requestedSize) * wide,
          Math.max(minimumSize, renderedSize * scale)
        );
      }

      if (
        tester.classList.contains("tester-large") ||
        tester.classList.contains("tester-medium")
      ) {
        const verticalPadding =
          parseFloat(testerStyle.paddingTop) +
          parseFloat(testerStyle.paddingBottom);
        const availableHeight = Math.max(
          1,
          window.innerHeight - verticalPadding
        );
        const lineHeight = 1.2;

        renderedSize = Math.min(
          renderedSize,
          availableHeight / lineHeight
        );
      }

      renderedSize = Math.round(renderedSize * 10) / 10;
      tester.style.fontSize = renderedSize + "px";
      sizeValue.textContent = renderedSize + " px";
    }


    applyTesterSize(sizeSlider.value);

    // The very first call above can run before the Formae webfont has
    // actually finished loading, measuring the fallback font's (wider
    // or narrower) glyph widths instead -- once the real font swaps
    // in via font-display:swap, the text reflows to a different width
    // with nothing to re-trigger the fit-to-width math. Recomputing
    // once fonts.ready resolves catches that reflow.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        applyTesterSize(sizeSlider.value);
      });
    }

    if (weightSlider) {
      tester.style.fontWeight =
        weightSlider.value;

      tester.style.fontVariationSettings =
        `"wght" ${weightSlider.value}`;
    }

    tester.style.letterSpacing =
      Number(trackingSlider.value) * wideScale() + "px";


    sizeSlider.addEventListener(
      "input",
      function () {
        sizeManuallySet = true;
        applyTesterSize(this.value);

      }
    );

    // Typing custom text into a contenteditable tester recalculates
    // its size too -- for Type Tester 01 this keeps the (possibly
    // now-different) text filling the box wall to wall.
    tester.addEventListener("input", function () {
      applyTesterSize(sizeSlider.value);
    });


    compactTesterQuery.addEventListener(
      "change",
      function () {
        applyTesterSize(sizeSlider.value);
      }
    );


    window.addEventListener(
      "resize",
      function () {
        applyTesterSize(sizeSlider.value);
      }
    );

    // window's "resize" event doesn't reliably fire for viewport-size
    // emulation (devtools/CDP-driven), only for real window drags --
    // ResizeObserver reacts to the unit's actual box size changing
    // either way, so Tester 01's wall-to-wall fit keeps up regardless
    // of how the viewport changed. Only react to WIDTH changes: setting
    // the fill-width font-size also changes the unit's height, which
    // would otherwise re-trigger this same observer on its own output
    // and, under a continuous drag, stall mid-calculation once the
    // browser's ResizeObserver loop-limit kicks in.
    if (typeof ResizeObserver !== "undefined") {
      let lastObservedWidth = unit.clientWidth;

      new ResizeObserver(function () {
        if (unit.clientWidth === lastObservedWidth) {
          return;
        }

        lastObservedWidth = unit.clientWidth;
        applyTesterSize(sizeSlider.value);
      }).observe(unit);
    }


    if (weightSlider) {
      weightSlider.addEventListener(
        "input",
        function () {

          tester.style.fontWeight =
            this.value;

          tester.style.fontVariationSettings =
            `"wght" ${this.value}`;

          weightValue.textContent =
            this.value;

        }
      );
    }


    trackingSlider.addEventListener(
      "input",
      function () {

        tester.style.letterSpacing =
          Number(this.value) * wideScale() + "px";

        trackingValue.textContent =
          this.value;

      }
    );

  }
);


/* ========================================
   TYPE TESTER 03 -- MATCH TYPE TESTER 02's HEIGHT
   Tester 03's own content is shorter than Tester 02's, so left alone it
   renders shorter too. Clip it to whatever height Tester 02 actually
   renders at instead, so the two line up -- re-measured on resize since
   Tester 02's height itself is responsive (viewport-scaled font size,
   variable line-wrapping).
======================================== */

(function () {
  const tester2 = testerUnits[1] && testerUnits[1].querySelector(".tester");
  const tester3 = testerUnits[2] && testerUnits[2].querySelector(".tester");
  if (!tester2 || !tester3) return;

  tester3.style.overflow = "hidden";

  function matchTester3Height() {
    // One column on a phone: nothing sits beside Tester 02 there, so
    // Tester 03 just takes the height of its own (shorter) text -- no
    // clip, no fade.
    if (mobileTesterQuery.matches) {
      tester3.style.height = "";
      tester3.style.webkitMaskImage = "";
      tester3.style.maskImage = "";
      return;
    }

    const targetHeight = tester2.getBoundingClientRect().height;
    tester3.style.height = targetHeight + "px";

    /* The target height rarely lands on a whole number of Tester 03's
       own lines, so the clip usually lands mid-line -- fade the last
       partial line out instead of hard-cropping it, over roughly one
       line-height so it reads as an intentional fade, not a glitch. */
    const lineHeight =
      parseFloat(getComputedStyle(tester3).lineHeight) || 0;
    const fade = Math.min(lineHeight, targetHeight);
    const maskImage =
      "linear-gradient(to bottom, #000 0, #000 calc(100% - " +
      fade +
      "px), transparent 100%)";
    tester3.style.webkitMaskImage = maskImage;
    tester3.style.maskImage = maskImage;
  }

  matchTester3Height();
  window.addEventListener("resize", matchTester3Height);
  mobileTesterQuery.addEventListener("change", matchTester3Height);
  // Re-measure once the real webfont is in (this runs before it's
  // necessarily loaded), since Tester 02's wrapped line count -- and so
  // its height -- can shift once the fallback font is swapped out.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(matchTester3Height);
  }
})();


/* ========================================
   CHARACTER SET PREVIEW
======================================== */

const characterPreview =
  document.getElementById("character-preview-value");

const characterCells =
  document.querySelectorAll(".character-grid span");

const characterCanvas =
  document.getElementById("character-preview-canvas");


function drawCharacterPreview(character) {
  const previewBox =
    characterCanvas.getBoundingClientRect();

  const capLine =
    document.querySelector(".metric-cap i").getBoundingClientRect();

  const baseline =
    document.querySelector(".metric-baseline i").getBoundingClientRect();

  const pixelRatio = window.devicePixelRatio || 1;
  const context = characterCanvas.getContext("2d");

  characterCanvas.width =
    Math.round(previewBox.width * pixelRatio);

  characterCanvas.height =
    Math.round(previewBox.height * pixelRatio);

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, previewBox.width, previewBox.height);

  const fontFamily =
    getComputedStyle(document.body).fontFamily;

  context.font =
    `400 1000px ${fontFamily}`;

  const referenceA = context.measureText("A");
  const capToBaseline = baseline.top - capLine.top;
  const fontSize =
    1000 * capToBaseline / referenceA.actualBoundingBoxAscent;

  context.font =
    `400 ${fontSize}px ${fontFamily}`;

  const xMeasurement = context.measureText("x");
  const xLine = document.querySelector(".metric-x");
  const xLineRule = xLine.querySelector("i").getBoundingClientRect();
  const xLineBox = xLine.getBoundingClientRect();
  const ruleOffset = xLineRule.top - xLineBox.top;
  const xTop =
    baseline.top - previewBox.top -
    xMeasurement.actualBoundingBoxAscent;

  xLine.style.top =
    (xTop - ruleOffset) + "px";

  context.fillStyle =
    getComputedStyle(document.body).color;

  context.textAlign = "center";
  context.textBaseline = "alphabetic";

  context.fillText(
    character,
    previewBox.width / 2,
    baseline.top - previewBox.top
  );
}


function selectCharacter(cell) {
  characterCells.forEach(function (item) {
    item.classList.remove("is-selected");
  });

  cell.classList.add("is-selected");
  characterPreview.textContent = cell.textContent;
  drawCharacterPreview(cell.textContent);

  const codePoint = cell.textContent.codePointAt(0);
  const unicodeValue =
    "U+" + codePoint.toString(16).toUpperCase().padStart(4, "0");

  document.getElementById("character-unicode").textContent =
    unicodeValue;

  document.getElementById("character-code-value").textContent =
    cell.textContent;
}


characterCells.forEach(function (cell) {
  cell.tabIndex = 0;

  cell.addEventListener("mouseenter", function () {
    selectCharacter(cell);
  });

  cell.addEventListener("focus", function () {
    selectCharacter(cell);
  });

  cell.addEventListener("click", function () {
    selectCharacter(cell);
  });
});


if (characterCells.length) {
  selectCharacter(characterCells[0]);

  document.fonts.ready.then(function () {
    drawCharacterPreview(characterPreview.textContent);
  });

  // The preview canvas is drawn at the panel's size at that moment, and
  // the panel's height now follows the viewport -- redraw when it changes
  // so the glyph never sits stretched in a resized panel.
  let previewResizeFrame = null;

  window.addEventListener("resize", function () {
    if (previewResizeFrame !== null) return;

    previewResizeFrame = requestAnimationFrame(function () {
      previewResizeFrame = null;
      drawCharacterPreview(characterPreview.textContent);
    });
  });
}


window.addEventListener("resize", function () {
  drawCharacterPreview(characterPreview.textContent);
});


/* ========================================
   KERNING LAB
======================================== */

const kerningLab =
  document.querySelector(".kerning-lab");


if (kerningLab) {
  const kerningSource =
    document.getElementById("kerning-source");

  const kerningGlyphs =
    document.getElementById("kerning-glyphs");

  const kerningTracking =
    document.getElementById("kerning-tracking");

  const kerningCanvas =
    document.createElement("canvas");

  const kerningContext =
    kerningCanvas.getContext("2d");


  function renderKerningLab() {
    const weight = 400;
    const tracking = Number(kerningTracking.value);
    const fontFamily = getComputedStyle(document.body).fontFamily;
    const mobileKerning = window.innerWidth <= 650;
    const kerningFontSize = (mobileKerning
      ? Math.max(64, Math.min(96, window.innerWidth * 0.22))
      : Math.max(110, Math.min(270, window.innerWidth * 0.15)) *
        Math.max(1, window.innerWidth / 1920)) * 0.7197;

    kerningLab.style.setProperty("--kerning-weight", weight);
    kerningLab.style.setProperty("--kerning-tracking", tracking);
    kerningLab.style.setProperty(
      "--kerning-font-size",
      Math.round(kerningFontSize * 10) / 10
    );

    document.getElementById("kerning-tracking-value").textContent =
      tracking;

    kerningContext.font =
      `${weight} 1000px ${fontFamily}`;
    kerningContext.fontKerning = "normal";

    kerningGlyphs.replaceChildren();

    Array.from(kerningSource.value).forEach(function (character) {
      const measuredWidth = Math.max(
        120,
        Math.round(kerningContext.measureText(character).width + tracking)
      );
      const cellWidth = Math.max(
        mobileKerning ? 42 : 64,
        measuredWidth / 1000 * kerningFontSize
      );

      const cell = document.createElement("div");
      const value = document.createElement("span");
      const glyph = document.createElement("strong");

      cell.className = "kerning-glyph";
      value.className = "kerning-glyph-value";
      glyph.className = "kerning-glyph-character";

      cell.style.setProperty(
        "--kerning-cell-width",
        Math.round(cellWidth * 10) / 10
      );
      value.textContent = measuredWidth;
      glyph.textContent = character === " " ? "·" : character;

      cell.append(value, glyph);
      kerningGlyphs.append(cell);
    });
  }


  kerningSource.addEventListener("input", renderKerningLab);
  kerningTracking.addEventListener("input", renderKerningLab);
  window.addEventListener("resize", renderKerningLab);

  document.fonts.ready.then(renderKerningLab);
}




document.querySelectorAll(".type-scale-text").forEach(function (block) {
  block.addEventListener("paste", function (event) {
    event.preventDefault();
    const text = (event.clipboardData || window.clipboardData).getData("text/plain");
    document.execCommand("insertText", false, text);
  });
});


/* ========================================
   TYPE SPECIMEN SLIDER
   Edit this array to change the slider's words -- each entry's "layout"
   picks one of the hand-designed compositions in style.css (.slide-*).
======================================== */

const TYPE_SLIDER_SLIDES = [
  { layout: "bleed", text: "Vintage£24?" },
];

const typeSliderSection = document.querySelector("#type-slider");
const typeSliderTrack = document.querySelector("#type-slider-track");

if (typeSliderSection && typeSliderTrack) {

  function makeSlideParagraph(text, className) {
    const p = document.createElement("p");
    if (className) {
      p.className = className;
    }
    p.textContent = text;
    return p;
  }

  function buildSlide(slide) {
    const article = document.createElement("article");
    article.className = "type-slider-slide slide-" + slide.layout;
    article.setAttribute("aria-roledescription", "slide");

    if (slide.inverse) {
      article.classList.add("type-slider-slide-inverse");
    }

    if (slide.layout === "stack") {
      article.append(
        makeSlideParagraph(slide.kicker, "slide-stack-kicker"),
        makeSlideParagraph(slide.hero, "slide-stack-hero"),
        makeSlideParagraph(slide.meta, "slide-stack-meta")
      );
    } else if (slide.layout === "repeat") {
      const count = slide.count || 3;
      for (let i = 0; i < count; i++) {
        article.append(makeSlideParagraph(slide.text));
      }
    } else if (slide.layout === "contrast") {
      article.append(
        makeSlideParagraph(slide.text, "slide-contrast-small"),
        makeSlideParagraph(slide.text, "slide-contrast-large")
      );
    } else {
      article.append(makeSlideParagraph(slide.text));
    }

    return article;
  }

  TYPE_SLIDER_SLIDES.forEach(function (slide) {
    typeSliderTrack.append(buildSlide(slide));
  });
}




/* ========================================
   SECTION REORDER PANEL
   Lets you drag-and-drop the page's main sections into a new order.
   The order is saved to localStorage so it survives a reload.
======================================== */

(function () {
  const main = document.querySelector("main");
  if (!main) return;

  const ORDER_STORAGE_KEY = "formae-section-order";
  const VISIBILITY_STORAGE_KEY = "formae-section-hidden";

  const sections = Array.from(main.querySelectorAll(":scope > section"));
  const originalOrder = [];

  /* Captured before anything below touches .hidden, so this is the
     static markup's own baked-in visibility -- what "Reset" should
     restore, independent of whatever stale localStorage says. */
  const originalHiddenKeys = [];

  /* A section can carry its own fixed `data-section-key` in the markup
     (e.g. a duplicate dropped in next to its original). Those are left
     out of the positional numbering, so adding one mid-page doesn't
     shift every later section's "sec-N" key and scramble the saved
     order/hidden lists stored under them. */
  let positionalIndex = 0;
  sections.forEach(function (section) {
    let key = section.dataset.sectionKey;
    if (!key) {
      key = "sec-" + positionalIndex;
      positionalIndex += 1;
      section.dataset.sectionKey = key;
    }
    originalOrder.push(key);
    if (section.hidden) {
      originalHiddenKeys.push(key);
    }
  });

  function deriveSectionLabel(section) {
    const titleEl = section.querySelector(".section-title, h1, h2, h3");
    if (titleEl && titleEl.textContent.trim()) {
      return titleEl.textContent.trim();
    }

    if (section.getAttribute("aria-label")) {
      return section.getAttribute("aria-label");
    }

    const labelledBy = section.getAttribute("aria-labelledby");
    if (labelledBy) {
      const ref = document.getElementById(labelledBy);
      if (ref && ref.textContent.trim()) {
        return ref.textContent.trim();
      }
    }

    const kicker = section.querySelector(
      "[class*='kicker'], .specimen-text, .tester-title"
    );
    if (kicker && kicker.textContent.trim()) {
      return kicker.textContent.trim();
    }

    const firstClass = (section.className || "").split(" ")[0] || "Section";
    return firstClass
      .replace(/-/g, " ")
      .replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  const sectionLabels = {};
  sections.forEach(function (section) {
    sectionLabels[section.dataset.sectionKey] = deriveSectionLabel(section);
  });

  function applyOrder(order) {
    order.forEach(function (key) {
      const section = main.querySelector(
        ':scope > section[data-section-key="' + key + '"]'
      );
      if (section) {
        main.appendChild(section);
      }
    });
  }

  function currentOrder() {
    return Array.from(
      main.querySelectorAll(":scope > section")
    ).map(function (section) {
      return section.dataset.sectionKey;
    });
  }

  function loadSavedOrder() {
    try {
      const raw = window.localStorage.getItem(ORDER_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return null;

      const validSaved = parsed.filter(function (key) {
        return originalOrder.includes(key);
      });
      if (!validSaved.length) return null;

      /* A section added to the page after this order was saved (e.g. a
         newly inserted hero image section) won't be in `validSaved` yet.
         Rather than treat that as a corrupt/stale save and discard the
         user's whole custom arrangement, insert each such section at the
         position it naturally occupies in the static markup, relative to
         whichever already-ordered sections come after it there. */
      const missing = originalOrder.filter(function (key) {
        return validSaved.indexOf(key) === -1;
      });
      if (!missing.length) return validSaved;

      const result = validSaved.slice();
      missing.forEach(function (key) {
        /* A duplicate can name the section it was copied from
           (`data-insert-after`) -- land directly below that one, wherever
           the user has dragged it, instead of the natural-position rule
           below (which would key off the static markup's neighbours). */
        const missingSection = main.querySelector(
          ':scope > section[data-section-key="' + key + '"]'
        );
        const anchorKey = missingSection && missingSection.dataset.insertAfter;
        const anchorAt = anchorKey ? result.indexOf(anchorKey) : -1;
        if (anchorAt !== -1) {
          result.splice(anchorAt + 1, 0, key);
          return;
        }

        const naturalIndex = originalOrder.indexOf(key);
        let insertAt = result.length;
        for (let i = 0; i < result.length; i++) {
          if (originalOrder.indexOf(result[i]) > naturalIndex) {
            insertAt = i;
            break;
          }
        }
        result.splice(insertAt, 0, key);
      });
      return result;
    } catch (error) {
      /* ignore malformed storage */
    }
    return null;
  }

  const savedOrder = loadSavedOrder();
  if (savedOrder) {
    applyOrder(savedOrder);
  }

  /* ---- Visibility (Photoshop-style eye toggle) ---- */

  function loadHiddenKeys() {
    try {
      const raw = window.localStorage.getItem(VISIBILITY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter(function (key) {
            return originalOrder.includes(key);
          });
        }
      }
    } catch (error) {
      /* ignore malformed storage */
    }

    // No saved preference yet (e.g. a fresh export/artifact with its own
    // empty localStorage) -- seed from whatever sections already carry a
    // `hidden` attribute in the markup itself, so a baked-in hidden state
    // isn't silently reset to "all visible" on first load.
    return sections
      .filter(function (section) {
        return section.hidden;
      })
      .map(function (section) {
        return section.dataset.sectionKey;
      });
  }

  const hiddenKeys = new Set(loadHiddenKeys());

  function applyVisibility() {
    sections.forEach(function (section) {
      section.hidden = hiddenKeys.has(section.dataset.sectionKey);
    });
  }

  function saveHiddenKeys() {
    window.localStorage.setItem(
      VISIBILITY_STORAGE_KEY,
      JSON.stringify(Array.from(hiddenKeys))
    );
  }

  applyVisibility();

  /* ---- Panel UI ---- */

  const panel = document.createElement("div");
  panel.className = "section-reorder-panel";

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "section-reorder-toggle";
  toggle.textContent = "⇅ Reorder sections";
  panel.appendChild(toggle);

  const body = document.createElement("div");
  body.className = "section-reorder-body";
  body.hidden = true;

  const heading = document.createElement("div");
  heading.className = "section-reorder-heading";
  heading.textContent = "Drag ⠿ to reorder — ⌘-click or Shift-click to select several";
  body.appendChild(heading);

  const list = document.createElement("ul");
  list.className = "section-reorder-list";
  body.appendChild(list);

  /* Kept as a separate <ul>, not appended into `list` -- every drag/
     reorder helper below reads `list.children` directly, and these
     tester rows carry no `data-section-key` (they're visibility-only,
     never draggable), so mixing them into `list` would corrupt the
     saved order the moment any real section got dragged. */
  const testerListHeading = document.createElement("div");
  testerListHeading.className = "section-reorder-heading";
  testerListHeading.textContent = "Type Tester units";
  body.appendChild(testerListHeading);

  const testerList = document.createElement("ul");
  testerList.className = "section-reorder-list";
  body.appendChild(testerList);

  const resetButton = document.createElement("button");
  resetButton.type = "button";
  resetButton.className = "section-reorder-reset";
  resetButton.textContent = "Reset order";
  body.appendChild(resetButton);

  panel.appendChild(body);
  document.body.appendChild(panel);

  toggle.addEventListener("click", function () {
    body.hidden = !body.hidden;
  });

  const selectedKeys = new Set();
  let lastClickedKey = null;

  function refreshSelectionState() {
    Array.from(list.children).forEach(function (item) {
      item.classList.toggle(
        "section-reorder-item-selected",
        selectedKeys.has(item.dataset.sectionKey)
      );
    });
  }

  function buildList() {
    list.innerHTML = "";
    currentOrder().forEach(function (key) {
      const item = document.createElement("li");
      item.className = "section-reorder-item";
      item.dataset.sectionKey = key;

      /* Only this small handle is draggable -- not the whole row -- so an
         ordinary click/scroll near the list can never start an accidental
         native drag and silently rewrite the saved order. */
      const handle = document.createElement("span");
      handle.className = "section-reorder-handle";
      handle.draggable = true;
      handle.setAttribute("aria-hidden", "true");
      handle.textContent = "⠿";
      item.appendChild(handle);

      const label = document.createElement("span");
      label.className = "section-reorder-label";
      label.textContent = sectionLabels[key] || key;

      /* Ctrl/Cmd-click toggles this row in/out of a multi-selection;
         Shift-click selects the whole range since the last-clicked row;
         a plain click collapses the selection back down to just this row.
         Any of these rows' sections can then be dragged (via any of their
         handles) together as one group. */
      label.addEventListener("click", function (event) {
        if (event.shiftKey && lastClickedKey) {
          const keys = Array.from(list.children).map(function (el) {
            return el.dataset.sectionKey;
          });
          const fromIndex = keys.indexOf(lastClickedKey);
          const toIndex = keys.indexOf(key);
          if (fromIndex !== -1 && toIndex !== -1) {
            const start = Math.min(fromIndex, toIndex);
            const end = Math.max(fromIndex, toIndex);
            keys.slice(start, end + 1).forEach(function (rangeKey) {
              selectedKeys.add(rangeKey);
            });
          }
        } else if (event.ctrlKey || event.metaKey) {
          if (selectedKeys.has(key)) {
            selectedKeys.delete(key);
          } else {
            selectedKeys.add(key);
          }
          lastClickedKey = key;
        } else {
          selectedKeys.clear();
          selectedKeys.add(key);
          lastClickedKey = key;
        }
        refreshSelectionState();
      });

      item.appendChild(label);

      /* Photoshop-style layer visibility toggle: hides the section on the
         page without deleting anything, so this is safe to use for
         planning/reviewing layout options. */
      const eyeButton = document.createElement("button");
      eyeButton.type = "button";
      eyeButton.className = "section-reorder-eye";
      eyeButton.textContent = "👁";

      function refreshEyeState() {
        const isHidden = hiddenKeys.has(key);
        eyeButton.classList.toggle("section-reorder-eye-hidden", isHidden);
        eyeButton.setAttribute(
          "aria-label",
          isHidden ? "Show section" : "Hide section"
        );
        item.classList.toggle("section-reorder-item-hidden", isHidden);
      }

      eyeButton.addEventListener("click", function () {
        if (hiddenKeys.has(key)) {
          hiddenKeys.delete(key);
        } else {
          hiddenKeys.add(key);
        }
        applyVisibility();
        saveHiddenKeys();
        refreshEyeState();
        // Nudges anything keyed off layout/visibility (e.g. the Font
        // Info pin-on-scroll observers, which skip a hidden instance
        // and need to know when that changes) without a reload.
        window.dispatchEvent(new Event("resize"));
      });

      refreshEyeState();
      item.appendChild(eyeButton);

      list.appendChild(item);
    });
  }

  buildList();

  /* Several sections can share the same auto-derived label (e.g. three
     near-identical "Ligature Showcase" entries) -- hovering the actual
     section on the page highlights its matching row in the list, so
     it's clear which one to drag/toggle without guessing from the
     label alone. */
  sections.forEach(function (section) {
    section.addEventListener("mouseenter", function () {
      const item = list.querySelector(
        '[data-section-key="' + section.dataset.sectionKey + '"]'
      );
      if (item) {
        item.classList.add("section-reorder-item-page-hover");
        if (!body.hidden) item.scrollIntoView({ block: "nearest" });
      }
    });
    section.addEventListener("mouseleave", function () {
      const item = list.querySelector(
        '[data-section-key="' + section.dataset.sectionKey + '"]'
      );
      if (item) item.classList.remove("section-reorder-item-page-hover");
    });
  });

  /* ---- Type Tester units: independently hideable, but NOT reorderable ----
     The six .tester-unit blocks live inside one CSS Grid (.tester-section),
     positioned by :nth-child so the grid's spanning/border rules line up.
     Turning them into their own <main>-level sections (so the drag-reorder
     system above could pick them up) would break that grid -- so instead
     they're listed here as visibility-only rows: same page, same layout,
     each one just independently showable/hideable. */
  const TESTER_VISIBILITY_STORAGE_KEY = "formae-tester-hidden";
  const testerUnits = Array.from(document.querySelectorAll(".tester-unit"));

  testerUnits.forEach(function (unit, index) {
    unit.dataset.testerKey = "tester-" + index;
  });

  function loadHiddenTesterKeys() {
    try {
      const raw = window.localStorage.getItem(TESTER_VISIBILITY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter(function (key) {
            return testerUnits.some(function (unit) {
              return unit.dataset.testerKey === key;
            });
          });
        }
      }
    } catch (error) {
      /* ignore malformed storage */
    }
    return testerUnits
      .filter(function (unit) {
        return unit.hidden;
      })
      .map(function (unit) {
        return unit.dataset.testerKey;
      });
  }

  const testerHiddenKeys = new Set(loadHiddenTesterKeys());

  function applyTesterVisibility() {
    testerUnits.forEach(function (unit) {
      unit.hidden = testerHiddenKeys.has(unit.dataset.testerKey);
    });
  }

  function saveTesterHiddenKeys() {
    window.localStorage.setItem(
      TESTER_VISIBILITY_STORAGE_KEY,
      JSON.stringify(Array.from(testerHiddenKeys))
    );
  }

  applyTesterVisibility();

  testerUnits.forEach(function (unit) {
    const key = unit.dataset.testerKey;
    const item = document.createElement("li");
    item.className = "section-reorder-item section-reorder-item-tester";
    item.dataset.testerKey = key;

    const label = document.createElement("span");
    label.className = "section-reorder-label";
    const titleEl = unit.querySelector(".tester-title");
    label.textContent = titleEl && titleEl.textContent.trim()
      ? titleEl.textContent.trim()
      : key;
    item.appendChild(label);

    const eyeButton = document.createElement("button");
    eyeButton.type = "button";
    eyeButton.className = "section-reorder-eye";
    eyeButton.textContent = "👁";

    function refreshTesterEyeState() {
      const isHidden = testerHiddenKeys.has(key);
      eyeButton.classList.toggle("section-reorder-eye-hidden", isHidden);
      eyeButton.setAttribute(
        "aria-label",
        isHidden ? "Show type tester" : "Hide type tester"
      );
      item.classList.toggle("section-reorder-item-hidden", isHidden);
    }

    eyeButton.addEventListener("click", function () {
      if (testerHiddenKeys.has(key)) {
        testerHiddenKeys.delete(key);
      } else {
        testerHiddenKeys.add(key);
      }
      applyTesterVisibility();
      saveTesterHiddenKeys();
      refreshTesterEyeState();
    });

    refreshTesterEyeState();
    item.appendChild(eyeButton);
    testerList.appendChild(item);

    unit.addEventListener("mouseenter", function () {
      item.classList.add("section-reorder-item-page-hover");
      if (!body.hidden) item.scrollIntoView({ block: "nearest" });
    });
    unit.addEventListener("mouseleave", function () {
      item.classList.remove("section-reorder-item-page-hover");
    });
  });

  /* Normally just the one row being dragged; if that row is part of a
     multi-selection (Ctrl/Cmd-click), the whole selection moves together
     as a group, in their existing relative order. */
  let draggedItems = [];

  list.addEventListener("dragstart", function (event) {
    if (!event.target.closest(".section-reorder-handle")) return;
    const item = event.target.closest(".section-reorder-item");
    if (!item) return;

    const key = item.dataset.sectionKey;
    if (!selectedKeys.has(key) || selectedKeys.size <= 1) {
      selectedKeys.clear();
      selectedKeys.add(key);
      refreshSelectionState();
    }

    draggedItems = Array.from(list.children).filter(function (el) {
      return selectedKeys.has(el.dataset.sectionKey);
    });
    draggedItems.forEach(function (el) {
      el.classList.add("section-reorder-item-dragging");
    });
    event.dataTransfer.effectAllowed = "move";
  });

  list.addEventListener("dragend", function () {
    draggedItems.forEach(function (el) {
      el.classList.remove("section-reorder-item-dragging");
    });
    draggedItems = [];

    const newOrder = Array.from(list.children).map(function (item) {
      return item.dataset.sectionKey;
    });
    applyOrder(newOrder);
    window.localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(newOrder));
  });

  list.addEventListener("dragover", function (event) {
    event.preventDefault();
    if (!draggedItems.length) return;

    const target = event.target.closest(".section-reorder-item");
    if (!target || draggedItems.includes(target)) return;

    const targetRect = target.getBoundingClientRect();
    const isAfter = event.clientY > targetRect.top + targetRect.height / 2;
    const anchor = isAfter ? target.nextSibling : target;

    draggedItems.forEach(function (el) {
      list.insertBefore(el, anchor);
    });
  });

  resetButton.addEventListener("click", function () {
    window.localStorage.removeItem(ORDER_STORAGE_KEY);
    applyOrder(originalOrder);

    /* Also restore visibility to the static markup's own defaults --
       previously this only reset order, leaving a stale hidden-list
       (e.g. from a section that no longer exists, or one that's
       shifted meaning) still hiding the wrong things. */
    hiddenKeys.clear();
    originalHiddenKeys.forEach(function (key) {
      hiddenKeys.add(key);
    });
    applyVisibility();
    saveHiddenKeys();
    window.dispatchEvent(new Event("resize"));

    buildList();
  });
})();


/* ========================================
   LIGATURE SHOWCASE -- CURSOR FOCUS EFFECT
   The permanently blurred/atmospheric words (styled in CSS) get a
   second, sharp, aria-hidden copy on top, revealed only through a soft
   circular mask that follows the pointer with eased inertia. Only the
   mask position is animated -- the two adjustable-speed constants
   below are the "easily adjustable variables" for follow/release speed
   the CSS comment above .ligature-showcase-zoomed refers to; blur
   amount, focus radius and softness are the CSS custom properties on
   that same selector.
======================================== */

Array.from(document.querySelectorAll(".ligature-showcase-zoomed")).forEach(
  function (section) {
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  // The reduced-motion fallback (lighter static blur, no pointer
  // tracking) is handled entirely in CSS -- just skip building the
  // interactive overlay so nothing here animates.
  if (reducedMotion) return;

  const words = Array.from(
    section.querySelectorAll(".ligature-showcase-word")
  );
  if (!words.length) return;

  const overlay = document.createElement("div");
  overlay.className = "ligature-focus-overlay";
  overlay.setAttribute("aria-hidden", "true");
  words.forEach(function (word) {
    overlay.appendChild(word.cloneNode(true));
  });
  section.appendChild(overlay);

  // How quickly the focus circle catches up to the pointer each frame
  // (0-1: higher = snappier/less lag, lower = more soft inertia).
  const FOCUS_LAG = 0.14;
  // How quickly it eases back to rest once the pointer leaves --
  // slower than FOCUS_LAG so the release reads as slow and elegant.
  const FOCUS_RELEASE_LAG = 0.05;

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let hasPosition = false;
  let isHovering = false;
  let rafId = null;

  function setTargetFromPoint(clientX, clientY) {
    const rect = section.getBoundingClientRect();
    targetX = clientX - rect.left;
    targetY = clientY - rect.top;
    if (!hasPosition) {
      // First contact: snap straight there instead of easing in from
      // the (0,0) default, so the circle doesn't visibly swoop in
      // from a corner.
      currentX = targetX;
      currentY = targetY;
      hasPosition = true;
    }
    ensureLoop();
  }

  function ensureLoop() {
    if (rafId === null) {
      rafId = requestAnimationFrame(tick);
    }
  }

  function tick() {
    const lag = isHovering ? FOCUS_LAG : FOCUS_RELEASE_LAG;
    currentX += (targetX - currentX) * lag;
    currentY += (targetY - currentY) * lag;

    overlay.style.setProperty("--focus-x", currentX + "px");
    overlay.style.setProperty("--focus-y", currentY + "px");

    const settled =
      Math.abs(targetX - currentX) < 0.5 &&
      Math.abs(targetY - currentY) < 0.5;

    if (isHovering || !settled) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = null;
    }
  }

  section.addEventListener("pointerenter", function (event) {
    if (event.pointerType === "touch") return;
    isHovering = true;
    overlay.classList.add("is-active");
    setTargetFromPoint(event.clientX, event.clientY);
  });

  section.addEventListener("pointermove", function (event) {
    if (event.pointerType === "touch") return;
    setTargetFromPoint(event.clientX, event.clientY);
  });

  section.addEventListener("pointerleave", function (event) {
    if (event.pointerType === "touch") return;
    isHovering = false;
    overlay.classList.remove("is-active");
    ensureLoop();
  });

  // Touch: sharpen under the finger while it's actually on the
  // section; release (slow fade back to blur) on lift.
  section.addEventListener(
    "touchstart",
    function (event) {
      const touch = event.touches[0];
      if (!touch) return;
      isHovering = true;
      overlay.classList.add("is-active");
      setTargetFromPoint(touch.clientX, touch.clientY);
    },
    { passive: true }
  );

  section.addEventListener(
    "touchmove",
    function (event) {
      const touch = event.touches[0];
      if (!touch) return;
      setTargetFromPoint(touch.clientX, touch.clientY);
    },
    { passive: true }
  );

  section.addEventListener("touchend", function () {
    isHovering = false;
    overlay.classList.remove("is-active");
    ensureLoop();
  });
  }
);


/* ========================================
   LIVE SIZE LABELS
   Every "Regular / N" label on the page names the font-size clamp's
   ceiling, but the text it labels is sized responsively (vw/cqmin/cqw)
   and is usually well below that ceiling. Read back the actual
   rendered size instead of leaving the number static.
======================================== */
(function () {
  const pairs = [];

  document.querySelectorAll(".specimen").forEach(function (section) {
    const label = section.querySelector(".specimen-label");
    const text = section.querySelector(".specimen-text");
    if (label && text) pairs.push({ label: label, text: text });
  });

  document.querySelectorAll(".text-samples .text-sample").forEach(function (sample) {
    // A sample split into quads/halves has its own span+p pair inside
    // each sub-box -- querySelector alone would only ever find the
    // first one and leave the rest showing their static placeholder.
    const subBoxes = sample.querySelectorAll(
      ".text-sample-quad, .text-sample-half"
    );

    if (subBoxes.length) {
      subBoxes.forEach(function (box) {
        const label = box.querySelector("span");
        const text = box.querySelector("p");
        if (label && text) pairs.push({ label: label, text: text });
      });
      return;
    }

    const label = sample.querySelector("span");
    const text = sample.querySelector("p");
    if (label && text) pairs.push({ label: label, text: text });
  });

  // The half-width articles (à / 3%) are their own <article>s rather than
  // .text-sample, so the loop above never reached them and their label kept
  // a static "Regular / 150" whatever size the text actually had. The
  // cycling accented a is labelled by the glyph it shows ("Regular / a"),
  // not by a size, so it stays as written.
  document
    .querySelectorAll(".text-samples .text-sample-half-article")
    .forEach(function (half) {
      const label = half.querySelector("span");
      const text = half.querySelector("p");
      if (label && text && label.id !== "a-cycle-label") {
        pairs.push({ label: label, text: text });
      }
    });

  document.querySelectorAll(".type-scale-block").forEach(function (block) {
    const label = block.querySelector(".type-scale-meta");
    const text = block.querySelector(".type-scale-text");
    if (label && text) pairs.push({ label: label, text: text });
  });

  if (!pairs.length) return;

  // The specimen rows' label bar carries three things, like a type specimen sheet: left the weight / size ("Bold / 309"),
  // in the middle the name and kind of the typeface, right the tracking and leading the word is really set with.
  // Tracking is in thousandths of an em, leading in percent of the font size -- both read back from the rendered word,
  // so they follow the page as it scales.
  const SPECIMEN_FAMILY = "Formae · Display serif";

  function decorateSpecimenLabel(pair) {
    const cs = window.getComputedStyle(pair.text);
    const fontSize = parseFloat(cs.fontSize);
    const spacing = cs.letterSpacing === "normal" ? 0 : parseFloat(cs.letterSpacing);
    const lineHeight = cs.lineHeight === "normal" ? fontSize * 1.2 : parseFloat(cs.lineHeight);
    const tracking = Math.round((spacing / fontSize) * 1000);
    const leading = Math.round((lineHeight / fontSize) * 100);
    const sign = tracking > 0 ? "+" : tracking < 0 ? "\u2212" : "";

    const size = document.createElement("span");
    size.className = "specimen-label-size";
    size.textContent = pair.label.textContent;

    const name = document.createElement("span");
    name.className = "specimen-label-name";
    name.textContent = SPECIMEN_FAMILY;

    const metrics = document.createElement("span");
    metrics.className = "specimen-label-metrics";
    [["Tracking ", sign + Math.abs(tracking) + " / "], ["Leading ", leading + "%"]].forEach(function (part) {
      const word = document.createElement("span");
      word.className = "specimen-label-word";
      word.textContent = part[0];
      metrics.appendChild(word);
      metrics.appendChild(document.createTextNode(part[1]));
    });

    pair.label.replaceChildren(size, name, metrics);
  }

  function updateLabels() {
    pairs.forEach(function (pair) {
      const size = Math.round(
        parseFloat(window.getComputedStyle(pair.text).fontSize)
      );
      const prefix = pair.label.dataset.labelPrefix;
      const suffix = pair.label.dataset.labelSuffix;
      pair.label.textContent =
        prefix && suffix
          ? prefix + " / " + size + " / " + suffix
          : "Regular / " + size;
      if (pair.label.classList.contains("specimen-label")) decorateSpecimenLabel(pair);
    });
  }

  updateLabels();

  let rafId = null;
  window.addEventListener("resize", function () {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(function () {
      rafId = null;
      updateLabels();
    });
  });
})();


/* ========================================
   GLYPH QUAD OPTICAL CENTERING
======================================== */
(function () {
  const glyphs = document.querySelectorAll(".text-sample-quad-glyph p");
  if (!glyphs.length) return;

  function centerGlyph(p) {
    const quad = p.parentElement;
    const quadRect = quad.getBoundingClientRect();

    p.style.transform = "none";

    const range = document.createRange();
    range.selectNodeContents(p);
    const inkRect = range.getBoundingClientRect();
    if (!inkRect.width || !inkRect.height) return;

    const dx =
      (quadRect.left + quadRect.width / 2) -
      (inkRect.left + inkRect.width / 2);
    let dy =
      (quadRect.top + quadRect.height / 2) -
      (inkRect.top + inkRect.height / 2);

    // Centering on the full ink box treats a descender (the loop
    // below baseline on this "g") as part of the glyph's visual mass
    // to balance around -- fine for body text, but in a showcase next
    // to non-descending characters like "&" it reads as sitting lower
    // than the others instead of sharing their band. Nudge it back up
    // by roughly the descender's own share of the ink height.
    if (p.textContent.trim() === "g") {
      dy -= inkRect.height * 0.15;
    }

    p.style.transform = "translate(" + dx + "px, " + dy + "px)";
  }

  function centerAll() {
    glyphs.forEach(centerGlyph);
  }

  centerAll();
  document.fonts.ready.then(centerAll);

  let rafId = null;
  window.addEventListener("resize", function () {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(function () {
      rafId = null;
      centerAll();
    });
  });
})();


/* ========================================
   ELLIOTT (2nd Text Samples hero word) -- FIT TO WIDTH
   The hero word's font-size is a fixed viewport-based clamp() tuned
   for a short word -- a longer word ("ELLIOTT") at that same size runs
   past the box's right edge instead of leaving the same margin the
   left side (text-align:center) already has. Measure the rendered
   width and scale the font-size down to fit exactly.
======================================== */
(function () {
  const word = document.querySelector(".text-sample-hero-6x-centered");
  if (!word) return;

  function fitWord() {
    const available = word.clientWidth;
    if (!available) return;

    word.style.fontSize = "";
    const naturalSize = parseFloat(getComputedStyle(word).fontSize);

    const range = document.createRange();
    range.selectNodeContents(word);
    const textWidth = range.getBoundingClientRect().width;
    if (!textWidth) return;

    if (textWidth > available) {
      const fitted = naturalSize * (available / textWidth);
      word.style.fontSize = fitted + "px";
    }
  }

  fitWord();
  document.fonts.ready.then(fitWord);

  let rafId = null;
  window.addEventListener("resize", function () {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(function () {
      rafId = null;
      fitWord();
    });
  });
})();


/* ========================================
   FONTFRONT (1st Text Samples hero word) -- FIT TO WIDTH
   Unlike ELLIOTT above (which only shrinks if it would otherwise
   overflow), this word always runs wall to wall -- scale the
   font-size up or down so the rendered text exactly fills the
   available width, regardless of its own natural size at this
   viewport.
======================================== */
(function () {
  const word = document.querySelector(".text-sample-hero-fullwidth");
  if (!word) return;

  function fitWord() {
    const available = word.clientWidth;
    if (!available) return;

    word.style.fontSize = "";
    const naturalSize = parseFloat(getComputedStyle(word).fontSize);

    const range = document.createRange();
    range.selectNodeContents(word);
    const textWidth = range.getBoundingClientRect().width;
    if (!textWidth) return;

    const fitted = naturalSize * (available / textWidth);
    word.style.fontSize = fitted + "px";
  }

  fitWord();
  document.fonts.ready.then(fitWord);

  let rafId = null;
  window.addEventListener("resize", function () {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(function () {
      rafId = null;
      fitWord();
    });
  });
})();


/* ========================================
   SPECIMEN WORDS -- FIT TO WIDTH
   Same wall-to-wall treatment as FONTFRONT, applied to every specimen
   word (Æðelstan, Frontispiece, Illuminated, Colonnade, Cartouche,
   Wineyards, the digits) individually -- each fills the same shared
   clamp() size today, so a short word like "Cartouche" leaves a much
   bigger gap on the right than a long one like "Illuminated". Give
   each its own scale factor instead, so every one reaches the same
   left/right margin the box already has.
======================================== */
(function () {
  const words = document.querySelectorAll(".specimen-text");
  if (!words.length) return;

  function fitWord(word) {
    const available = word.clientWidth;
    if (!available) return;

    word.style.fontSize = "";
    const naturalSize = parseFloat(getComputedStyle(word).fontSize);

    const range = document.createRange();
    range.selectNodeContents(word);
    const textWidth = range.getBoundingClientRect().width;
    if (!textWidth) return;

    const fitted = naturalSize * (available / textWidth);
    word.style.fontSize = fitted + "px";
  }

  // True only while this script's own resize dispatch (below) is in
  // flight, so its own listener can ignore it -- without this, each
  // dispatch would trigger the listener, which would fit + dispatch
  // again next frame, forever.
  let dispatchingOwnResize = false;

  function fitAll() {
    words.forEach(fitWord);

    // LIVE SIZE LABELS (below) reads each word's font-size back into
    // its "Regular / N" label, but only on its own load/resize pass --
    // it runs once before this script's fonts.ready callback can have
    // changed anything, so nudge it to re-read the sizes this just set.
    dispatchingOwnResize = true;
    window.dispatchEvent(new Event("resize"));
    dispatchingOwnResize = false;
  }

  fitAll();
  document.fonts.ready.then(fitAll);

  let rafId = null;
  window.addEventListener("resize", function () {
    if (dispatchingOwnResize) return;
    if (rafId !== null) return;
    rafId = requestAnimationFrame(function () {
      rafId = null;
      fitAll();
    });
  });
})();


/* ========================================
   SPECIMEN GLYPH PLACEMENT
   The big glyphs sized by hand in Design Mode (the Q, the circled
   digits, the AaBb block) sit in flow right under their box's label.
   That label band is fixed px -- 1px border + 16px padding + the label
   line + the 12px gap, about 43-50px -- while everything else in the
   composition scales with the box (see --u). Left alone, the band eats
   a growing share of a shrinking box and pushes each glyph further down
   than its proportional spot: by ~25% of the box height on a phone,
   which is what cropped the bottom of the Q and of the circles. So pull
   each one back up by exactly the band's unscaled excess, keeping the
   position it has (as a fraction of its box) at the 1920 design width.

   The Q is also centred horizontally in its box by its real ink (the
   glyph outline's own left/right extent from canvas measureText, not the
   advance box, which is blind to the Q's tail): its Design Mode padding
   (24px left, 121px right) left it about 4% of the box left of centre.
======================================== */
(function () {
  const DESIGN_WIDTH = 1920;
  const inkContext = document.createElement("canvas").getContext("2d");
  function placeGlyphs() {
    const scale = Math.min(1, window.innerWidth / DESIGN_WIDTH);

    // Every in-flow text block of a .text-sample (not the glyph quads,
    // which centre themselves absolutely).
    document
      .querySelectorAll(
        ".text-samples .text-sample > p, " +
          ".text-samples .text-sample > div:not(.text-sample-quad) > p"
      )
      .forEach(function (p) {
        const box = p.closest(".text-sample");
        if (!box) return;

        p.style.translate = "";

        // Hand-sized glyphs always get placed. Plain text blocks (the hero
        // words, the paragraph) sit right under their label and must keep
        // clear of it -- until the label is hidden (phone sizes), when the
        // empty band above them is only wasted room.
        const label = box.querySelector("span");
        const labelHidden =
          !!label && getComputedStyle(label).visibility === "hidden";
        if (!p.hasAttribute("data-poster-size") && !labelHidden) return;

        const boxRect = box.getBoundingClientRect();
        const pRect = p.getBoundingClientRect();
        const marginTop = parseFloat(getComputedStyle(p).marginTop) || 0;

        // The band above this glyph: everything between the box's top
        // edge and the glyph's own margin box (border, padding, label,
        // gap) -- fixed px, so it is the same at every width.
        const band = pRect.top - marginTop - boxRect.top;
        const dy = band * (scale - 1);

        let dx = 0;
        if (
          p.hasAttribute("data-poster-size") &&
          box.classList.contains("text-sample-large")
        ) {
          const range = document.createRange();
          range.selectNodeContents(p);
          const textRect = range.getBoundingClientRect();
          if (textRect.width) {
            // textRect.left is where the glyph's origin sits; measureText
            // gives the ink's extent either side of that origin.
            const cs = getComputedStyle(p);
            inkContext.font =
              cs.fontStyle +
              " " +
              cs.fontWeight +
              " " +
              cs.fontSize +
              " " +
              cs.fontFamily;
            inkContext.letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
            const ink = inkContext.measureText(p.textContent.trim());
            const inkCenter =
              textRect.left +
              (ink.actualBoundingBoxRight - ink.actualBoundingBoxLeft) / 2;
            dx = boxRect.left + boxRect.width / 2 - inkCenter;
          }
        }

        p.style.translate = dx + "px " + dy + "px";
      });
  }

  placeGlyphs();
  document.fonts.ready.then(placeGlyphs);

  let rafId = null;
  window.addEventListener("resize", function () {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(function () {
      rafId = null;
      placeGlyphs();
    });
  });
})();


/* ========================================
   LAYOUT-WIDTH WATCHER
   Every script above and below re-fits on the window's "resize" event,
   but that event doesn't reliably fire when the viewport is changed by
   device emulation (the Browser pane's Tablet/Mobile presets, devtools),
   only for real window drags -- the labels, fitted words and glyph
   placement would then keep the previous width's numbers. Nudge them
   whenever the layout width changed without a resize event.
======================================== */
(function () {
  if (typeof ResizeObserver === "undefined") return;

  let lastWidth = document.documentElement.clientWidth;

  window.addEventListener("resize", function () {
    lastWidth = document.documentElement.clientWidth;
  });

  new ResizeObserver(function () {
    const width = document.documentElement.clientWidth;
    if (width === lastWidth) return;

    lastWidth = width;
    window.dispatchEvent(new Event("resize"));
  }).observe(document.documentElement);
})();


/* ========================================
   ACCENTED "a" CYCLE
   Loops through every accented lowercase "a" in the character set, one
   at a time, in the first Wine-remembers half.
======================================== */
(function () {
  const el = document.getElementById("a-cycle");
  if (!el) return;

  const variants = [
    "a", "à", "á", "â", "ã", "ä", "å",
    "ā", "ă", "ą"
  ];

  let index = 0;
  setInterval(function () {
    index = (index + 1) % variants.length;
    el.textContent = variants[index];
  }, 600);
})();


/* ========================================
   PIN HEADER CTA ON SCROLL
   The Try/Buy buttons sit next to the Font Info title by default. Once
   scrolling passes that point, they switch straight to fixed position
   at the top of the viewport (no move/animation, just a class swap) so
   they stay reachable. A tiny sentinel sits at their original spot so
   the trigger tracks the real position instead of a guessed scroll
   value.
======================================== */
(function () {
  const header = document.querySelector(".header");
  // Font Info can now exist twice (the duplicate light-background
  // section) -- whichever instance the user has actually left visible
  // via the Reorder panel is the one whose buttons should pin, not
  // hardcoded to the original's ids. Each gets its own sentinel/
  // observer/latch; a hidden instance's is skipped entirely so it
  // can't fire a bogus pin from an unrendered (0,0) bounding rect.
  const pairs = Array.from(document.querySelectorAll(".font-info-header"))
    .map(function (fontInfoHeader) {
      return {
        section: fontInfoHeader.closest(".font-info"),
        fontInfoHeader: fontInfoHeader,
        actions: fontInfoHeader.querySelector(".font-info-actions"),
      };
    })
    .filter(function (pair) {
      return pair.section && pair.actions;
    });
  if (!header || !pairs.length) return;

  function updateHeaderHeightVar() {
    document.documentElement.style.setProperty(
      "--header-height",
      header.getBoundingClientRect().height + "px"
    );
  }

  updateHeaderHeightVar();
  window.addEventListener("resize", updateHeaderHeightVar);

  pairs.forEach(function (pair) {
    const sentinel = document.createElement("div");
    sentinel.setAttribute("aria-hidden", "true");
    sentinel.style.position = "absolute";
    sentinel.style.top = "50%";
    sentinel.style.right = "0";
    sentinel.style.width = "1px";
    sentinel.style.height = "1px";
    sentinel.style.pointerEvents = "none";
    pair.fontInfoHeader.appendChild(sentinel);
    pair.sentinel = sentinel;
  });

  // "Not intersecting" the header-shrunk root is ambiguous: it's true
  // both when the sentinel has scrolled up behind the header (what we
  // want to catch) AND when it simply hasn't scrolled into view yet
  // from below (e.g. still sitting there at the top of the page) --
  // the observer can't tell those two apart from isIntersecting alone,
  // so every callback checked boundingClientRect.top directly against
  // the header height instead. That's also what makes the one-way
  // latch below safe: once pinned, later callbacks are ignored.
  let observers = [];

  function setupObservers() {
    observers.forEach(function (o) { o.disconnect(); });
    observers = [];

    pairs.forEach(function (pair) {
      // A hidden section (display:none via the Reorder panel) has no
      // real layout -- its sentinel would report a zero-ish rect that
      // reads as "already past the header", latching a pin that then
      // has nothing visible to render. Section visibility can change
      // later (the panel toggles it live), so this is re-checked on
      // every resize-driven setup, not just once at load.
      if (pair.section.offsetParent === null) return;

      const observer = new IntersectionObserver(
        function (entries) {
          const entry = entries[0];

          // Pinning only ever latches on, never off -- once scrolling
          // has caught the buttons into the header, they stay there
          // even when scrolling back up past the original spot.
          if (pair.actions.classList.contains("font-info-actions-pinned")) {
            return;
          }

          if (entry.boundingClientRect.top < header.offsetHeight) {
            pair.actions.classList.add("font-info-actions-pinned");
          }
        },
        { threshold: 0, rootMargin: "-" + header.offsetHeight + "px 0px 0px 0px" }
      );

      observer.observe(pair.sentinel);
      observers.push(observer);
    });
  }

  setupObservers();

  let resizeRaf = null;
  window.addEventListener("resize", function () {
    if (resizeRaf !== null) return;
    resizeRaf = requestAnimationFrame(function () {
      resizeRaf = null;
      setupObservers();
    });
  });
})();


/* ========================================
   DESIGN MODE
   Dev-only inspector: click an element to see and edit its
   margin/padding/font-size live, then Copy CSS to grab the exact
   values as text. Toggle button bottom-left; state persists in
   localStorage so a refresh doesn't lose the on/off state.
======================================== */
(function () {
  const STORAGE_KEY = "formae-design-mode";
  const OVERRIDES_KEY = "formae-design-mode-overrides";
  const SIDES = ["Top", "Right", "Bottom", "Left"];

  let active = window.localStorage.getItem(STORAGE_KEY) === "1";
  let selectedEl = null;
  let hoverEl = null;

  // Every edit made in the panel (margin/padding/font-size/text) is
  // recorded here, keyed by the element's selector, and reapplied on
  // every load -- otherwise a refresh would silently discard whatever
  // was adjusted, since it only ever lived as an inline style.
  function loadOverrides() {
    try {
      const raw = window.localStorage.getItem(OVERRIDES_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      return {};
    }
  }

  function saveOverrides(map) {
    try {
      window.localStorage.setItem(OVERRIDES_KEY, JSON.stringify(map));
    } catch (error) {
      /* storage full or unavailable -- edits just won't persist */
    }
  }

  function recordOverride(el, prop, value) {
    const selector = describeSelector(el);
    const map = loadOverrides();
    if (!map[selector]) map[selector] = {};
    map[selector][prop] = value;
    saveOverrides(map);
  }

  // ---- Poster scaling -------------------------------------------------
  // The specimen blocks (Text Samples / Type Samples 2) are "posters":
  // designed at a 1920px-wide viewport and scaled down below it by the CSS
  // --u unit (1px from 1920 up, shrinking in step with the viewport). A px
  // value set here on anything inside one is therefore stored as its
  // design-width px (so saved states keep meaning what they always meant)
  // but APPLIED as calc(N * var(--u)) -- it keeps its proportion to the box
  // at every width. A flat N px is what cropped the big glyphs (Q, the
  // circled digits, AaBb, 1%) as soon as the box shrank around them.
  const DESIGN_WIDTH = 1920;
  const POSTER_PROPS = {
    fontSize: true,
    "margin-top": true,
    "margin-right": true,
    "margin-bottom": true,
    "margin-left": true,
    "padding-top": true,
    "padding-right": true,
    "padding-bottom": true,
    "padding-left": true
  };

  function isPosterValue(el, prop) {
    if (!POSTER_PROPS[prop] || !el.closest(".text-samples")) return false;

    // A box's own top padding is its label inset -- the same 16px gap the
    // H2 caption group keeps on every box -- so it stays a real px value.
    if (
      prop === "padding-top" &&
      el.matches(".text-sample, .text-sample-half-article, .text-sample-quad")
    ) {
      return false;
    }

    return true;
  }

  // The inline-style value to apply for a stored (design px) value.
  function styleValueFor(el, prop, stored) {
    const match = /^(-?\d+(?:\.\d+)?)px$/.exec(String(stored).trim());
    if (match && isPosterValue(el, prop)) {
      return "calc(" + match[1] + " * var(--u))";
    }
    // Everything else keeps its design px up to 1920 and grows with the
    // page above it.
    if (match && parseFloat(match[1]) !== 0) {
      return "calc(" + match[1] + " * var(--w))";
    }
    return stored;
  }

  // A number typed into the panel is the px the user sees right now, at
  // this viewport width; store it as the design px that renders as exactly
  // that here (identical to what it always was at 1920 and above).
  function storedFromTyped(el, prop, typed) {
    const px = parseFloat(typed);
    if (!isFinite(px)) return typed + "px";
    if (!isPosterValue(el, prop)) {
      // Plain values are design px that grow above 1920 (--w).
      return (
        Math.round((px / Math.max(1, window.innerWidth / DESIGN_WIDTH)) * 10) /
          10 +
        "px"
      );
    }

    const scale = window.innerWidth / DESIGN_WIDTH;
    return Math.round((px / scale) * 10) / 10 + "px";
  }

  // A poster block whose glyph size was set by hand is a composition placed
  // at the design width -- flag it so SPECIMEN GLYPH PLACEMENT (above) keeps
  // its position box-proportional as the label band stops scaling.
  function markPosterGlyph(el, prop) {
    if (prop === "fontSize" && isPosterValue(el, prop)) {
      el.setAttribute("data-poster-size", "");
    }
  }

  function applyStoredOverrides() {
    const map = loadOverrides();
    Object.keys(map).forEach(function (selector) {
      let matches;
      try {
        matches = document.querySelectorAll(selector);
      } catch (error) {
        return;
      }
      matches.forEach(function (el) {
        Object.keys(map[selector]).forEach(function (prop) {
          const value = map[selector][prop];
          if (prop === "text") {
            el.textContent = value;
          } else {
            el.style[prop] = styleValueFor(el, prop, value);
            markPosterGlyph(el, prop);
          }
        });
      });
    });
  }

  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.className = "design-mode-toggle";
  toggleBtn.textContent = "Design Mode";
  document.body.appendChild(toggleBtn);

  const hoverOutline = document.createElement("div");
  hoverOutline.className = "design-mode-outline design-mode-outline-hover";
  hoverOutline.hidden = true;
  document.body.appendChild(hoverOutline);

  const selectOutline = document.createElement("div");
  selectOutline.className = "design-mode-outline design-mode-outline-selected";
  selectOutline.hidden = true;
  document.body.appendChild(selectOutline);

  const panel = document.createElement("div");
  panel.className = "design-mode-panel";
  panel.hidden = true;
  document.body.appendChild(panel);

  function positionOutline(box, rect) {
    box.style.left = rect.left + window.scrollX + "px";
    box.style.top = rect.top + window.scrollY + "px";
    box.style.width = rect.width + "px";
    box.style.height = rect.height + "px";
  }

  // The hover/selection outline always traces the element's own full
  // box (padding included), the same thing its Margin/Padding fields
  // in the panel act on -- not just a tight rectangle around the
  // visible ink, which used to make the outline look like it was only
  // targeting the letters instead of the whole element.
  function getVisualRect(el) {
    return el.getBoundingClientRect();
  }

  // Clicking/hovering a padded area around some text should target the
  // text itself, not the box built around it -- walk down through
  // children looking for the deepest one that directly owns a text
  // node, so selection lands on the actual copy rather than its
  // wrapper's empty padding space.
  function findTextLeaf(el) {
    while (el && el.children && el.children.length > 0) {
      let next = null;
      for (let i = 0; i < el.children.length; i++) {
        const child = el.children[i];
        const hasOwnText = Array.prototype.some.call(
          child.childNodes,
          function (node) {
            return node.nodeType === 3 && node.textContent.trim();
          }
        );
        if (hasOwnText) {
          next = child;
          break;
        }
      }
      if (!next) break;
      el = next;
    }
    return el;
  }

  // A full nth-child path from <body> down to el -- always unique,
  // unlike a bare class/tag name.
  function nthChildPath(el) {
    const parts = [];
    let node = el;
    while (node && node !== document.body && node.parentElement) {
      const parent = node.parentElement;
      const index =
        Array.prototype.indexOf.call(parent.children, node) + 1;
      parts.unshift(node.tagName.toLowerCase() + ":nth-child(" + index + ")");
      node = parent;
    }
    return parts.join(" > ");
  }

  // Recording an edit under a selector that matches more than this one
  // element means every OTHER match gets the same edit reapplied on
  // the next load -- happened for real with a bare "p"/"span" (every
  // classless text leaf on the page shares that "selector"), and again
  // with a class shared by several elements (the 4 glyph-quad
  // paragraphs). Only trust id/class if it's actually unique on the
  // page right now; otherwise fall back to a full nth-child path,
  // which by construction can only ever match the one element.
  function describeSelector(el) {
    if (el.id) return "#" + el.id;
    if (typeof el.className === "string" && el.className.trim()) {
      const classSelector =
        "." + el.className.trim().split(/\s+/).join(".");
      if (document.querySelectorAll(classSelector).length === 1) {
        return classSelector;
      }
    }
    return nthChildPath(el);
  }

  function refreshSelectedOutline() {
    if (selectedEl) {
      positionOutline(selectOutline, getVisualRect(selectedEl));
    }
  }

  function addBoxGroup(container, label, prop, el) {
    const cs = window.getComputedStyle(el);

    const group = document.createElement("div");
    group.className = "design-mode-group";

    const groupLabel = document.createElement("div");
    groupLabel.className = "design-mode-group-label";
    groupLabel.textContent = label;
    group.appendChild(groupLabel);

    const row = document.createElement("div");
    row.className = "design-mode-row";

    SIDES.forEach(function (side) {
      const fullProp = prop + "-" + side.toLowerCase();

      const wrap = document.createElement("label");
      wrap.className = "design-mode-field";

      const span = document.createElement("span");
      span.textContent = side.charAt(0);
      wrap.appendChild(span);

      const input = document.createElement("input");
      input.type = "number";
      input.value = Math.round(parseFloat(cs[fullProp]) || 0);
      input.addEventListener("input", function () {
        const stored = storedFromTyped(el, fullProp, input.value);
        el.style[fullProp] = styleValueFor(el, fullProp, stored);
        recordOverride(el, fullProp, stored);
        window.dispatchEvent(new Event("resize"));
        refreshSelectedOutline();
      });

      wrap.appendChild(input);
      row.appendChild(wrap);
    });

    group.appendChild(row);
    container.appendChild(group);
  }

  function buildPanel(el) {
    const selector = describeSelector(el);
    const cs = window.getComputedStyle(el);

    panel.innerHTML = "";

    const title = document.createElement("div");
    title.className = "design-mode-panel-title";
    title.textContent = selector;
    panel.appendChild(title);

    if (el.children.length === 0 && el.textContent.trim()) {
      const textGroup = document.createElement("div");
      textGroup.className = "design-mode-group";

      const textLabel = document.createElement("div");
      textLabel.className = "design-mode-group-label";
      textLabel.textContent = "Text";
      textGroup.appendChild(textLabel);

      const textInput = document.createElement("textarea");
      textInput.className = "design-mode-text";
      textInput.value = el.textContent;
      textInput.rows = 2;
      textInput.addEventListener("input", function () {
        el.textContent = textInput.value;
        recordOverride(el, "text", textInput.value);
        refreshSelectedOutline();
      });
      textGroup.appendChild(textInput);
      panel.appendChild(textGroup);
    }

    addBoxGroup(panel, "Margin (T R B L)", "margin", el);
    addBoxGroup(panel, "Padding (T R B L)", "padding", el);

    const parent = el.parentElement;
    if (parent && parent !== document.body) {
      const parentTitle = document.createElement("div");
      parentTitle.className = "design-mode-panel-subtitle";
      parentTitle.textContent = "Parent: " + describeSelector(parent);
      panel.appendChild(parentTitle);

      addBoxGroup(panel, "Parent padding (T R B L)", "padding", parent);
    }

    const fontGroup = document.createElement("div");
    fontGroup.className = "design-mode-group";

    const fontLabel = document.createElement("div");
    fontLabel.className = "design-mode-group-label";
    fontLabel.textContent = "Font size (px)";
    fontGroup.appendChild(fontLabel);

    const fontInput = document.createElement("input");
    fontInput.type = "number";
    fontInput.value = Math.round(parseFloat(cs.fontSize) || 0);
    fontInput.addEventListener("input", function () {
      const stored = storedFromTyped(el, "fontSize", fontInput.value);
      el.style.fontSize = styleValueFor(el, "fontSize", stored);
      markPosterGlyph(el, "fontSize");
      recordOverride(el, "fontSize", stored);
      window.dispatchEvent(new Event("resize"));
      refreshSelectedOutline();
    });
    fontGroup.appendChild(fontInput);
    panel.appendChild(fontGroup);

    const alignGroup = document.createElement("div");
    alignGroup.className = "design-mode-group";

    const alignLabel = document.createElement("div");
    alignLabel.className = "design-mode-group-label";
    alignLabel.textContent = "Alignment";
    alignGroup.appendChild(alignLabel);

    const alignRow = document.createElement("div");
    alignRow.className = "design-mode-row design-mode-align-row";

    const currentAlign = cs.textAlign;
    [
      ["Left", "left"],
      ["Center", "center"],
      ["Right", "right"],
      ["Justify", "justify"]
    ].forEach(function (pair) {
      const label = pair[0];
      const value = pair[1];

      const alignBtn = document.createElement("button");
      alignBtn.type = "button";
      alignBtn.className = "design-mode-align-btn";
      alignBtn.textContent = label;
      alignBtn.classList.toggle(
        "is-active",
        currentAlign === value ||
          (currentAlign === "start" && value === "left")
      );
      alignBtn.addEventListener("click", function () {
        el.style.textAlign = value;
        recordOverride(el, "textAlign", value);
        Array.prototype.forEach.call(
          alignRow.children,
          function (btn) {
            btn.classList.remove("is-active");
          }
        );
        alignBtn.classList.add("is-active");
        refreshSelectedOutline();
      });
      alignRow.appendChild(alignBtn);
    });

    alignGroup.appendChild(alignRow);
    panel.appendChild(alignGroup);

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "design-mode-copy";
    copyBtn.textContent = "Copy CSS";
    copyBtn.addEventListener("click", function () {
      const inline = el.getAttribute("style") || "";
      const declarations = inline
        .split(";")
        .map(function (part) {
          return part.trim();
        })
        .filter(Boolean)
        .map(function (part) {
          const pieces = part.split(":");
          const prop = pieces[0].trim();
          // Poster-scaled values (calc(N * var(--u))) copy out as the
          // plain design px they stand for.
          const value = pieces
            .slice(1)
            .join(":")
            .trim()
            .replace(/calc\((-?[\d.]+) \* var\(--[uw]\)\)/g, "$1px");
          return "  " + prop + ": " + value + ";";
        })
        .join("\n");

      const css = selector + " {\n" + declarations + "\n}";

      navigator.clipboard.writeText(css).then(function () {
        copyBtn.textContent = "Copied!";
        window.setTimeout(function () {
          copyBtn.textContent = "Copy CSS";
        }, 1200);
      });
    });
    panel.appendChild(copyBtn);

    panel.hidden = false;
  }

  function setActive(next) {
    active = next;
    window.localStorage.setItem(STORAGE_KEY, active ? "1" : "0");
    document.body.classList.toggle("design-mode-active", active);
    toggleBtn.classList.toggle("is-on", active);

    if (!active) {
      hoverOutline.hidden = true;
      selectOutline.hidden = true;
      panel.hidden = true;
      selectedEl = null;
      hoverEl = null;
    }
  }

  toggleBtn.addEventListener("click", function () {
    setActive(!active);
  });

  document.addEventListener("mousemove", function (event) {
    if (!active) return;
    if (
      panel.contains(event.target) ||
      toggleBtn.contains(event.target) ||
      event.target === selectedEl
    ) {
      hoverOutline.hidden = true;
      return;
    }

    const el = findTextLeaf(event.target);
    if (el === hoverEl) return;
    hoverEl = el;

    hoverOutline.hidden = false;
    positionOutline(hoverOutline, getVisualRect(el));
  });

  document.addEventListener(
    "click",
    function (event) {
      if (!active) return;
      if (panel.contains(event.target) || toggleBtn.contains(event.target)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      selectedEl = findTextLeaf(event.target);
      selectOutline.hidden = false;
      positionOutline(selectOutline, getVisualRect(selectedEl));
      buildPanel(selectedEl);
    },
    true
  );

  window.addEventListener("scroll", function () {
    if (!active) return;
    if (hoverEl && !hoverOutline.hidden) {
      positionOutline(hoverOutline, getVisualRect(hoverEl));
    }
    refreshSelectedOutline();
  });

  window.addEventListener("resize", function () {
    if (!active) return;
    if (hoverEl && !hoverOutline.hidden) {
      positionOutline(hoverOutline, getVisualRect(hoverEl));
    }
    refreshSelectedOutline();
  });

  applyStoredOverrides();
  setActive(active);

  // The stored overrides just resized/moved things the fit, label and
  // placement scripts above had already measured -- let them re-read.
  window.dispatchEvent(new Event("resize"));
})();


/* ========================================
   INTERACTIVE VARIABLE FOOTER
======================================== */
(function () {
  const variableFooter =
    document.querySelector(".variable-footer");

  const footerVariableWord =
    document.querySelector(".footer-variable-word");

  const footerAxisValue =
    document.querySelector(".footer-axis-value");

  if (!variableFooter || !footerVariableWord) return;

  let footerFrame;

  variableFooter.addEventListener("pointermove", function (event) {
    const bounds = variableFooter.getBoundingClientRect();
    const horizontal = Math.max(
      0,
      Math.min(1, (event.clientX - bounds.left) / bounds.width)
    );
    const vertical = Math.max(
      0,
      Math.min(1, (event.clientY - bounds.top) / bounds.height)
    );
    const weight = Math.round(100 + horizontal * 800);
    const slant = Math.round(-10 + vertical * 10);

    cancelAnimationFrame(footerFrame);
    footerFrame = requestAnimationFrame(function () {
      footerVariableWord.style.fontWeight = weight;
      footerVariableWord.style.fontVariationSettings =
        `"wght" ${weight}, "slnt" ${slant}`;

      if (footerAxisValue) {
        footerAxisValue.textContent =
          `Weight ${weight} / Slant ${slant}`;
      }
    });
  });
})();


/* ========================================
   TWO-LINE SPECIMEN ROWS
   A specimen row is a box with its word centred in it, so a word set on two
   lines (Gold & / Vellum) or a very short, very large one would eat
   the row's padding. Such a row gets
   the same padding above and below as the one-line rows around it (measured
   from them, so it holds at every width).
======================================== */
(function () {
  const rows = Array.from(document.querySelectorAll(".specimen"));

  function shown(row) {
    return !row.hidden && row.offsetHeight > 0;
  }

  // the word's own box: its lines x line-height (a phone gives the text a
  // fixed height, so never less than what is actually there)
  function boxHeight(text) {
    const lines = text.querySelectorAll("br").length + 1;
    const lineHeight = parseFloat(getComputedStyle(text).lineHeight) || 0;
    return Math.max(text.offsetHeight, lines * lineHeight);
  }

  // a row whose word is on two lines, or so short that it is fitted very large
  function special(row) {
    return !!row.querySelector(".specimen-text br, .specimen-text[data-keep-padding]");
  }

  function balanceTwoLineRows() {
    const single = rows.filter(function (row) {
      return shown(row) && !special(row);
    });
    const multi = rows.filter(function (row) {
      return shown(row) && special(row);
    });
    if (!single.length || !multi.length) return;

    const pads = single.map(function (row) {
      return (row.offsetHeight - boxHeight(row.querySelector(".specimen-text"))) / 2;
    });
    const pad = pads.reduce(function (a, b) { return a + b; }, 0) / pads.length;

    multi.forEach(function (row) {
      const text = row.querySelector(".specimen-text");
      row.style.minHeight = "";
      row.style.minHeight = Math.round(boxHeight(text) + 2 * pad) + "px";
    });
  }

  function later() {
    requestAnimationFrame(function () {
      requestAnimationFrame(balanceTwoLineRows);
    });
  }

  later();
  window.addEventListener("resize", later);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(later);
  }
})();
